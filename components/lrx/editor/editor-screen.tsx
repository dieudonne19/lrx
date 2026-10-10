import { EmptyState, Screen, ScreenBody } from '@/components/lrx';
import { Fade } from '@/components/lrx/fade';
import { ExportSheet, FineTuneSheet, ImportLyricsSheet } from '@/components/lrx/sheets';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import {
  findNextLyric,
  findPreviousLyric,
  formatTime,
  projectLyricsToEditorLyrics,
  projectToViewProject,
} from '@/lib/lrx-editor-utils';
import { tapFeedback } from '@/lib/haptics';
import { useLrxStore, type LrxProject } from '@/lib/lrx-store';
import type { LyricLineData } from '@/lib/lrx-ui-types';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack } from 'expo-router';
import { ArrowLeft, ChevronLeft, ChevronRight, Eye, FastForward, Maximize2, MoreHorizontal, Pause, Play, Redo2, Rewind, SlidersHorizontal, Undo2 } from 'lucide-react-native';
import * as React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { EditorWaveform } from './editor-waveform';
import { KaraokeMode } from './karaoke-mode';
import { LyricRow } from './lyric-row';

type EditorSnapshot = { lyrics: LyricLineData[]; activeIndex: number };

export function EditorScreen({
  projectId,
  onBack,
  onOpenMore,
}: {
  projectId: string;
  onBack: () => void;
  onOpenMore: () => void;
}) {
  const storedProject = useLrxStore((state) => state.projects.find((item) => item.id === projectId));
  if (!storedProject) return null;
  return <EditorSession storedProject={storedProject} onBack={onBack} onOpenMore={onOpenMore} />;
}

