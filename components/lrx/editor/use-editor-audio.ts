import { useLrxStore, type LrxProject } from '@/lib/lrx-store';
import { setAudioModeAsync, useAudioPlayer, type AudioPlayer, type AudioStatus } from 'expo-audio';
import * as React from 'react';

export type PlaybackSpeed = 0.5 | 1 | 1.5;

const SPEEDS: PlaybackSpeed[] = [0.5, 1, 1.5];

// Without this, iOS stays silent when the ring/silent switch is on.
setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});

type PlaybackFlags = { isLoaded: boolean; playing: boolean; duration: number; error: string | null };

function toFlags(status: AudioStatus): PlaybackFlags {
  return { isLoaded: status.isLoaded, playing: status.playing, duration: status.duration, error: status.error };
}

// The player reports its position every few milliseconds. Subscribing to that in the screen would
// re-render every lyric row ten times a second and block the JS thread, delaying TAP TIME. So the
// screen only tracks these rarely-changing flags, and the time is read by small components below.
export function useEditorAudio(project: LrxProject, defaultSpeed: PlaybackSpeed) {
  const setStoredDuration = useLrxStore((state) => state.setDuration);
  const player = useAudioPlayer(project.audioUri ? { uri: project.audioUri } : null, { updateInterval: 100 });
  const [flags, setFlags] = React.useState<PlaybackFlags>(() => toFlags(player.currentStatus));
  const [speed, setSpeed] = React.useState<PlaybackSpeed>(defaultSpeed);

  React.useEffect(() => {
    const apply = (status: AudioStatus) => {
      const next = toFlags(status);
      setFlags((previous) =>
        previous.isLoaded === next.isLoaded &&
        previous.playing === next.playing &&
        previous.duration === next.duration &&
        previous.error === next.error
          ? previous
          : next
      );
    };
    apply(player.currentStatus);
    const subscription = player.addListener('playbackStatusUpdate', apply);
    return () => subscription.remove();
  }, [player]);

  const hasAudio = Boolean(project.audioUri);
  const loadedDuration = flags.isLoaded && flags.duration > 0 ? flags.duration : 0;
  const duration = loadedDuration || project.durationSec || 0;

  // Learn the real duration the first time the file loads so the home list can show it.
  React.useEffect(() => {
    if (loadedDuration) setStoredDuration(project.id, Math.round(loadedDuration * 10) / 10);
  }, [loadedDuration, project.id, setStoredDuration]);

  React.useEffect(() => {
    if (flags.isLoaded) player.setPlaybackRate(speed);
  }, [player, speed, flags.isLoaded]);

  const seekTo = React.useCallback(
    (seconds: number) => {
      if (!hasAudio) return;
      player.seekTo(Math.max(0, duration ? Math.min(duration, seconds) : seconds)).catch(() => {});
    },
    [duration, hasAudio, player]
  );

  // Live position, read on demand (for TAP TIME) rather than kept in React state.
  const getTime = React.useCallback(() => player.currentTime, [player]);

  const seekBy = React.useCallback((delta: number) => seekTo(player.currentTime + delta), [player, seekTo]);

  const toggle = React.useCallback(() => {
    if (!hasAudio) return;
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
    player,
    hasAudio,
    duration,
    playing: flags.playing,
    speed,
    error: hasAudio ? flags.error : null,
    seekTo,
    seekBy,
    getTime,
    toggle,
    cycleSpeed,
  };
}

// For the few components that must follow the position (timecode, waveform, live preview).
export function usePlaybackTime(player: AudioPlayer) {
  const [time, setTime] = React.useState(() => player.currentTime);

  React.useEffect(() => {
    setTime(player.currentTime);
    const subscription = player.addListener('playbackStatusUpdate', (status) => setTime(status.currentTime));
    return () => subscription.remove();
  }, [player]);

  return time;
}
