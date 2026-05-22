import { EmptyState, LrxMark, ProjectCover, Screen, ScreenBody } from '@/components/lrx';
import { OnboardingScreen, SettingsScreen } from '@/components/lrx/screens';
import { AudioPickerSheet, ExportSheet, FineTuneSheet, ImportLyricsSheet, MetadataSheet } from '@/components/lrx/sheets';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import {
  buildWaveformPath,
  findDisplayLyric,
  findNextLyric,
  findPreviousLyric,
  formatTime,
  normalizeAudioTitle,
  projectLyricsToEditorLyrics,
  projectToViewProject,
} from '@/lib/lrx-editor-utils';
import { useLrxStore } from '@/lib/lrx-store';
import type {
  AppView,
  LyricLineData,
  Project,
  ProjectFilter,
  SettingsPreferences,
} from '@/lib/lrx-ui-types';
import { Stack } from 'expo-router';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Eye,
  FastForward,
  FileText,
  FolderOpen,
  Maximize2,
  Mic2,
  MoreHorizontal,
  Music2,
  Pause,
  Play,
  Redo2,
  Rewind,
  Search,
  Settings,
  SlidersHorizontal,
  Undo2,
  Upload,
  X,
} from 'lucide-react-native';
import * as React from 'react';
import { Pressable, ScrollView, useWindowDimensions, View } from 'react-native';
import Svg, { Circle, ClipPath, Defs, G, Line, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

const PROJECTS: Project[] = [
  {
    id: 'neons',
    title: 'Sous les neons',
    artist: 'Camille Roux',
    duration: '03:42',
    updated: 'il y a 12 min',
    synced: 38,
    total: 52,
    status: 'in-progress',
    cover: ['#7C5CFF', '#3B2BFF'],
  },
  {
    id: 'after-hours',
    title: 'After Hours Demo',
    artist: 'Noir Atelier',
    duration: '02:58',
    updated: 'hier',
    synced: 44,
    total: 44,
    status: 'done',
    cover: ['#3FD17A', '#0A7F55'],
  },
  {
    id: 'draft-voice',
    title: 'Voice memo 18',
    artist: 'Session importee',
    duration: '01:41',
    updated: 'lun.',
    synced: 0,
    total: 29,
    status: 'draft',
    cover: ['#F5B547', '#7C5CFF'],
  },
  {
    id: 'echoes',
    title: 'Echoes rough mix',
    artist: 'Line Input',
    duration: '04:11',
    updated: '12 mai',
    synced: 61,
    total: 64,
    status: 'done',
    cover: ['#9A82FF', '#F5536D'],
  },
];

const INITIAL_LYRICS: LyricLineData[] = [
  { text: 'Sous les neons', t: 12.4 },
  { text: 'Je cherche encore', t: 16.1 },
  { text: 'Les rues parlent en silence' },
  { text: 'La nuit garde sa cadence' },
  { text: '' },
  { text: 'J avance dans la lumiere' },
  { text: 'Le tempo colle a ma peau' },
  { text: 'Chaque seconde devient claire' },
  { text: 'Quand ta voix revient trop haut' },
  { text: 'Encore un pas dans le noir' },
  { text: 'Encore un signe au matin' },
];

const EDITOR_WAVEFORM = Array.from({ length: 64 }, (_, index) => {
  const value = Math.abs(Math.sin(index * 0.42) * Math.cos(index * 0.19));
  return 0.18 + value * 0.82;
});

const DEFAULT_SETTINGS: SettingsPreferences = {
  theme: 'dark',
  defaultSpeed: 1,
  haptics: true,
  autoScroll: true,
  confirmUnsyncedExport: true,
};

export default function IndexScreen() {
  const storeProjects = useLrxStore((state) => state.projects);
  const openStoredProject = useLrxStore((state) => state.openProject);
  const createStoredProject = useLrxStore((state) => state.createProject);
  const updateStoredTimestamp = useLrxStore((state) => state.updateTimestamp);
  const clearStoredTimestamp = useLrxStore((state) => state.clearTimestamp);
  const saveStoredMetadata = useLrxStore((state) => state.saveMetadata);
  const [view, setView] = React.useState<AppView>('onboarding');
  const [activeProject, setActiveProject] = React.useState<Project>(PROJECTS[0]);
  const [activeLyrics, setActiveLyrics] = React.useState<LyricLineData[]>(INITIAL_LYRICS);
  const [settings, setSettings] = React.useState<SettingsPreferences>(DEFAULT_SETTINGS);
  const [importOpen, setImportOpen] = React.useState(false);
  const [audioOpen, setAudioOpen] = React.useState(false);
  const [metadataOpen, setMetadataOpen] = React.useState(false);
  const homeProjects = React.useMemo(() => storeProjects.map(projectToViewProject), [storeProjects]);

  if (view === 'editor') {
    return (
      <>
        <EditorScreen
          project={activeProject}
          initialLyrics={activeLyrics}
          onBack={() => setView('home')}
          onOpenMetadata={() => setMetadataOpen(true)}
          onTimestampChange={(line, nextTime) => {
            if (!line.id) return;
            updateStoredTimestamp(activeProject.id, line.id, nextTime);
          }}
          onLyricsSnapshotChange={(lines) => {
            lines.forEach((line) => {
              if (!line.id) return;
              if (line.t == null) {
                clearStoredTimestamp(activeProject.id, line.id);
                return;
              }
              updateStoredTimestamp(activeProject.id, line.id, line.t);
            });
          }}
        />
        {metadataOpen ? (
          <MetadataSheet
            project={activeProject}
            onClose={() => setMetadataOpen(false)}
            onSave={(metadata) => {
              saveStoredMetadata(activeProject.id, metadata);
              setActiveProject((current) => ({
                ...current,
                title: metadata.title || current.title,
                artist: metadata.artist || current.artist,
                metadata,
              }));
              setMetadataOpen(false);
            }}
          />
        ) : null}
      </>
    );
  }

  if (view === 'settings') {
    return (
      <SettingsScreen
        preferences={settings}
        onBack={() => setView('home')}
        onChange={(nextPreferences) => setSettings(nextPreferences)}
      />
    );
  }

  if (view === 'home') {
    return (
      <>
        <HomeScreen
          projects={homeProjects}
          onOpen={(project) => {
            const storedProject = storeProjects.find((item) => item.id === project.id);
            openStoredProject(project.id);
            setActiveProject(project);
            setActiveLyrics(storedProject ? projectLyricsToEditorLyrics(storedProject) : INITIAL_LYRICS);
            setView('editor');
          }}
          onImportLyrics={() => setImportOpen(true)}
          onImportAudio={() => setAudioOpen(true)}
          onOpenSettings={() => setView('settings')}
        />
        {audioOpen ? (
          <AudioPickerSheet
            onClose={() => setAudioOpen(false)}
            onCreate={(audioName, duration = '00:00') => {
              const project = createStoredProject({
                title: normalizeAudioTitle(audioName),
                artist: 'Audio importe',
                duration,
                audioName,
                lyrics: INITIAL_LYRICS.map((line) => line.text).filter(Boolean),
                cover: ['#7C5CFF', '#3B2BFF'],
              });
              setActiveProject(projectToViewProject(project));
              setActiveLyrics(projectLyricsToEditorLyrics(project));
              setAudioOpen(false);
              setView('editor');
            }}
          />
        ) : null}
        {importOpen ? (
          <ImportLyricsSheet
            onClose={() => setImportOpen(false)}
            onCreate={(lines) => {
              const project = createStoredProject({
                title: 'Nouveau lyrics',
                artist: 'Import manuel',
                duration: '00:00',
                lyrics: lines,
                cover: ['#7C5CFF', '#F5536D'],
              });
              setActiveProject(projectToViewProject(project));
              setActiveLyrics(projectLyricsToEditorLyrics(project));
              setImportOpen(false);
              setView('editor');
            }}
          />
        ) : null}
      </>
    );
  }

  return <OnboardingScreen onComplete={() => setView('home')} />;
}

function HomeScreen({
  projects,
  onOpen,
  onImportLyrics,
  onImportAudio,
  onOpenSettings,
}: {
  projects: Project[];
  onOpen: (project: Project) => void;
  onImportLyrics: () => void;
  onImportAudio: () => void;
  onOpenSettings: () => void;
}) {
  const [filter, setFilter] = React.useState<ProjectFilter>('all');
  const filteredProjects = React.useMemo(
    () => projects.filter((project) => filter === 'all' || project.status === filter),
    [filter, projects]
  );
  const inProgress = projects.find((project) => project.status === 'in-progress');

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <Screen>
        <ScreenBody>
          <View className="flex-row items-center justify-between px-5 pb-3 pt-3">
            <View className="flex-row items-center gap-3">
              <LrxMark />
              <Text className="text-lg font-semibold text-foreground">LRX</Text>
            </View>
            <View className="flex-row gap-1">
              <Button variant="ghost" size="icon" className="rounded-full">
                <Icon as={Search} className="size-5 text-foreground" />
              </Button>
              <Button variant="ghost" size="icon" onPress={onOpenSettings} className="rounded-full">
                <Icon as={Settings} className="size-5 text-foreground" />
              </Button>
            </View>
          </View>

          <ScrollView className="flex-1" contentContainerClassName="pb-28" showsVerticalScrollIndicator={false}>
            <View className="px-5 pb-5 pt-2">
              <Text className="text-[34px] font-semibold leading-10 text-foreground">Tes projets</Text>
              <Text className="mt-2 text-sm leading-5 text-muted-foreground">
                Reprends une session ou commence une nouvelle synchro.
              </Text>
            </View>

            {inProgress ? <ResumeProject project={inProgress} onOpen={onOpen} /> : null}

            <FilterTabs filter={filter} onChange={setFilter} />

            <View className="pt-1">
              {filteredProjects.length ? (
                filteredProjects.map((project, index) => (
                  <ProjectRow key={project.id} project={project} index={index} onOpen={onOpen} />
                ))
              ) : (
                <EmptyState
                  icon={FolderOpen}
                  title="Aucun projet ici"
                  body="Change de filtre ou demarre une nouvelle session LRC avec un audio ou des lyrics."
                  cta="Import audio"
                  onCta={onImportAudio}
                  secondaryCta="Coller lyrics"
                  onSecondaryCta={onImportLyrics}
                  className="mx-4 rounded-3xl border border-border bg-card/45"
                />
              )}
            </View>

            <Text className="mt-7 text-center font-mono text-[11px] text-muted-foreground">
              {projects.length} projets - {projects.reduce((sum, project) => sum + project.total, 0)} lignes au total
            </Text>
          </ScrollView>

          <View className="absolute bottom-5 left-4 right-4 flex-row gap-3">
            <Button variant="outline" size="lg" onPress={onImportLyrics} className="h-14 flex-1 rounded-2xl bg-background/95">
              <Icon as={FileText} className="size-5 text-foreground" />
              <Text>Coller</Text>
            </Button>
            <Button size="lg" onPress={onImportAudio} className="h-14 flex-[1.35] rounded-2xl">
              <Icon as={Upload} className="size-5 text-primary-foreground" />
              <Text>Import audio</Text>
            </Button>
          </View>
        </ScreenBody>
      </Screen>
    </>
  );
}

