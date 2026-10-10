import { ProjectCover, Screen } from '@/components/lrx';
import { Fade } from '@/components/lrx/fade';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { formatTime } from '@/lib/lrx-editor-utils';
import type { LyricLineData, Project } from '@/lib/lrx-ui-types';
import { LinearGradient } from 'expo-linear-gradient';
import type { AudioPlayer } from 'expo-audio';
import { ChevronDown, FastForward, Pause, Play, Rewind } from 'lucide-react-native';
import * as React from 'react';
import { ScrollView, View } from 'react-native';
import { usePlaybackTime } from './use-editor-audio';

const ROW_HEIGHT = 56;
const GLOW = { textShadowColor: 'rgba(124, 92, 255, 0.5)', textShadowRadius: 32, textShadowOffset: { width: 0, height: 0 } };

// The active line follows the playback time: the last synchronized line whose timestamp has passed.
function findLineAtTime(lyrics: LyricLineData[], time: number) {
  let active = -1;
  lyrics.forEach((line, index) => {
    if (line.t != null && line.t <= time) active = index;
  });
  return active;
}

export function KaraokeMode({
  project,
  lyrics,
  player,
  duration,
  playing,
  onClose,
  onTogglePlay,
  onSeekBy,
}: {
  project: Project;
  lyrics: LyricLineData[];
  player: AudioPlayer;
  duration: number;
  playing: boolean;
  onClose: () => void;
  onTogglePlay: () => void;
  onSeekBy: (seconds: number) => void;
}) {
  const time = usePlaybackTime(player);
  const scrollRef = React.useRef<ScrollView>(null);
  const [viewportHeight, setViewportHeight] = React.useState(0);
  const activeIndex = React.useMemo(() => findLineAtTime(lyrics, time), [lyrics, time]);
  const progress = Math.max(0, Math.min(1, time / duration));
  const edgePadding = Math.max(0, viewportHeight / 2 - ROW_HEIGHT / 2);

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ y: Math.max(0, activeIndex) * ROW_HEIGHT, animated: true });
  }, [activeIndex, viewportHeight]);

  return (
    <Screen className="absolute inset-0 z-50">
      <LinearGradient
        colors={['rgba(124, 92, 255, 0.18)', 'rgba(124, 92, 255, 0)']}
        style={{ position: 'absolute', top: 0, right: 0, left: 0, height: 320 }}
      />

      <View className="flex-row items-center justify-between px-3 pb-2 pt-3">
        <Button variant="ghost" size="icon" accessibilityLabel="Fermer l’aperçu" onPress={onClose} className="size-12 rounded-full">
          <Icon as={ChevronDown} className="size-5 text-foreground" />
        </Button>
        <Text className="text-[11px] font-semibold uppercase tracking-[1.32px] text-primary-hi">Aperçu live</Text>
        <View className="size-12" />
      </View>

      <View className="items-center gap-3 px-8 pb-3 pt-5">
        <View
          style={{ shadowColor: '#7C5CFF', shadowOpacity: 0.35, shadowRadius: 30, shadowOffset: { width: 0, height: 24 }, elevation: 12 }}>
          <ProjectCover colors={project.cover} size={88} index={0} />
        </View>
        <View className="items-center">
          <Text numberOfLines={1} className="text-[17px] font-semibold text-foreground">
            {project.title}
          </Text>
          <Text numberOfLines={1} className="mt-0.5 text-[13px] text-muted-foreground">
            {project.artist}
          </Text>
        </View>
      </View>

      <View className="flex-1" onLayout={(event) => setViewportHeight(event.nativeEvent.layout.height)}>
        <ScrollView
          ref={scrollRef}
          scrollEnabled={false}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: edgePadding, paddingBottom: edgePadding }}>
          {lyrics.map((line, index) => {
            const distance = Math.abs(index - activeIndex);
            const active = index === activeIndex;
            const opacity = distance > 3 ? Math.max(0, 1 - (distance - 3) * 0.3) : 1;
            const color = active ? 'text-foreground' : distance <= 2 ? 'text-muted-foreground' : 'text-subtle';

            return (
              <View key={line.id ?? index} style={{ height: ROW_HEIGHT, opacity }} className="items-center justify-center px-8">
                <Text
                  numberOfLines={2}
                  style={active ? GLOW : undefined}
                  className={`text-center tracking-[-0.3px] ${color} ${
                    active ? 'text-[22px] font-semibold' : 'text-[17px]'
                  } ${line.text ? '' : 'italic'}`}>
                  {line.text || '· · ·'}
                </Text>
              </View>
            );
          })}
        </ScrollView>
        <Fade direction="down" className="absolute left-0 right-0 top-0 h-20" />
        <Fade direction="up" className="absolute bottom-0 left-0 right-0 h-[100px]" />
      </View>

      <View className="px-7 pb-[22px]">
        <View
          accessibilityRole="progressbar"
          accessibilityValue={{ min: 0, max: Math.round(duration), now: Math.round(time) }}
          className="mb-2 h-[3px] overflow-hidden rounded-full bg-secondary">
          <View className="h-full bg-primary" style={{ width: `${progress * 100}%` }} />
        </View>
        <View className="mb-2.5 flex-row justify-between">
          <Text className="font-mono text-[11px] text-muted-foreground">{formatTime(time)}</Text>
          <Text className="font-mono text-[11px] text-muted-foreground">{formatTime(duration)}</Text>
        </View>
        <View className="flex-row items-center justify-center gap-[18px]">
          <Button variant="ghost" size="icon" accessibilityLabel="Reculer de 5 secondes" onPress={() => onSeekBy(-5)} className="size-12 rounded-full">
            <Icon as={Rewind} className="size-[22px] text-foreground" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            accessibilityLabel={playing ? 'Pause' : 'Lecture'}
            onPress={onTogglePlay}
            className="size-14 rounded-full border-0 bg-foreground">
            <Icon as={playing ? Pause : Play} className="size-[22px] text-background" />
          </Button>
          <Button variant="ghost" size="icon" accessibilityLabel="Avancer de 5 secondes" onPress={() => onSeekBy(5)} className="size-12 rounded-full">
            <Icon as={FastForward} className="size-[22px] text-foreground" />
          </Button>
        </View>
      </View>
    </Screen>
  );
}
