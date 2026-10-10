import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { formatTime } from '@/lib/lrx-editor-utils';
import type { LyricLineData } from '@/lib/lrx-ui-types';
import { SlidersHorizontal } from 'lucide-react-native';
import * as React from 'react';
import { LayoutChangeEvent, Pressable, View } from 'react-native';

export function LyricRow({
  line,
  index,
  active,
  past,
  onPress,
  onFineTune,
  onLayout,
}: {
  line: LyricLineData;
  index: number;
  active: boolean;
  past: boolean;
  onPress: () => void;
  onFineTune: () => void;
  onLayout?: (event: LayoutChangeEvent) => void;
}) {
  const instrumental = !line.text;
  const textClass = active
    ? 'text-[22px] font-semibold leading-7 text-foreground'
    : past
      ? 'text-base leading-6 text-muted-foreground'
      : 'text-base leading-6 text-muted';
  const timestamp = line.t == null ? (active ? '....' : '') : formatTime(line.t);

  return (
    <Pressable
      onPress={onPress}
      onLayout={onLayout}
      className={`flex-row items-baseline gap-3 px-5 py-3 ${active ? 'border-l-2 border-primary bg-primary/10 pl-[18px]' : ''}`}>
      <Text className={`w-14 text-right font-mono text-[11px] ${active ? 'text-primary' : 'text-muted-foreground'}`}>
        {timestamp}
      </Text>
      {instrumental ? (
        <View className="flex-row items-center gap-1.5">
          <View className="size-1 rounded-full bg-muted" />
          <View className="size-1 rounded-full bg-muted" />
          <View className="size-1 rounded-full bg-muted" />
          <Text className="ml-2 text-[11px] uppercase tracking-[1.6px] text-muted">Instrumental</Text>
        </View>
      ) : (
        <View className="min-w-0 flex-1 flex-row items-center gap-2">
          <Text className={`min-w-0 flex-1 ${textClass}`}>{line.text}</Text>
          {active ? (
            <Pressable
              onPress={(event) => {
                event.stopPropagation();
                onFineTune();
              }}
              className="size-9 items-center justify-center rounded-full border border-primary/25 bg-primary/10">
              <Icon as={SlidersHorizontal} className="size-4 text-primary" />
            </Pressable>
          ) : null}
        </View>
      )}
    </Pressable>
  );
}
