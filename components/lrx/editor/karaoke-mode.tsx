import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { findDisplayLyric, formatTime } from '@/lib/lrx-editor-utils';
import type { LyricLineData, Project } from '@/lib/lrx-ui-types';
import { ChevronLeft, ChevronRight, Mic2, Pause, Play, X } from 'lucide-react-native';
import * as React from 'react';
import { Pressable, View } from 'react-native';

export function KaraokeMode({
  project,
  lyrics,
  activeIndex,
  time,
  duration,
  playing,
  speed,
  synced,
  total,
  onClose,
  onTapTime,
  onAdvance,
  onRetreat,
  onTogglePlay,
  onCycleSpeed,
}: {
  project: Project;
  lyrics: LyricLineData[];
  activeIndex: number;
  time: number;
  duration: number;
  playing: boolean;
  speed: 0.5 | 1 | 1.5;
  synced: number;
  total: number;
  onClose: () => void;
  onTapTime: () => void;
  onAdvance: () => void;
  onRetreat: () => void;
  onTogglePlay: () => void;
  onCycleSpeed: () => void;
}) {
  const previousLine = findDisplayLyric(lyrics, activeIndex, -1);
  const activeLine = lyrics[activeIndex]?.text || 'Aucune ligne active';
  const nextLine = findDisplayLyric(lyrics, activeIndex, 1);
  const progress = Math.max(0, Math.min(1, time / duration));

  return (
    <View className="absolute inset-0 z-50 bg-background">
      <View className="absolute left-0 right-0 top-0 h-52 bg-primary/10" />
      <View className="flex-1 px-5 pb-5 pt-4">
        <View className="flex-row items-center justify-between">
          <View className="min-w-0 flex-1">
            <View className="flex-row items-center gap-2">
              <Icon as={Mic2} className="size-4 text-primary" />
              <Text className="text-xs font-semibold uppercase tracking-[2px] text-primary">Karaoke mode</Text>
            </View>
            <Text numberOfLines={1} className="mt-2 text-xl font-semibold text-foreground">
              {project.title}
            </Text>
            <Text className="mt-1 text-xs text-muted-foreground">
              {synced}/{total} lignes - {speed}x
            </Text>
          </View>
          <Button variant="ghost" size="icon" onPress={onClose} className="rounded-full">
            <Icon as={X} className="size-5 text-foreground" />
          </Button>
        </View>

        <View className="mt-8 h-2 overflow-hidden rounded-full bg-input">
          <View className="h-full rounded-full bg-primary" style={{ width: `${progress * 100}%` }} />
        </View>
        <View className="mt-2 flex-row justify-between">
          <Text className="font-mono text-xs text-muted-foreground">{formatTime(time)}</Text>
          <Text className="font-mono text-xs text-muted-foreground">{formatTime(duration)}</Text>
        </View>

        <View className="flex-1 justify-center">
          <Text numberOfLines={2} className="mb-8 text-center text-lg leading-7 text-muted-foreground opacity-60">
            {previousLine || ' '}
          </Text>

          <View className="items-center">
            <View className="mb-5 rounded-full border border-primary/35 bg-primary/10 px-4 py-2">
              <Text className="font-mono text-xs font-semibold text-primary">
                {lyrics[activeIndex]?.t == null ? 'READY' : formatTime(lyrics[activeIndex].t)}
              </Text>
            </View>
            <Text className="text-center text-[34px] font-semibold leading-[42px] text-foreground">
              {activeLine}
            </Text>
          </View>

          <Text numberOfLines={2} className="mt-8 text-center text-lg leading-7 text-muted-foreground opacity-70">
            {nextLine || ' '}
          </Text>
        </View>

        <View className="mb-4 flex-row items-center justify-center gap-3">
          <Button variant="outline" size="icon" onPress={onRetreat} className="size-12 rounded-full bg-card">
            <Icon as={ChevronLeft} className="size-5 text-foreground" />
          </Button>
          <Button variant="outline" size="icon" onPress={onTogglePlay} className="size-14 rounded-full bg-foreground">
            <Icon as={playing ? Pause : Play} className="size-6 text-background" />
          </Button>
          <Button variant="outline" size="icon" onPress={onAdvance} className="size-12 rounded-full bg-card">
            <Icon as={ChevronRight} className="size-5 text-foreground" />
          </Button>
        </View>

        <View className="flex-row items-center gap-2">
          <Button variant="outline" onPress={onCycleSpeed} className="h-16 w-20 rounded-2xl bg-card px-0">
            <Text className="font-mono text-sm">{speed}x</Text>
          </Button>
          <Pressable
            onPress={onTapTime}
            className="h-16 flex-1 flex-row items-center justify-center gap-3 rounded-2xl bg-primary px-5">
            <View className={`size-2 rounded-full bg-white ${playing ? 'opacity-100' : 'opacity-60'}`} />
            <Text className="text-[15px] font-bold uppercase tracking-[3px] text-primary-foreground">Tap Time</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