function EditorSession({
  storedProject,
  onBack,
  onOpenMore,
}: {
  storedProject: LrxProject;
  onBack: () => void;
  onOpenMore: () => void;
}) {
  const settings = useLrxStore((state) => state.settings);
  const updateStoredTimestamp = useLrxStore((state) => state.updateTimestamp);
  const importStoredLyrics = useLrxStore((state) => state.importLyrics);
  const updateStoredLyricText = useLrxStore((state) => state.updateLyricText);
  const restoreStoredLyrics = useLrxStore((state) => state.restoreLyrics);
  const project = React.useMemo(() => projectToViewProject(storedProject), [storedProject]);
  const lyrics = React.useMemo(() => projectLyricsToEditorLyrics(storedProject), [storedProject]);
  const [activeIndex, setActiveIndex] = React.useState(() => {
    const next = lyrics.findIndex((line) => line.text && line.t == null);
    return next === -1 ? 0 : next;
  });
  const [time, setTime] = React.useState(18.6);
  const [playing, setPlaying] = React.useState(false);
  const [speed, setSpeed] = React.useState<0.5 | 1 | 1.5>(settings.defaultSpeed);
  const [exportOpen, setExportOpen] = React.useState(false);
  const [karaokeOpen, setKaraokeOpen] = React.useState(false);
  const [editingIndex, setEditingIndex] = React.useState<number | null>(null);
  const editingRef = React.useRef<number | null>(null);
  const [importOpen, setImportOpen] = React.useState(false);
  const [fineTuneOpen, setFineTuneOpen] = React.useState(false);
  const [history, setHistory] = React.useState<EditorSnapshot[]>([]);
  const [future, setFuture] = React.useState<EditorSnapshot[]>([]);
  const scrollRef = React.useRef<ScrollView>(null);
  const rowOffsets = React.useRef<Record<number, number>>({});
  const duration = 222;
  const synced = lyrics.filter((line) => line.text && line.t != null).length;
  const total = lyrics.filter((line) => line.text).length;

  React.useEffect(() => {
    if (!playing) return;
    const timer = setInterval(() => {
      setTime((current) => {
        const next = Math.min(duration, current + 0.2 * speed);
        if (next >= duration) setPlaying(false);
        return next;
      });
    }, 200);

    return () => clearInterval(timer);
  }, [duration, playing, speed]);

  React.useEffect(() => {
    if (!settings.autoScroll) return;
    const offset = rowOffsets.current[activeIndex];
    if (offset == null) return;
    scrollRef.current?.scrollTo({ y: Math.max(0, offset - 120), animated: true });
  }, [activeIndex, settings.autoScroll]);

  function advance() {
    setActiveIndex((current) => findNextLyric(lyrics, current));
  }

  function retreat() {
    setActiveIndex((current) => findPreviousLyric(lyrics, current));
  }

  function tapTime() {
    const activeLine = lyrics[activeIndex];
    if (!activeLine?.text) return;
    tapFeedback(settings.haptics);
    setHistory((items) => [...items, { lyrics: lyrics.map((line) => ({ ...line })), activeIndex }]);
    setFuture([]);
    if (activeLine.id) updateStoredTimestamp(project.id, activeLine.id, time);
    setActiveIndex((current) => findNextLyric(lyrics, current));
  }

  function restoreLyricsSnapshot(snapshot: LyricLineData[]) {
    restoreStoredLyrics(
      project.id,
      snapshot.map((line, index) => ({ id: line.id ?? `${project.id}-restored-${index}`, text: line.text, t: line.t }))
    );
  }

  function commitLyricEdit(index: number, nextText: string) {
    if (editingRef.current !== index) return;
    editingRef.current = null;
    setEditingIndex(null);
    const line = lyrics[index];
    const text = nextText.replace(/s+/g, ' ').trim();
    if (!line?.id || !text || text === line.text) return;
    setHistory((items) => [...items, { lyrics: lyrics.map((item) => ({ ...item })), activeIndex }]);
    setFuture([]);
    updateStoredLyricText(project.id, line.id, text);
  }

  function undo() {
    const previous = history.at(-1);
    if (!previous) return;
    setFuture((items) => [...items, { lyrics: lyrics.map((line) => ({ ...line })), activeIndex }]);
    restoreLyricsSnapshot(previous.lyrics);
    setActiveIndex(previous.activeIndex);
    setHistory((items) => items.slice(0, -1));
  }

  function redo() {
    const next = future.at(-1);
    if (!next) return;
    setHistory((items) => [...items, { lyrics: lyrics.map((line) => ({ ...line })), activeIndex }]);
    restoreLyricsSnapshot(next.lyrics);
    setActiveIndex(next.activeIndex);
    setFuture((items) => items.slice(0, -1));
  }

  function cycleSpeed() {
    setSpeed((current) => (current === 0.5 ? 1 : current === 1 ? 1.5 : 0.5));
  }

  function updateActiveTimestamp(nextTime: number) {
    const activeLine = lyrics[activeIndex];
    if (!activeLine?.text) return;
    const boundedTime = Math.max(0, Math.min(duration, nextTime));
    setHistory((items) => [...items, { lyrics: lyrics.map((line) => ({ ...line })), activeIndex }]);
    setFuture([]);
    if (activeLine.id) updateStoredTimestamp(project.id, activeLine.id, boundedTime);
    setTime(boundedTime);
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <Screen>
        <ScreenBody>
          <View className="flex-row items-center gap-2 px-3 pb-2 pt-2">
            <Button variant="ghost" size="icon" onPress={onBack} className="rounded-full">
              <Icon as={ArrowLeft} className="size-5 text-foreground" />
            </Button>
            <View className="min-w-0 flex-1 items-center">
              <Text numberOfLines={1} className="text-sm font-semibold text-foreground">
                {project.title}
              </Text>
              <Text className="mt-0.5 font-mono text-[10.5px] text-muted-foreground">
                {synced}/{total} synchronises - {speed}x
              </Text>
            </View>
            <View className="flex-row">
              <Button variant="ghost" size="icon" onPress={() => setKaraokeOpen(true)} className="rounded-full">
                <Icon as={Maximize2} className="size-[18px] text-foreground" />
              </Button>
              <Button variant="ghost" size="icon" onPress={undo} disabled={!history.length} className="rounded-full">
                <Icon as={Undo2} className="size-[18px] text-foreground" />
              </Button>
              <Button variant="ghost" size="icon" onPress={redo} disabled={!future.length} className="rounded-full">
                <Icon as={Redo2} className="size-[18px] text-foreground" />
              </Button>
              <Button variant="ghost" size="icon" onPress={onOpenMore} className="rounded-full">
                <Icon as={MoreHorizontal} className="size-5 text-foreground" />
              </Button>
            </View>
          </View>

          <View className="border-b border-border/60 bg-popover/60 px-[18px] pb-3.5 pt-1">
            <View className="mb-2 flex-row items-end justify-between">
              <Text className="font-mono text-[22px] font-semibold leading-7 tracking-[-0.44px] text-foreground">{formatTime(time)}</Text>
              <Text className="font-mono text-xs text-subtle">{formatTime(duration)}</Text>
            </View>
            <EditorWaveform
              progress={time / duration}
              marks={lyrics.map((line) => line.t)}
              duration={duration}
              onSeek={(nextTime) => setTime(nextTime)}
            />

            <View className="mt-4 flex-row items-center justify-between">
              <Button variant="ghost" onPress={cycleSpeed} className="h-10 w-16 rounded-xl px-0">
                <Text className="font-mono text-xs">{speed}x</Text>
              </Button>
              <View className="flex-row items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onPress={() => setTime((current) => Math.max(0, current - 5))}
                  className="rounded-full">
                  <Icon as={Rewind} className="size-5 text-foreground" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onPress={() => setPlaying((current) => !current)}
                  style={{ shadowColor: '#FFFFFF', shadowOpacity: 0.08, shadowRadius: 20, shadowOffset: { width: 0, height: 6 } }}
                  className="size-14 rounded-full border-0 bg-foreground">
                  <Icon as={playing ? Pause : Play} className="size-6 text-background" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onPress={() => setTime((current) => Math.min(duration, current + 5))}
                  className="rounded-full">
                  <Icon as={FastForward} className="size-5 text-foreground" />
                </Button>
              </View>
              <View className="flex-row items-center gap-1">
                <Button variant="ghost" size="icon" onPress={() => setFineTuneOpen(true)} className="rounded-full">
                  <Icon as={SlidersHorizontal} className="size-5 text-foreground" />
                </Button>
                <Button variant="ghost" size="icon" onPress={() => setExportOpen(true)} className="rounded-full">
                  <Icon as={Eye} className="size-5 text-foreground" />
                </Button>
              </View>
            </View>
          </View>

          {lyrics.length === 0 ? (
            <EmptyState
              illustration="lyrics"
              title="Pas encore de paroles"
              body="Colle les paroles de ce titre pour commencer à poser les timestamps."
              cta="Importer des paroles"
              onCta={() => setImportOpen(true)}
            />
          ) : null}
          <View className="flex-1">
          <ScrollView ref={scrollRef} className="flex-1" contentContainerClassName="pb-[220px] pt-6" showsVerticalScrollIndicator={false}>
            {lyrics.map((line, index) => (
              <LyricRow
                key={`${index}-${line.text}`}
                line={line}
                index={index}
                active={index === activeIndex}
                editing={index === editingIndex}
                onEdit={() => {
                  if (!line.text) return;
                  setActiveIndex(index);
                  editingRef.current = index;
                  setEditingIndex(index);
                }}
                onCommitEdit={(text) => commitLyricEdit(index, text)}
                onLayout={(event) => {
                  rowOffsets.current[index] = event.nativeEvent.layout.y;
                }}
                past={index < activeIndex && Boolean(line.text)}
                onPress={() => {
                  if (line.text) setActiveIndex(index);
                }}
                onFineTune={() => {
                  if (line.text) {
                    setActiveIndex(index);
                    setFineTuneOpen(true);
                  }
                }}
              />
            ))}
          </ScrollView>
          <Fade direction="down" className="absolute left-0 right-0 top-0 h-8" />
          </View>

          {editingIndex == null ? (
            <>
              <Fade direction="up" className="absolute bottom-0 left-0 right-0 h-[140px]" />
              <View className="absolute bottom-[18px] left-3.5 right-3.5 flex-row items-stretch gap-2">
                <Button variant="outline" size="icon" onPress={retreat} className="h-16 w-14 rounded-[18px] border-border bg-secondary">
                  <Icon as={ChevronLeft} className="size-6 text-foreground" />
                </Button>
                <Pressable
                  onPress={tapTime}
                  accessibilityLabel="Tap time"
                  style={{ shadowColor: '#7C5CFF', shadowOpacity: 0.45, shadowRadius: 20, shadowOffset: { width: 0, height: 14 }, elevation: 10 }}
                  className="h-16 flex-1 rounded-[18px]">
                  <View className="h-16 flex-row items-center justify-center gap-3 overflow-hidden rounded-[18px] px-[18px]">
                    <LinearGradient colors={['#9A82FF', '#7C5CFF']} style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }} />
                    <View
                      style={{ shadowColor: '#FFFFFF', shadowOpacity: 0.8, shadowRadius: 6, shadowOffset: { width: 0, height: 0 } }}
                      className={`size-2 rounded-full bg-white ${playing ? 'opacity-100' : 'opacity-60'}`}
                    />
                    <Text className="text-[15px] font-bold uppercase tracking-[3.3px] text-white">Tap Time</Text>
                  </View>
                </Pressable>
                <Button variant="outline" size="icon" onPress={advance} className="h-16 w-14 rounded-[18px] border-border bg-secondary">
                  <Icon as={ChevronRight} className="size-6 text-foreground" />
                </Button>
              </View>
            </>
          ) : null}
        </ScreenBody>
      </Screen>
      {importOpen ? (
        <ImportLyricsSheet
          onClose={() => setImportOpen(false)}
          onCreate={(lines) => {
            importStoredLyrics(project.id, lines);
            setActiveIndex(0);
            setImportOpen(false);
          }}
        />
      ) : null}
      {exportOpen ? (
        <ExportSheet
          project={project}
          lyrics={lyrics}
          confirmUnsynced={settings.confirmUnsyncedExport}
          onClose={() => setExportOpen(false)}
        />
      ) : null}
      {fineTuneOpen ? (
        <FineTuneSheet
          line={lyrics[activeIndex]}
          index={activeIndex}
          time={lyrics[activeIndex]?.t ?? time}
          duration={duration}
          onClose={() => setFineTuneOpen(false)}
          onSave={(nextTime) => {
            updateActiveTimestamp(nextTime);
            setFineTuneOpen(false);
          }}
        />
      ) : null}
      {karaokeOpen ? (
        <KaraokeMode
          project={project}
          lyrics={lyrics}
          time={time}
          duration={duration}
          playing={playing}
          onClose={() => setKaraokeOpen(false)}
          onTogglePlay={() => setPlaying((current) => !current)}
          onSeekBy={(seconds) => setTime((current) => Math.max(0, Math.min(duration, current + seconds)))}
        />
      ) : null}
    </>
  );
}
