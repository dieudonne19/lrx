import { useLrxStore, type LrxProject } from '@/lib/lrx-store';
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import * as React from 'react';

export type PlaybackSpeed = 0.5 | 1 | 1.5;

const SPEEDS: PlaybackSpeed[] = [0.5, 1, 1.5];

// Without this, iOS stays silent when the ring/silent switch is on.
setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});

export function useEditorAudio(project: LrxProject, defaultSpeed: PlaybackSpeed) {
  const setStoredDuration = useLrxStore((state) => state.setDuration);
  const player = useAudioPlayer(project.audioUri ? { uri: project.audioUri } : null, { updateInterval: 100 });
  const status = useAudioPlayerStatus(player);
  const [speed, setSpeed] = React.useState<PlaybackSpeed>(defaultSpeed);

  const hasAudio = Boolean(project.audioUri);

  React.useEffect(() => {
    if (!__DEV__) return;
    console.log('[audio]', {
      uri: project.audioUri,
      isLoaded: status.isLoaded,
      playing: status.playing,
      duration: status.duration,
      playbackState: status.playbackState,
      reason: status.reasonForWaitingToPlay,
      error: status.error,
    });
  }, [project.audioUri, status.isLoaded, status.playing, status.duration, status.playbackState, status.reasonForWaitingToPlay, status.error]);
  const loadedDuration = status.isLoaded && status.duration > 0 ? status.duration : 0;
  const duration = loadedDuration || project.durationSec || 0;
  const time = Math.min(status.currentTime, duration || status.currentTime);

  // Learn the real duration the first time the file loads so the home list can show it.
  React.useEffect(() => {
    if (loadedDuration) setStoredDuration(project.id, Math.round(loadedDuration * 10) / 10);
  }, [loadedDuration, project.id, setStoredDuration]);

  React.useEffect(() => {
    if (status.isLoaded) player.setPlaybackRate(speed);
  }, [player, speed, status.isLoaded]);

  const seekTo = React.useCallback(
    (seconds: number) => {
      if (!hasAudio) return;
      player.seekTo(Math.max(0, duration ? Math.min(duration, seconds) : seconds)).catch(() => {});
    },
    [duration, hasAudio, player]
  );

  // Live position for TAP TIME: the status time is only refreshed every 100 ms.
  const getTime = React.useCallback(() => player.currentTime, [player]);

  const seekBy = React.useCallback((delta: number) => seekTo(player.currentTime + delta), [player, seekTo]);

  const toggle = React.useCallback(() => {
    if (!hasAudio) return;
    if (__DEV__) console.log('[audio] toggle', { playing: player.playing, isLoaded: player.isLoaded });
    if (player.playing) {
      player.pause();
      return;
    }
    // Restart from the beginning when playback reached the end.
    if (duration && player.currentTime >= duration - 0.05) player.seekTo(0).catch(() => {});
    player.play();
  }, [duration, hasAudio, player]);

  const cycleSpeed = React.useCallback(() => {
    setSpeed((current) => SPEEDS[(SPEEDS.indexOf(current) + 1) % SPEEDS.length]);
  }, []);

  return {
    hasAudio,
    time,
    duration,
    playing: status.playing,
    speed,
    error: hasAudio ? status.error : null,
    seekTo,
    seekBy,
    getTime,
    toggle,
    cycleSpeed,
  };
}
