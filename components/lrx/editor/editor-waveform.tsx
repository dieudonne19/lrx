import { buildWaveformPath } from '@/lib/lrx-editor-utils';
import * as React from 'react';
import { Pressable, useWindowDimensions } from 'react-native';
import Svg, { Circle, ClipPath, Defs, G, Line, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

const EDITOR_WAVEFORM = Array.from({ length: 64 }, (_, index) => {
  const value = Math.abs(Math.sin(index * 0.42) * Math.cos(index * 0.19));
  return 0.18 + value * 0.82;
});

export function EditorWaveform({
  progress,
  marks,
  duration,
  onSeek,
}: {
  progress: number;
  marks: (number | undefined)[];
  duration: number;
  onSeek: (time: number) => void;
}) {
  const { width: windowWidth } = useWindowDimensions();
  const width = Math.max(280, windowWidth - 40);
  const height = 72;
  const path = buildWaveformPath(EDITOR_WAVEFORM, width, height);
  const playheadX = Math.max(0, Math.min(width, progress * width));

  return (
    <Pressable
      onPress={(event) => {
        const x = event.nativeEvent.locationX;
        onSeek(Math.max(0, Math.min(duration, (x / width) * duration)));
      }}
      className="overflow-hidden rounded-xl">
      <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
        <Defs>
          <LinearGradient id="editorPast" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#9A82FF" />
            <Stop offset="1" stopColor="#7C5CFF" />
          </LinearGradient>
          <LinearGradient id="editorFuture" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#3A3D44" />
            <Stop offset="1" stopColor="#22252C" />
          </LinearGradient>
          <ClipPath id="pastClip">
            <Rect x={0} y={0} width={playheadX} height={height} />
          </ClipPath>
          <ClipPath id="futureClip">
            <Rect x={playheadX} y={0} width={width - playheadX} height={height} />
          </ClipPath>
        </Defs>
        <Line x1={0} x2={width} y1={height / 2} y2={height / 2} stroke="#1E2026" strokeWidth={1} />
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
              y1={4}
              y2={height - 4}
              stroke="#9A82FF"
              strokeWidth={1}
              opacity={0.5}
            />
          )
        )}
        <Line x1={playheadX} x2={playheadX} y1={0} y2={height} stroke="#F2F3F6" strokeWidth={1.2} />
        <Circle cx={playheadX} cy={6} r={4} fill="#F2F3F6" />
      </Svg>
    </Pressable>
  );
}