function ResumeProject({ project, onOpen }: { project: Project; onOpen: (project: Project) => void }) {
  const progress = Math.round((project.synced / project.total) * 100);

  return (
    <View className="px-4 pb-5">
      <Pressable onPress={() => onOpen(project)} className="flex-row items-center gap-4 rounded-2xl border border-primary/30 bg-primary/10 p-4">
        <ProjectCover colors={project.cover} size={58} index={0} />
        <View className="min-w-0 flex-1">
          <View className="mb-1 flex-row items-center gap-1.5">
            <Icon as={Music2} className="size-3.5 text-primary" />
            <Text className="text-[11px] font-semibold uppercase tracking-[1.6px] text-primary">
              Reprendre la session
            </Text>
          </View>
          <Text numberOfLines={1} className="text-base font-semibold text-foreground">
            {project.title}
          </Text>
          <Text className="mt-1 text-xs text-muted-foreground">
            {project.synced}/{project.total} lignes - {project.updated}
          </Text>
          <View className="mt-3 h-1 overflow-hidden rounded-full bg-input">
            <View className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} />
          </View>
        </View>
        <Icon as={ChevronRight} className="size-5 text-muted-foreground" />
      </Pressable>
    </View>
  );
}

function FilterTabs({ filter, onChange }: { filter: ProjectFilter; onChange: (filter: ProjectFilter) => void }) {
  const tabs: { id: ProjectFilter; label: string; count: number }[] = [
    { id: 'all', label: 'Tous', count: PROJECTS.length },
    { id: 'in-progress', label: 'En cours', count: PROJECTS.filter((project) => project.status === 'in-progress').length },
    { id: 'done', label: 'Finalises', count: PROJECTS.filter((project) => project.status === 'done').length },
    { id: 'draft', label: 'Brouillons', count: PROJECTS.filter((project) => project.status === 'draft').length },
  ];

  return (
    <ScrollView
      horizontal
      className="pb-3"
      contentContainerClassName="gap-2 px-4"
      showsHorizontalScrollIndicator={false}>
      {tabs.map((tab) => {
        const selected = filter === tab.id;
        return (
          <Pressable
            key={tab.id}
            onPress={() => onChange(tab.id)}
            className={`flex-row items-center gap-1.5 rounded-full px-3.5 py-2 ${
              selected ? 'bg-foreground' : 'bg-card'
            }`}>
            <Text className={`text-xs font-medium ${selected ? 'text-background' : 'text-foreground'}`}>
              {tab.label}
            </Text>
            <Text className={`text-[11px] ${selected ? 'text-background/60' : 'text-muted-foreground'}`}>
              {tab.count}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function ProjectRow({ project, index, onOpen }: { project: Project; index: number; onOpen: (project: Project) => void }) {
  const percent = Math.round((project.synced / Math.max(1, project.total)) * 100);
  const statusText = project.status === 'done' ? 'FAIT' : project.status === 'draft' ? 'DRAFT' : `${percent}%`;
  const statusClass =
    project.status === 'done' ? 'text-chart-2' : project.status === 'draft' ? 'text-muted-foreground' : 'text-foreground';

  return (
    <Pressable onPress={() => onOpen(project)} className="flex-row items-center gap-4 px-5 py-3">
      <ProjectCover colors={project.cover} size={50} index={index} status={project.status} />
      <View className="min-w-0 flex-1">
        <Text numberOfLines={1} className="text-[15px] font-medium text-foreground">
          {project.title}
        </Text>
        <View className="mt-1 flex-row items-center gap-2">
          <Text numberOfLines={1} className="max-w-[128px] text-xs text-muted-foreground">
            {project.artist}
          </Text>
          <Text className="text-xs text-muted">-</Text>
          <Text className="font-mono text-xs text-muted-foreground">{project.duration}</Text>
        </View>
      </View>
      <View className="items-end">
        <Text className={`text-[11px] font-semibold tracking-[1px] ${statusClass}`}>{statusText}</Text>
        <Text className="mt-1 text-[10px] text-muted">{project.updated}</Text>
      </View>
    </Pressable>
  );
}

function EditorScreen({
  project,
  initialLyrics,
  onBack,
  onOpenMetadata,
  onTimestampChange,
  onLyricsSnapshotChange,
}: {
  project: Project;
  initialLyrics: LyricLineData[];
  onBack: () => void;
  onOpenMetadata: () => void;
  onTimestampChange?: (line: LyricLineData, time: number) => void;
  onLyricsSnapshotChange?: (lines: LyricLineData[]) => void;
}) {
  const [lyrics, setLyrics] = React.useState(initialLyrics);
  const [activeIndex, setActiveIndex] = React.useState(() => {
    const next = initialLyrics.findIndex((line) => line.text && line.t == null);
    return next === -1 ? 0 : next;
  });
  const [time, setTime] = React.useState(18.6);
  const [playing, setPlaying] = React.useState(false);
  const [speed, setSpeed] = React.useState<0.5 | 1 | 1.5>(1);
  const [exportOpen, setExportOpen] = React.useState(false);
  const [karaokeOpen, setKaraokeOpen] = React.useState(false);
  const [fineTuneOpen, setFineTuneOpen] = React.useState(false);
  const [history, setHistory] = React.useState<{ lyrics: LyricLineData[]; activeIndex: number }[]>([]);
  const [future, setFuture] = React.useState<{ lyrics: LyricLineData[]; activeIndex: number }[]>([]);
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

  function advance() {
    setActiveIndex((current) => findNextLyric(lyrics, current));
  }

  function retreat() {
    setActiveIndex((current) => findPreviousLyric(lyrics, current));
  }

  function tapTime() {
    const activeLine = lyrics[activeIndex];
    if (!activeLine?.text) return;
    setHistory((items) => [...items, { lyrics: lyrics.map((line) => ({ ...line })), activeIndex }]);
    setFuture([]);
    setLyrics((items) =>
      items.map((line, index) => (index === activeIndex ? { ...line, t: time } : line))
    );
    onTimestampChange?.(activeLine, time);
    setActiveIndex((current) => findNextLyric(lyrics, current));
  }

  function undo() {
    const previous = history.at(-1);
    if (!previous) return;
    setFuture((items) => [...items, { lyrics: lyrics.map((line) => ({ ...line })), activeIndex }]);
    setLyrics(previous.lyrics);
    setActiveIndex(previous.activeIndex);
    onLyricsSnapshotChange?.(previous.lyrics);
    setHistory((items) => items.slice(0, -1));
  }

  function redo() {
    const next = future.at(-1);
    if (!next) return;
    setHistory((items) => [...items, { lyrics: lyrics.map((line) => ({ ...line })), activeIndex }]);
    setLyrics(next.lyrics);
    setActiveIndex(next.activeIndex);
    onLyricsSnapshotChange?.(next.lyrics);
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
    setLyrics((items) =>
      items.map((line, index) => (index === activeIndex ? { ...line, t: boundedTime } : line))
    );
    onTimestampChange?.(activeLine, boundedTime);
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
              <Text className="mt-0.5 font-mono text-[10px] text-muted-foreground">
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
              <Button variant="ghost" size="icon" onPress={onOpenMetadata} className="rounded-full">
                <Icon as={MoreHorizontal} className="size-5 text-foreground" />
              </Button>
            </View>
          </View>

          <View className="border-b border-border bg-card/35 px-5 pb-4 pt-1">
            <View className="mb-2 flex-row items-end justify-between">
              <Text className="font-mono text-[28px] font-semibold leading-8 text-foreground">{formatTime(time)}</Text>
              <Text className="font-mono text-xs text-muted-foreground">{formatTime(duration)}</Text>
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
                  className="size-14 rounded-full bg-foreground">
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

          <ScrollView className="flex-1" contentContainerClassName="pb-40 pt-5" showsVerticalScrollIndicator={false}>
            {lyrics.map((line, index) => (
              <LyricRow
                key={`${index}-${line.text}`}
                line={line}
                index={index}
                active={index === activeIndex}
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

          <View className="absolute bottom-0 left-0 right-0 h-40 bg-background" />
          <View className="absolute bottom-5 left-3 right-3 flex-row items-center gap-2">
            <Button variant="outline" size="icon" onPress={retreat} className="h-16 w-14 rounded-2xl bg-card">
              <Icon as={ChevronLeft} className="size-6 text-foreground" />
            </Button>
            <Pressable
              onPress={tapTime}
              className="h-16 flex-1 flex-row items-center justify-center gap-3 rounded-2xl bg-primary px-5">
              <View className={`size-2 rounded-full bg-white ${playing ? 'opacity-100' : 'opacity-60'}`} />
              <Text className="text-[15px] font-bold uppercase tracking-[3px] text-primary-foreground">Tap Time</Text>
            </Pressable>
            <Button variant="outline" size="icon" onPress={advance} className="h-16 w-14 rounded-2xl bg-card">
              <Icon as={ChevronRight} className="size-6 text-foreground" />
            </Button>
          </View>
        </ScreenBody>
      </Screen>
      {exportOpen ? <ExportSheet project={project} lyrics={lyrics} onClose={() => setExportOpen(false)} /> : null}
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
          activeIndex={activeIndex}
          time={time}
          duration={duration}
          playing={playing}
          speed={speed}
          synced={synced}
          total={total}
          onClose={() => setKaraokeOpen(false)}
          onTapTime={tapTime}
          onAdvance={advance}
          onRetreat={retreat}
          onTogglePlay={() => setPlaying((current) => !current)}
          onCycleSpeed={cycleSpeed}
        />
      ) : null}
    </>
  );
}

function EditorWaveform({
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

function KaraokeMode({
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

function LyricRow({
  line,
  index,
  active,
  past,
  onPress,
  onFineTune,
}: {
  line: LyricLineData;
  index: number;
  active: boolean;
  past: boolean;
  onPress: () => void;
  onFineTune: () => void;
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
