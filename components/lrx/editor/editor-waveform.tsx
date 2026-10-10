import { buildWaveformPath } from '@/lib/lrx-editor-utils';
import type { AudioPlayer } from 'expo-audio';
import { usePlaybackTime } from './use-editor-audio';
import * as React from 'react';
import { Pressable, useWindowDimensions, View } from 'react-native';
import Svg, { ClipPath, Defs, G, Line, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

// Pseudo waveform from the mockup: a slow envelope, a faster ripple and a little deterministic noise.
function generateWaveform(count: number, seed: number) {
  let state = seed;
  const random = () => {
    state = (state * 9301 + 49297) % 233280;
    return state / 233280;
  };

  return Array.from({ length: count }, (_, index) => {
    const x = index / count;
    const envelope = 0.5 + 0.5 * Math.sin(x * Math.PI * 2.4);
    const ripple = 0.4 + 0.6 * Math.abs(Math.sin(x * 18 + Math.cos(x * 3) * 2));
    const noise = 0.65 + 0.35 * random();
    return Math.max(0.05, envelope * ripple * noise);
  });
}

// Extracting real amplitudes needs a native module (not available in Expo Go), so the shape is a
// simplified envelope seeded per project: it is stable for a project but does not follow the audio.
function seedFromId(id: string) {
  let seed = 7;
  for (let index = 0; index < id.length; index += 1) seed = (seed * 31 + id.charCodeAt(index)) % 233280;
  return seed || 11;
}

const HEIGHT = 68;
const SIDE_PADDING = 36;

export function EditorWaveform({
  seed,
  player,
  marks,
  duration,
  onSeek,
}: {
  seed: string;
  player: AudioPlayer;
  marks: (number | undefined)[];
  duration: number;
  onSeek: (time: number) => void;
}) {
  const { width: windowWidth } = useWindowDimensions();
  const width = Math.max(280, windowWidth - SIDE_PADDING);
  const path = React.useMemo(
    () => buildWaveformPath(generateWaveform(220, seedFromId(seed)), width, HEIGHT),
    [seed, width]
  );
  const time = usePlaybackTime(player);
  const progress = duration ? time / duration : 0;
  const playheadX = Math.max(0, Math.min(width, progress * width));

  return (
    <Pressable
      accessibilityRole="adjustable"
      accessibilityLabel="Position de lecture"
      onPress={(event) => {
        const x = event.nativeEvent.locationX;
        onSeek(Math.max(0, Math.min(duration, (x / width) * duration)));
      }}
      style={{ height: HEIGHT }}>
      <Svg width="100%" height={HEIGHT} viewBox={`0 0 ${width} ${HEIGHT}`}>
        <Defs>
          <LinearGradient id="editorPast" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#7C5CFF" stopOpacity={0.95} />
            <Stop offset="1" stopColor="#7C5CFF" stopOpacity={0.7} />
          </LinearGradient>
          <LinearGradient id="editorFuture" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#3A3D44" stopOpacity={0.95} />
            <Stop offset="1" stopColor="#22252C" stopOpacity={0.85} />
          </LinearGradient>
          <ClipPath id="pastClip">
            <Rect x={0} y={0} width={playheadX} height={HEIGHT} />
          </ClipPath>
          <ClipPath id="futureClip">
            <Rect x={playheadX} y={0} width={width - playheadX} height={HEIGHT} />
          </ClipPath>
        </Defs>
        <Line x1={0} x2={width} y1={HEIGHT / 2} y2={HEIGHT / 2} stroke="#1E2026" strokeWidth={1} />
        <G clipPath="url(#futureClip)">
          <Path d={path} fill="url(#editorFuture)" />
        </G>
        <G clipPath="url(#pastClip)">
          <Path d={path} fill="url(#editorPast)" />
        </G>
        {marks.map((mark, index) =>
          mark == null ? null : (
            <Line
              key={`${mark}-${index}`}
              x1={(mark / duration) * width}
              x2={(mark / duration) * width}
              y1={2}
              y2={HEIGHT - 2}
              stroke="#9A82FF"
              strokeWidth={1}
              strokeDasharray="3 3"
              opacity={0.5}
            />
          )
        )}
        <Line x1={playheadX} x2={playheadX} y1={0} y2={HEIGHT} stroke="#FFFFFF" strokeWidth={1.5} />
      </Svg>
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: playheadX - 5,
          top: -4,
          width: 10,
          height: 10,
          borderRadius: 5,
          backgroundColor: '#FFFFFF',
          shadowColor: '#FFFFFF',
          shadowOpacity: 0.6,
          shadowRadius: 6,
          shadowOffset: { width: 0, height: 0 },
        }}
      />
    </Pressable>
  );
}
