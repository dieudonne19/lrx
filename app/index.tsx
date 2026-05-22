import { ProjectCover, Screen, ScreenBody } from '@/components/lrx';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { Stack } from 'expo-router';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Eye,
  FastForward,
  FileText,
  MoreHorizontal,
  Music2,
  Pause,
  Play,
  Plus,
  Redo2,
  Rewind,
  Search,
  Settings,
  Undo2,
} from 'lucide-react-native';
import * as React from 'react';
import { Pressable, ScrollView, useWindowDimensions, View } from 'react-native';
import Svg, { Circle, ClipPath, Defs, G, Line, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

const SLIDES = [
  {
    eyebrow: 'LRX - 01',
    title: 'Synchronise tes paroles\navec ta musique.',
    body: 'Un editeur .lrc taille pour les studios, les karaokes et les createurs. Rapide, tactile, precis.',
    art: 'wave',
  },
  {
    eyebrow: 'LRX - 02',
    title: 'Un seul geste.\nUn seul bouton.',
    body: 'Lis ta musique, tape sur TAP TIME au bon moment. La ligne active recoit le timestamp, la suivante avance automatiquement.',
    art: 'tap',
  },
  {
    eyebrow: 'LRX - 03',
    title: 'Export .lrc propre,\npret a partager.',
    body: 'Apercu fichier, copie, partage, ou export direct. Metadonnees, lyrics, timestamps: tout sort en standard.',
    art: 'export',
  },
] as const;

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

type Project = {
  id: string;
  title: string;
  artist: string;
  duration: string;
  updated: string;
  synced: number;
  total: number;
  status: 'done' | 'draft' | 'in-progress';
  cover: [string, string];
};

type LyricLineData = {
  text: string;
  t?: number;
};

type ProjectFilter = 'all' | Project['status'];
type AppView = 'onboarding' | 'home' | 'editor';

export default function IndexScreen() {
  const [view, setView] = React.useState<AppView>('onboarding');
  const [activeProject, setActiveProject] = React.useState<Project>(PROJECTS[0]);

  if (view === 'editor') {
    return <EditorScreen project={activeProject} onBack={() => setView('home')} />;
  }

  if (view === 'home') {
    return (
      <HomeScreen
        onOpen={(project) => {
          setActiveProject(project);
          setView('editor');
        }}
      />
    );
  }

  return <OnboardingScreen onComplete={() => setView('home')} />;
}

function OnboardingScreen({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = React.useState(0);
  const slide = SLIDES[step];
  const isLast = step === SLIDES.length - 1;

  function goNext() {
    if (isLast) {
      onComplete();
      return;
    }
    setStep((current) => Math.min(current + 1, SLIDES.length - 1));
  }

  function skip() {
    onComplete();
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <Screen padded>
        <ScreenBody className="justify-between">
          <View>
            <Progress step={step} onSelect={setStep} />
            <View className="min-h-[260px] items-center justify-center">
              {slide.art === 'wave' ? <WaveArt /> : null}
              {slide.art === 'tap' ? <TapArt /> : null}
              {slide.art === 'export' ? <ExportArt /> : null}
            </View>
          </View>

          <View className="gap-8 pb-3">
            <View>
              <Text className="text-xs font-semibold uppercase tracking-[2.4px] text-primary">
                {slide.eyebrow}
              </Text>
              <Text className="mt-4 text-[38px] font-semibold leading-[42px] text-foreground">
                {slide.title}
              </Text>
              <Text className="mt-4 max-w-[320px] text-base leading-6 text-muted-foreground">
                {slide.body}
              </Text>
            </View>

            <View className="flex-row items-center gap-3">
              <Button variant="ghost" size="lg" onPress={skip} className="px-4">
                <Text className="text-muted-foreground">Passer</Text>
              </Button>
              <View className="flex-1" />
              <Button size="lg" onPress={goNext} className="h-14 min-w-[150px] rounded-2xl">
                <Text>{isLast ? 'Commencer' : 'Continuer'}</Text>
                <Icon as={ChevronRight} className="size-5 text-primary-foreground" />
              </Button>
            </View>
          </View>
        </ScreenBody>
      </Screen>
    </>
  );
}

function Progress({ step, onSelect }: { step: number; onSelect: (step: number) => void }) {
  return (
    <View className="mt-2 flex-row gap-1.5">
      {SLIDES.map((slide, index) => (
        <Pressable
          key={slide.eyebrow}
          onPress={() => onSelect(index)}
          className={`h-1 rounded-full ${index === step ? 'flex-[3] bg-primary' : 'flex-1 bg-input'}`}
        />
      ))}
    </View>
  );
}

function HomeScreen({ onOpen }: { onOpen: (project: Project) => void }) {
  const [filter, setFilter] = React.useState<ProjectFilter>('all');
  const filteredProjects = React.useMemo(
    () => PROJECTS.filter((project) => filter === 'all' || project.status === filter),
    [filter]
  );
  const inProgress = PROJECTS.find((project) => project.status === 'in-progress');

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
              <Button variant="ghost" size="icon" className="rounded-full">
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
              {filteredProjects.map((project, index) => (
                <ProjectRow key={project.id} project={project} index={index} onOpen={onOpen} />
              ))}
            </View>

            <Text className="mt-7 text-center font-mono text-[11px] text-muted-foreground">
              {PROJECTS.length} projets - {PROJECTS.reduce((sum, project) => sum + project.total, 0)} lignes au total
            </Text>
          </ScrollView>

          <View className="absolute bottom-5 left-4 right-4 flex-row gap-3">
            <Button variant="outline" size="lg" className="h-14 flex-1 rounded-2xl bg-background/95">
              <Icon as={FileText} className="size-5 text-foreground" />
              <Text>Coller</Text>
            </Button>
            <Button size="lg" className="h-14 flex-[1.35] rounded-2xl">
              <Icon as={Plus} className="size-5 text-primary-foreground" />
              <Text>Nouveau projet</Text>
            </Button>
          </View>
        </ScreenBody>
      </Screen>
    </>
  );
}

function LrxMark() {
  return (
    <View className="size-8 items-center justify-center overflow-hidden rounded-[9px] bg-primary">
      <Svg width={18} height={18} viewBox="0 0 18 18">
        <Line x1={3} x2={3} y1={4} y2={14} stroke="#FFFFFF" strokeWidth={2} strokeLinecap="round" />
        <Line x1={7} x2={7} y1={8} y2={14} stroke="#FFFFFF" strokeWidth={2} strokeLinecap="round" />
        <Line x1={11} x2={11} y1={3} y2={15} stroke="#FFFFFF" strokeWidth={2} strokeLinecap="round" />
        <Line x1={15} x2={15} y1={7} y2={13} stroke="#FFFFFF" strokeWidth={2} strokeLinecap="round" />
      </Svg>
    </View>
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

function EditorScreen({ project, onBack }: { project: Project; onBack: () => void }) {
  const [lyrics, setLyrics] = React.useState(INITIAL_LYRICS);
  const [activeIndex, setActiveIndex] = React.useState(() => {
    const next = INITIAL_LYRICS.findIndex((line) => line.text && line.t == null);
    return next === -1 ? 0 : next;
  });
  const [time, setTime] = React.useState(18.6);
  const [playing, setPlaying] = React.useState(false);
  const [speed, setSpeed] = React.useState<0.5 | 1 | 1.5>(1);
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
    setHistory((items) => [...items, { lyrics: lyrics.map((line) => ({ ...line })), activeIndex }]);
    setFuture([]);
    setLyrics((items) =>
      items.map((line, index) => (index === activeIndex ? { ...line, t: time } : line))
    );
    setActiveIndex((current) => findNextLyric(lyrics, current));
  }

  function undo() {
    const previous = history.at(-1);
    if (!previous) return;
    setFuture((items) => [...items, { lyrics: lyrics.map((line) => ({ ...line })), activeIndex }]);
    setLyrics(previous.lyrics);
    setActiveIndex(previous.activeIndex);
    setHistory((items) => items.slice(0, -1));
  }

  function redo() {
    const next = future.at(-1);
    if (!next) return;
    setHistory((items) => [...items, { lyrics: lyrics.map((line) => ({ ...line })), activeIndex }]);
    setLyrics(next.lyrics);
    setActiveIndex(next.activeIndex);
    setFuture((items) => items.slice(0, -1));
  }

  function cycleSpeed() {
    setSpeed((current) => (current === 0.5 ? 1 : current === 1 ? 1.5 : 0.5));
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
              <Button variant="ghost" size="icon" onPress={undo} disabled={!history.length} className="rounded-full">
                <Icon as={Undo2} className="size-[18px] text-foreground" />
              </Button>
              <Button variant="ghost" size="icon" onPress={redo} disabled={!future.length} className="rounded-full">
                <Icon as={Redo2} className="size-[18px] text-foreground" />
              </Button>
              <Button variant="ghost" size="icon" className="rounded-full">
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
              <Button variant="ghost" size="icon" className="rounded-full">
                <Icon as={Eye} className="size-5 text-foreground" />
              </Button>
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

function LyricRow({
  line,
  index,
  active,
  past,
  onPress,
}: {
  line: LyricLineData;
  index: number;
  active: boolean;
  past: boolean;
  onPress: () => void;
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
        <Text className={`min-w-0 flex-1 ${textClass}`}>{line.text}</Text>
      )}
    </Pressable>
  );
}

function buildWaveformPath(data: number[], width: number, height: number) {
  const mid = height / 2;
  let path = `M 0 ${mid}`;

  data.forEach((value, index) => {
    const x = (index / (data.length - 1)) * width;
    const amp = value * (height * 0.42);
    path += ` L ${x.toFixed(2)} ${(mid - amp).toFixed(2)}`;
  });

  for (let index = data.length - 1; index >= 0; index -= 1) {
    const x = (index / (data.length - 1)) * width;
    const amp = data[index] * (height * 0.42);
    path += ` L ${x.toFixed(2)} ${(mid + amp).toFixed(2)}`;
  }

  return `${path} Z`;
}

function findNextLyric(lyrics: LyricLineData[], current: number) {
  for (let index = current + 1; index < lyrics.length; index += 1) {
    if (lyrics[index].text) return index;
  }
  return current;
}

function findPreviousLyric(lyrics: LyricLineData[], current: number) {
  for (let index = current - 1; index >= 0; index -= 1) {
    if (lyrics[index].text) return index;
  }
  return current;
}

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const centiseconds = Math.floor((totalSeconds % 1) * 100);
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(centiseconds).padStart(2, '0')}`;
}

function WaveArt() {
  const bars = Array.from({ length: 28 }, (_, index) => {
    const height = 30 + Math.abs(Math.sin(index * 0.5) * Math.cos(index * 0.3)) * 110;
    return { x: 6 + index * 9, y: 100 - height / 2, height };
  });

  return (
    <Svg width={260} height={210} viewBox="0 0 260 210">
      <Defs>
        <LinearGradient id="waveFill" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#22252C" />
          <Stop offset="0.44" stopColor="#22252C" />
          <Stop offset="0.45" stopColor="#7C5CFF" />
          <Stop offset="1" stopColor="#9A82FF" />
        </LinearGradient>
      </Defs>
      {bars.map((bar) => (
        <Rect key={bar.x} x={bar.x} y={bar.y + 5} width={5} height={bar.height} rx={2.5} fill="url(#waveFill)" />
      ))}
      <Line x1={120} x2={120} y1={25} y2={185} stroke="#F2F3F6" strokeWidth={1} opacity={0.72} />
      <Circle cx={120} cy={25} r={4} fill="#F2F3F6" />
    </Svg>
  );
}

function TapArt() {
  return (
    <View className="relative h-[235px] w-[280px] items-center">
      <View className="absolute left-0 right-0 top-2 gap-2 rounded-2xl border border-border bg-card px-5 py-4">
        <Text className="text-sm text-muted-foreground">Sous les neons</Text>
        <Text className="text-sm text-muted-foreground">Je cherche encore</Text>
        <Text className="text-lg font-semibold text-foreground">Les rues parlent en silence</Text>
        <Text className="text-sm text-muted">La nuit garde sa cadence</Text>
      </View>

      <View className="absolute bottom-8 h-16 w-[220px] items-center justify-center rounded-2xl border border-primary bg-primary">
        <Text className="text-xs font-semibold uppercase tracking-[3px] text-primary-foreground">Tap Time</Text>
      </View>
      <View className="absolute bottom-5 h-20 w-[252px] rounded-[22px] border border-primary/50" />
    </View>
  );
}

function ExportArt() {
  return (
    <View className="w-[286px] rounded-2xl border border-border bg-card px-5 py-5">
      <View className="mb-4 flex-row items-center gap-1.5">
        <View className="size-2.5 rounded-full bg-muted" />
        <View className="size-2.5 rounded-full bg-muted" />
        <View className="size-2.5 rounded-full bg-primary" />
        <Text className="ml-auto font-mono text-[10px] text-muted-foreground">track.lrc</Text>
      </View>
      <CodeLine muted="[ti:" text="Neons" end="]" />
      <CodeLine muted="[ar:" text="Camille Roux" end="]" />
      <View className="h-3" />
      <CodeLine muted="[00:12.40]" text=" Sous les neons" accent />
      <CodeLine muted="[00:16.10]" text=" Je cherche encore" accent />
      <CodeLine muted="[00:20.05]" text=" Les rues parlent..." accent />
    </View>
  );
}

function CodeLine({
  muted,
  text,
  end,
  accent,
}: {
  muted: string;
  text: string;
  end?: string;
  accent?: boolean;
}) {
  return (
    <View className="flex-row">
      <Text className={`font-mono text-xs leading-5 ${accent ? 'text-primary' : 'text-muted-foreground'}`}>
        {muted}
      </Text>
      <Text className="font-mono text-xs leading-5 text-foreground">{text}</Text>
      {end ? <Text className="font-mono text-xs leading-5 text-muted-foreground">{end}</Text> : null}
    </View>
  );
}
