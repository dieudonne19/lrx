import { EmptyState, ProjectCover, Screen, ScreenBody } from '@/components/lrx';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { getLyricCount, getSyncedCount, type LrxProject, useLrxStore } from '@/lib/lrx-store';
import * as Clipboard from 'expo-clipboard';
import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import { Stack } from 'expo-router';
import * as Sharing from 'expo-sharing';
import {
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  Eye,
  FastForward,
  FileText,
  FolderOpen,
  Gauge,
  ListChecks,
  Maximize2,
  Mic2,
  Minus,
  Moon,
  MoreHorizontal,
  Music2,
  Pause,
  Play,
  Plus,
  Redo2,
  Rewind,
  Save,
  Search,
  Settings,
  Share2,
  ShieldAlert,
  SlidersHorizontal,
  Sparkles,
  ScrollText,
  Smartphone,
  Sun,
  Tag,
  Undo2,
  Upload,
  Vibrate,
  X,
  type LucideIcon,
} from 'lucide-react-native';
import * as React from 'react';
import { Pressable, ScrollView, TextInput, useWindowDimensions, View } from 'react-native';
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

const RECENT_AUDIO = [
  { name: 'neons_final_mix.wav', size: '42.8 MB', duration: '03:42' },
  { name: 'voice_memo_hook.m4a', size: '8.1 MB', duration: '01:41' },
  { name: 'after_hours_demo.mp3', size: '6.6 MB', duration: '02:58' },
];

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
  metadata?: LrcMetadata;
};

type LrcMetadata = {
  title: string;
  artist: string;
  album: string;
  author: string;
  genre: string;
};

type LyricLineData = {
  id?: string;
  text: string;
  t?: number;
};

type ProjectFilter = 'all' | Project['status'];
type ThemePreference = 'system' | 'dark' | 'light';
type DefaultSpeed = 0.5 | 1 | 1.5;
type SettingsPreferences = {
  theme: ThemePreference;
  defaultSpeed: DefaultSpeed;
  haptics: boolean;
  autoScroll: boolean;
  confirmUnsyncedExport: boolean;
};
type AppView = 'onboarding' | 'home' | 'editor' | 'settings';

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

function SettingsScreen({
  preferences,
  onBack,
  onChange,
}: {
  preferences: SettingsPreferences;
  onBack: () => void;
  onChange: (preferences: SettingsPreferences) => void;
}) {
  function update(next: Partial<SettingsPreferences>) {
    onChange({ ...preferences, ...next });
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <Screen>
        <ScreenBody>
          <View className="flex-row items-center gap-2 px-3 pb-2 pt-3">
            <Button variant="ghost" size="icon" onPress={onBack} className="rounded-full">
              <Icon as={ArrowLeft} className="size-5 text-foreground" />
            </Button>
            <View className="min-w-0 flex-1">
              <Text className="text-lg font-semibold text-foreground">Settings</Text>
              <Text className="mt-0.5 text-xs text-muted-foreground">Workspace et preferences studio</Text>
            </View>
            <View className="size-10 items-center justify-center rounded-full border border-border bg-card">
              <Icon as={SlidersHorizontal} className="size-5 text-primary" />
            </View>
          </View>

          <ScrollView className="flex-1" contentContainerClassName="px-5 pb-10 pt-3" showsVerticalScrollIndicator={false}>
            <View className="mb-6 rounded-[24px] border border-primary/25 bg-primary/10 p-5">
              <View className="flex-row items-start justify-between gap-4">
                <View className="flex-1">
                  <Text className="text-xs font-semibold uppercase tracking-[2px] text-primary">LRX Studio</Text>
                  <Text className="mt-3 text-[30px] font-semibold leading-9 text-foreground">Sync rapide, controle propre.</Text>
                  <Text className="mt-3 text-sm leading-5 text-muted-foreground">
                    Ces reglages preparent l'experience editor: vitesse, feedback tactile, auto-scroll et securite export.
                  </Text>
                </View>
                <LrxMark />
              </View>
              <View className="mt-5 flex-row gap-2">
                <SettingsStat value={`${preferences.defaultSpeed}x`} label="speed" />
                <SettingsStat value={preferences.autoScroll ? 'ON' : 'OFF'} label="scroll" />
                <SettingsStat value={preferences.haptics ? 'ON' : 'OFF'} label="haptics" />
              </View>
            </View>

            <View className="mb-6">
              <Text className="mb-3 text-xs font-semibold uppercase tracking-[1.8px] text-muted-foreground">Theme</Text>
              <View className="flex-row gap-2">
                <ThemeOption
                  label="System"
                  icon={Smartphone}
                  selected={preferences.theme === 'system'}
                  onPress={() => update({ theme: 'system' })}
                />
                <ThemeOption
                  label="Dark"
                  icon={Moon}
                  selected={preferences.theme === 'dark'}
                  onPress={() => update({ theme: 'dark' })}
                />
                <ThemeOption
                  label="Light"
                  icon={Sun}
                  selected={preferences.theme === 'light'}
                  onPress={() => update({ theme: 'light' })}
                />
              </View>
            </View>

            <View className="mb-6">
              <Text className="mb-3 text-xs font-semibold uppercase tracking-[1.8px] text-muted-foreground">Edition</Text>
              <View className="gap-3">
                <SettingsToggle
                  icon={Vibrate}
                  title="Feedback tactile"
                  description="Vibration courte sur Tap Time, undo et navigation de lignes."
                  enabled={preferences.haptics}
                  onPress={() => update({ haptics: !preferences.haptics })}
                />
                <SettingsToggle
                  icon={ScrollText}
                  title="Auto-scroll lyrics"
                  description="Garde la ligne active visible pendant la lecture et le tapping."
                  enabled={preferences.autoScroll}
                  onPress={() => update({ autoScroll: !preferences.autoScroll })}
                />
                <SettingsToggle
                  icon={ShieldAlert}
                  title="Confirmer export incomplet"
                  description="Avertit avant de partager un .lrc avec des lignes non synchronisees."
                  enabled={preferences.confirmUnsyncedExport}
                  onPress={() => update({ confirmUnsyncedExport: !preferences.confirmUnsyncedExport })}
                />
              </View>
            </View>

            <View className="mb-6">
              <Text className="mb-3 text-xs font-semibold uppercase tracking-[1.8px] text-muted-foreground">Vitesse par defaut</Text>
              <View className="rounded-2xl border border-border bg-card p-2">
                <View className="flex-row gap-2">
                  {([0.5, 1, 1.5] as const).map((speed) => (
                    <SpeedOption
                      key={speed}
                      speed={speed}
                      selected={preferences.defaultSpeed === speed}
                      onPress={() => update({ defaultSpeed: speed })}
                    />
                  ))}
                </View>
                <View className="mt-4 flex-row items-center gap-2 px-2 pb-1">
                  <Icon as={Gauge} className="size-4 text-muted-foreground" />
                  <Text className="flex-1 text-xs leading-4 text-muted-foreground">
                    Appliquee aux nouveaux projets; l'editeur garde ensuite sa vitesse de session.
                  </Text>
                </View>
              </View>
            </View>

            <View className="rounded-2xl border border-border bg-card px-4 py-4">
              <View className="flex-row items-center justify-between">
                <View>
                  <Text className="text-sm font-semibold text-foreground">Workspace</Text>
                  <Text className="mt-1 text-xs text-muted-foreground">Local prototype - stockage reel a venir</Text>
                </View>
                <Text className="font-mono text-xs text-primary">v0.1</Text>
              </View>
            </View>
          </ScrollView>
        </ScreenBody>
      </Screen>
    </>
  );
}

function SettingsStat({ value, label }: { value: string; label: string }) {
  return (
    <View className="flex-1 rounded-2xl border border-primary/20 bg-background/50 px-3 py-3">
      <Text className="font-mono text-base font-semibold text-foreground">{value}</Text>
      <Text className="mt-1 text-[10px] uppercase tracking-[1.5px] text-muted-foreground">{label}</Text>
    </View>
  );
}

function ThemeOption({
  label,
  icon,
  selected,
  onPress,
}: {
  label: string;
  icon: LucideIcon;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`h-24 flex-1 items-center justify-center gap-2 rounded-2xl border ${
        selected ? 'border-primary bg-primary' : 'border-border bg-card'
      }`}>
      <Icon as={icon} className={`size-5 ${selected ? 'text-primary-foreground' : 'text-foreground'}`} />
      <Text className={`text-sm font-semibold ${selected ? 'text-primary-foreground' : 'text-foreground'}`}>{label}</Text>
    </Pressable>
  );
}

function SpeedOption({
  speed,
  selected,
  onPress,
}: {
  speed: DefaultSpeed;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`h-12 flex-1 items-center justify-center rounded-xl ${
        selected ? 'bg-foreground' : 'bg-background'
      }`}>
      <Text className={`font-mono text-sm font-semibold ${selected ? 'text-background' : 'text-muted-foreground'}`}>{speed}x</Text>
    </Pressable>
  );
}

function SettingsToggle({
  icon,
  title,
  description,
  enabled,
  onPress,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  enabled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} className="flex-row items-center gap-4 rounded-2xl border border-border bg-card p-4">
      <View className="size-11 items-center justify-center rounded-2xl bg-background">
        <Icon as={icon} className={`size-5 ${enabled ? 'text-primary' : 'text-muted-foreground'}`} />
      </View>
      <View className="min-w-0 flex-1">
        <Text className="text-sm font-semibold text-foreground">{title}</Text>
        <Text className="mt-1 text-xs leading-4 text-muted-foreground">{description}</Text>
      </View>
      <View className={`h-8 w-14 justify-center rounded-full px-1 ${enabled ? 'items-end bg-primary' : 'items-start bg-input'}`}>
        <View className="size-6 rounded-full bg-white" />
      </View>
    </Pressable>
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

function AudioPickerSheet({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (audioName: string, duration?: string) => void;
}) {
  const [picking, setPicking] = React.useState(false);
  const recentAudio = RECENT_AUDIO;

  async function pickAudio() {
    setPicking(true);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (!result.canceled) {
        const asset = result.assets[0];
        onCreate(asset.name || 'audio-import');
      }
    } finally {
      setPicking(false);
    }
  }

  return (
    <View className="absolute inset-0 z-50 justify-end bg-black/60">
      <Pressable className="absolute inset-0" onPress={onClose} />
      <View className="rounded-t-[28px] border border-border bg-background px-5 pb-6 pt-3">
        <View className="mb-5 items-center">
          <View className="h-1.5 w-12 rounded-full bg-input" />
        </View>

        <View className="mb-5 flex-row items-start justify-between gap-4">
          <View className="flex-1">
            <Text className="text-2xl font-semibold text-foreground">Importer audio</Text>
            <Text className="mt-1 text-sm leading-5 text-muted-foreground">
              Choisis un fichier audio pour creer une session LRC.
            </Text>
          </View>
          <Button variant="ghost" size="icon" onPress={onClose} className="rounded-full">
            <Icon as={X} className="size-5 text-foreground" />
          </Button>
        </View>

        <Pressable
          onPress={pickAudio}
          className="items-center justify-center rounded-3xl border border-dashed border-primary/60 bg-primary/10 px-5 py-8">
          <View className="mb-4 size-14 items-center justify-center rounded-2xl bg-primary">
            <Icon as={Upload} className="size-7 text-primary-foreground" />
          </View>
          <Text className="text-base font-semibold text-foreground">
            {picking ? 'Ouverture...' : 'Choisir un fichier audio'}
          </Text>
          <Text className="mt-1 text-center text-sm leading-5 text-muted-foreground">
            MP3, WAV, M4A ou AAC. La lecture reelle sera branchee avec expo-av ensuite.
          </Text>
        </Pressable>

        <View className="mt-6">
          <Text className="mb-3 text-xs font-semibold uppercase tracking-[1.8px] text-muted-foreground">
            Recents
          </Text>
          {recentAudio.length ? (
            <View className="gap-2">
              {recentAudio.map((audio) => (
                <Pressable
                  key={audio.name}
                  onPress={() => onCreate(audio.name, audio.duration)}
                  className="flex-row items-center gap-3 rounded-2xl border border-border bg-card px-3 py-3">
                  <View className="size-11 items-center justify-center rounded-xl bg-input">
                    <Icon as={FolderOpen} className="size-5 text-muted-foreground" />
                  </View>
                  <View className="min-w-0 flex-1">
                    <Text numberOfLines={1} className="text-sm font-medium text-foreground">
                      {audio.name}
                    </Text>
                    <Text className="mt-0.5 text-xs text-muted-foreground">
                      {audio.size} - {audio.duration}
                    </Text>
                  </View>
                  <Icon as={ChevronRight} className="size-5 text-muted-foreground" />
                </Pressable>
              ))}
            </View>
          ) : (
            <EmptyState
              variant="compact"
              icon={FolderOpen}
              title="Aucun audio recent"
              body="Importe un fichier depuis ton appareil pour commencer une session."
              cta="Choisir audio"
              onCta={pickAudio}
              className="rounded-2xl border border-border bg-card"
            />
          )}
        </View>
      </View>
    </View>
  );
}

function MetadataSheet({
  project,
  onClose,
  onSave,
}: {
  project: Project;
  onClose: () => void;
  onSave: (metadata: LrcMetadata) => void;
}) {
  const [metadata, setMetadata] = React.useState<LrcMetadata>({
    title: project.metadata?.title ?? project.title,
    artist: project.metadata?.artist ?? project.artist,
    album: project.metadata?.album ?? '',
    author: project.metadata?.author ?? '',
    genre: project.metadata?.genre ?? '',
  });

  function updateField(field: keyof LrcMetadata, value: string) {
    setMetadata((current) => ({ ...current, [field]: value }));
  }

  return (
    <View className="absolute inset-0 z-50 justify-end bg-black/60">
      <Pressable className="absolute inset-0" onPress={onClose} />
      <View className="rounded-t-[28px] border border-border bg-background px-5 pb-6 pt-3">
        <View className="mb-5 items-center">
          <View className="h-1.5 w-12 rounded-full bg-input" />
        </View>

        <View className="mb-5 flex-row items-start justify-between gap-4">
          <View className="flex-1">
            <Text className="text-2xl font-semibold text-foreground">Metadata LRC</Text>
            <Text className="mt-1 text-sm leading-5 text-muted-foreground">
              Ces infos seront ajoutees en entete du fichier exporte.
            </Text>
          </View>
          <Button variant="ghost" size="icon" onPress={onClose} className="rounded-full">
            <Icon as={X} className="size-5 text-foreground" />
          </Button>
        </View>

        <View className="gap-3">
          <MetadataField label="Title" value={metadata.title} onChange={(value) => updateField('title', value)} />
          <MetadataField label="Artist" value={metadata.artist} onChange={(value) => updateField('artist', value)} />
          <MetadataField label="Album" value={metadata.album} onChange={(value) => updateField('album', value)} />
          <MetadataField label="Author" value={metadata.author} onChange={(value) => updateField('author', value)} />
          <MetadataField label="Genre" value={metadata.genre} onChange={(value) => updateField('genre', value)} />
        </View>

        <View className="mt-5 rounded-2xl border border-border bg-card px-4 py-3">
          <View className="mb-2 flex-row items-center gap-2">
            <Icon as={Tag} className="size-4 text-primary" />
            <Text className="text-xs font-semibold uppercase tracking-[1.8px] text-primary">Preview tags</Text>
          </View>
          <Text className="font-mono text-xs leading-5 text-muted-foreground">[ti:{metadata.title || project.title}]</Text>
          <Text className="font-mono text-xs leading-5 text-muted-foreground">[ar:{metadata.artist || project.artist}]</Text>
          {metadata.album ? <Text className="font-mono text-xs leading-5 text-muted-foreground">[al:{metadata.album}]</Text> : null}
          {metadata.author ? <Text className="font-mono text-xs leading-5 text-muted-foreground">[by:{metadata.author}]</Text> : null}
          {metadata.genre ? <Text className="font-mono text-xs leading-5 text-muted-foreground">[re:{metadata.genre}]</Text> : null}
        </View>

        <Button size="lg" onPress={() => onSave(metadata)} className="mt-6 h-14 rounded-2xl">
          <Icon as={Save} className="size-5 text-primary-foreground" />
          <Text>Enregistrer</Text>
        </Button>
      </View>
    </View>
  );
}

function MetadataField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <View className="rounded-2xl border border-border bg-card px-4 py-3">
      <Text className="mb-1 text-[11px] font-semibold uppercase tracking-[1.6px] text-muted-foreground">
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={label}
        placeholderTextColor="#5C6068"
        className="text-base text-foreground"
      />
    </View>
  );
}

function ExportSheet({
  project,
  lyrics,
  onClose,
}: {
  project: Project;
  lyrics: LyricLineData[];
  onClose: () => void;
}) {
  const [copied, setCopied] = React.useState(false);
  const [shareStatus, setShareStatus] = React.useState<'idle' | 'sharing' | 'done' | 'unavailable' | 'error'>('idle');
  const lrcText = React.useMemo(() => buildLrcFile(project, lyrics), [project, lyrics]);
  const synced = lyrics.filter((line) => line.text && line.t != null).length;
  const total = lyrics.filter((line) => line.text).length;
  const hasLyrics = total > 0;
  const hasUnsyncedLyrics = hasLyrics && synced < total;

  async function copyToClipboard() {
    if (!hasLyrics) return;
    await Clipboard.setStringAsync(lrcText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  async function shareFile() {
    if (!hasLyrics) return;
    setShareStatus('sharing');

    try {
      const available = await Sharing.isAvailableAsync();
      if (!available) {
        setShareStatus('unavailable');
        return;
      }

      const fileName = `${toFileName(project.title)}.lrc`;
      const file = new File(Paths.cache, fileName);
      file.create({ overwrite: true });
      file.write(lrcText);

      await Sharing.shareAsync(file.uri, {
        mimeType: 'text/plain',
        UTI: 'public.plain-text',
        dialogTitle: `Partager ${fileName}`,
      });
      setShareStatus('done');
    } catch {
      setShareStatus('error');
    }
  }

  return (
    <View className="absolute inset-0 z-50 justify-end bg-black/60">
      <Pressable className="absolute inset-0" onPress={onClose} />
      <View className="max-h-[88%] rounded-t-[28px] border border-border bg-background px-5 pb-6 pt-3">
        <View className="mb-5 items-center">
          <View className="h-1.5 w-12 rounded-full bg-input" />
        </View>

        <View className="mb-5 flex-row items-start justify-between gap-4">
          <View className="flex-1">
            <Text className="text-2xl font-semibold text-foreground">Export .lrc</Text>
            <Text className="mt-1 text-sm leading-5 text-muted-foreground">
              Preview final avec metadonnees et timestamps synchronises.
            </Text>
          </View>
          <Button variant="ghost" size="icon" onPress={onClose} className="rounded-full">
            <Icon as={X} className="size-5 text-foreground" />
          </Button>
        </View>

        {hasUnsyncedLyrics ? (
          <View className="mb-4 flex-row items-center gap-3 rounded-2xl border border-primary/25 bg-primary/10 px-4 py-3">
            <View className="size-10 items-center justify-center rounded-xl bg-primary/20">
              <Icon as={ShieldAlert} className="size-5 text-primary" />
            </View>
            <View className="min-w-0 flex-1">
              <Text className="text-sm font-semibold text-foreground">Export incomplet</Text>
              <Text className="mt-0.5 text-xs leading-4 text-muted-foreground">
                {total - synced} ligne{total - synced > 1 ? 's' : ''} sans timestamp seront marquees --:--.--.
              </Text>
            </View>
          </View>
        ) : null}

        <View className="mb-4 flex-row gap-2">
          <View className="flex-1 rounded-2xl border border-border bg-card px-4 py-3">
            <Text className="font-mono text-xl font-semibold text-foreground">
              {synced}/{total}
            </Text>
            <Text className="mt-1 text-xs text-muted-foreground">lignes timees</Text>
          </View>
          <View className="flex-1 rounded-2xl border border-border bg-card px-4 py-3">
            <Text className="font-mono text-xl font-semibold text-foreground">{lrcText.split('\n').length}</Text>
            <Text className="mt-1 text-xs text-muted-foreground">lignes export</Text>
          </View>
        </View>

        <View className="rounded-2xl border border-border bg-card">
          <View className="flex-row items-center justify-between border-b border-border px-4 py-3">
            <View className="flex-row items-center gap-2">
              <Icon as={FileText} className="size-4 text-primary" />
              <Text className="text-xs font-semibold uppercase tracking-[1.8px] text-primary">Preview</Text>
            </View>
            <Text className="font-mono text-[11px] text-muted-foreground">{toFileName(project.title)}.lrc</Text>
          </View>
          {hasLyrics ? (
            <ScrollView className="h-[310px]" contentContainerClassName="px-4 py-3">
              <Text selectable className="font-mono text-xs leading-5 text-foreground">
                {lrcText}
              </Text>
            </ScrollView>
          ) : (
            <EmptyState
              variant="compact"
              icon={FileText}
              title="Aucune lyric a exporter"
              body="Ajoute ou importe des paroles avant de generer un fichier .lrc."
              className="h-[310px] justify-center"
            />
          )}
        </View>

        <View className="mt-4 flex-row gap-2">
          <Button
            variant="outline"
            onPress={copyToClipboard}
            disabled={!hasLyrics}
            className="h-14 flex-1 rounded-2xl bg-card">
            <Icon as={copied ? Check : Copy} className="size-5 text-foreground" />
            <Text>{copied ? 'Copie' : 'Copier'}</Text>
          </Button>
          <Button onPress={shareFile} disabled={!hasLyrics || shareStatus === 'sharing'} className="h-14 flex-1 rounded-2xl">
            <Icon as={shareStatus === 'done' ? Check : Share2} className="size-5 text-primary-foreground" />
            <Text>{shareStatus === 'sharing' ? 'Partage...' : 'Partager'}</Text>
          </Button>
        </View>

        <View className="mt-3 flex-row items-center justify-center gap-2">
          <Icon as={Download} className="size-4 text-muted-foreground" />
          <Text className="text-center text-xs text-muted-foreground">
            {shareStatus === 'unavailable'
              ? 'Partage indisponible sur cette plateforme.'
              : shareStatus === 'error'
                ? 'Impossible de creer le fichier pour le moment.'
                : 'Le fichier est genere localement au moment du partage.'}
          </Text>
        </View>
      </View>
    </View>
  );
}

function ImportLyricsSheet({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (lines: string[]) => void;
}) {
  const [rawText, setRawText] = React.useState(
    'Sous les neons\nJe cherche encore\nLes rues parlent en silence\nLa nuit garde sa cadence'
  );
  const cleanedText = React.useMemo(() => cleanLyrics(rawText), [rawText]);
  const lines = React.useMemo(() => splitLyrics(cleanedText), [cleanedText]);
  const preview = lines.slice(0, 5);

  function applyCleanup() {
    setRawText(cleanedText);
  }

  return (
    <View className="absolute inset-0 z-50 justify-end bg-black/60">
      <Pressable className="absolute inset-0" onPress={onClose} />
      <View className="rounded-t-[28px] border border-border bg-background px-5 pb-6 pt-3">
        <View className="mb-5 items-center">
          <View className="h-1.5 w-12 rounded-full bg-input" />
        </View>

        <View className="mb-5 flex-row items-start justify-between gap-4">
          <View className="flex-1">
            <Text className="text-2xl font-semibold text-foreground">Importer lyrics</Text>
            <Text className="mt-1 text-sm leading-5 text-muted-foreground">
              Colle les paroles brutes, LRX cree une ligne par phrase.
            </Text>
          </View>
          <Button variant="ghost" size="icon" onPress={onClose} className="rounded-full">
            <Icon as={X} className="size-5 text-foreground" />
          </Button>
        </View>

        <View className="rounded-2xl border border-border bg-card p-3">
          <TextInput
            value={rawText}
            onChangeText={setRawText}
            multiline
            textAlignVertical="top"
            placeholder="Colle tes paroles ici..."
            placeholderTextColor="#5C6068"
            className="min-h-[160px] font-sans text-base leading-6 text-foreground"
          />
        </View>

        <View className="mt-3 flex-row gap-2">
          <Button variant="outline" onPress={applyCleanup} className="h-11 flex-1 rounded-xl bg-card">
            <Icon as={Sparkles} className="size-4 text-foreground" />
            <Text>Nettoyer</Text>
          </Button>
          <View className="h-11 flex-1 flex-row items-center justify-center gap-2 rounded-xl border border-border bg-card">
            <Icon as={ListChecks} className="size-4 text-muted-foreground" />
            <Text className="text-sm text-muted-foreground">{lines.length} lignes</Text>
          </View>
        </View>

        <View className="mt-5">
          <Text className="mb-2 text-xs font-semibold uppercase tracking-[1.8px] text-muted-foreground">Preview</Text>
          {preview.length ? (
            <View className="gap-2">
              {preview.map((line, index) => (
                <View key={`${line}-${index}`} className="flex-row items-center gap-3">
                  <Text className="w-6 font-mono text-[11px] text-muted-foreground">{index + 1}</Text>
                  <Text numberOfLines={1} className="flex-1 text-sm text-foreground">
                    {line}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <EmptyState
              variant="compact"
              icon={FileText}
              title="Aucune ligne detectee"
              body="Colle des paroles avec une phrase par ligne, puis nettoie si necessaire."
              className="rounded-2xl border border-border bg-card"
            />
          )}
        </View>

        <Button
          size="lg"
          disabled={!lines.length}
          onPress={() => onCreate(lines)}
          className="mt-6 h-14 rounded-2xl">
          <Icon as={Plus} className="size-5 text-primary-foreground" />
          <Text>Creer les lignes</Text>
        </Button>
      </View>
    </View>
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

function FineTuneSheet({
  line,
  index,
  time,
  duration,
  onClose,
  onSave,
}: {
  line?: LyricLineData;
  index: number;
  time: number;
  duration: number;
  onClose: () => void;
  onSave: (time: number) => void;
}) {
  const [draftTime, setDraftTime] = React.useState(time);
  const progress = Math.max(0, Math.min(1, draftTime / duration));

  function nudge(delta: number) {
    setDraftTime((current) => Math.max(0, Math.min(duration, current + delta)));
  }

  return (
    <View className="absolute inset-0 z-50 justify-end bg-black/60">
      <Pressable className="absolute inset-0" onPress={onClose} />
      <View className="rounded-t-[28px] border border-border bg-background px-5 pb-6 pt-3">
        <View className="mb-5 items-center">
          <View className="h-1.5 w-12 rounded-full bg-input" />
        </View>

        <View className="mb-5 flex-row items-start justify-between gap-4">
          <View className="flex-1">
            <Text className="text-2xl font-semibold text-foreground">Fine tune</Text>
            <Text className="mt-1 text-sm leading-5 text-muted-foreground">
              Ajuste le timestamp de la ligne active avec precision.
            </Text>
          </View>
          <Button variant="ghost" size="icon" onPress={onClose} className="rounded-full">
            <Icon as={X} className="size-5 text-foreground" />
          </Button>
        </View>

        <View className="rounded-2xl border border-border bg-card px-4 py-4">
          <View className="mb-4 flex-row items-center justify-between">
            <Text className="font-mono text-xs text-muted-foreground">LINE {String(index + 1).padStart(2, '0')}</Text>
            <Text className="font-mono text-xs text-primary">{line?.t == null ? 'nouveau timestamp' : 'timestamp existant'}</Text>
          </View>
          <Text className="text-xl font-semibold leading-7 text-foreground">{line?.text || 'Aucune ligne active'}</Text>
        </View>

        <View className="mt-5 items-center rounded-3xl border border-primary/25 bg-primary/10 px-5 py-6">
          <Text className="font-mono text-[42px] font-semibold leading-[48px] text-foreground">{formatTime(draftTime)}</Text>
          <Text className="mt-1 font-mono text-xs text-muted-foreground">
            {draftTime >= time ? '+' : '-'}
            {Math.abs(draftTime - time).toFixed(2)}s vs current
          </Text>
        </View>

        <View className="mt-5">
          <FineTuneTrack progress={progress} duration={duration} onChange={setDraftTime} />
        </View>

        <View className="mt-5 flex-row gap-2">
          <NudgeButton label="-0.25" icon={Minus} onPress={() => nudge(-0.25)} />
          <NudgeButton label="-0.05" icon={Minus} onPress={() => nudge(-0.05)} />
          <NudgeButton label="+0.05" icon={Plus} onPress={() => nudge(0.05)} />
          <NudgeButton label="+0.25" icon={Plus} onPress={() => nudge(0.25)} />
        </View>

        <View className="mt-5 flex-row gap-2">
          <Button variant="outline" onPress={onClose} className="h-14 flex-1 rounded-2xl bg-card">
            <Text>Annuler</Text>
          </Button>
          <Button onPress={() => onSave(draftTime)} disabled={!line?.text} className="h-14 flex-1 rounded-2xl">
            <Icon as={Save} className="size-5 text-primary-foreground" />
            <Text>Appliquer</Text>
          </Button>
        </View>
      </View>
    </View>
  );
}

function FineTuneTrack({
  progress,
  duration,
  onChange,
}: {
  progress: number;
  duration: number;
  onChange: (time: number) => void;
}) {
  const { width: windowWidth } = useWindowDimensions();
  const width = Math.max(280, windowWidth - 40);
  const x = Math.max(0, Math.min(width, progress * width));

  return (
    <Pressable
      onPress={(event) => onChange(Math.max(0, Math.min(duration, (event.nativeEvent.locationX / width) * duration)))}
      className="h-12 justify-center">
      <View className="h-2 overflow-hidden rounded-full bg-input">
        <View className="h-full rounded-full bg-primary" style={{ width: `${progress * 100}%` }} />
      </View>
      <View className="absolute top-3 size-6 rounded-full border-4 border-background bg-primary" style={{ left: x - 12 }} />
    </Pressable>
  );
}

function NudgeButton({
  label,
  icon,
  onPress,
}: {
  label: string;
  icon: LucideIcon;
  onPress: () => void;
}) {
  return (
    <Button variant="outline" onPress={onPress} className="h-12 flex-1 rounded-xl bg-card px-0">
      <Icon as={icon} className="size-4 text-foreground" />
      <Text className="font-mono text-xs">{label}</Text>
    </Button>
  );
}

function findDisplayLyric(lyrics: LyricLineData[], fromIndex: number, direction: -1 | 1) {
  for (let index = fromIndex + direction; index >= 0 && index < lyrics.length; index += direction) {
    const text = lyrics[index]?.text?.trim();
    if (text) return text;
  }
  return '';
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

function cleanLyrics(value: string) {
  return value
    .replace(/\r/g, '')
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter((line, index, lines) => line || lines[index - 1])
    .join('\n')
    .trim();
}

function splitLyrics(value: string) {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

function projectToViewProject(project: LrxProject): Project {
  return {
    id: project.id,
    title: project.title,
    artist: project.artist,
    duration: project.duration,
    updated: formatRelativeUpdated(project.updatedAt),
    synced: getSyncedCount(project.lyrics),
    total: getLyricCount(project.lyrics),
    status: project.status,
    cover: project.cover,
    metadata: project.metadata,
  };
}

function projectLyricsToEditorLyrics(project: LrxProject): LyricLineData[] {
  return project.lyrics.map((line) => ({
    id: line.id,
    text: line.text,
    t: line.t,
  }));
}

function formatRelativeUpdated(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'recemment';

  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.max(0, Math.floor(diffMs / 60000));
  if (diffMinutes < 1) return 'maintenant';
  if (diffMinutes < 60) return `il y a ${diffMinutes} min`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `il y a ${diffHours} h`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'hier';
  return `il y a ${diffDays} j`;
}

function normalizeAudioTitle(fileName: string) {
  return fileName
    .replace(/\.[^/.]+$/, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim() || 'Nouveau projet';
}

function buildLrcFile(project: Project, lyrics: LyricLineData[]) {
  const metadata = project.metadata;
  const title = metadata?.title || project.title;
  const artist = metadata?.artist || project.artist;
  const tags = [
    ['ti', title],
    ['ar', artist],
    ['al', metadata?.album],
    ['by', metadata?.author],
    ['re', metadata?.genre],
  ]
    .filter(([, value]) => Boolean(value))
    .map(([key, value]) => `[${key}:${escapeLrcValue(String(value))}]`);

  const body = lyrics
    .filter((line) => line.text.trim())
    .map((line) => {
      const stamp = line.t == null ? '--:--.--' : formatTime(line.t);
      return `[${stamp}] ${line.text.trim()}`;
    });

  return [...tags, '', ...body].join('\n');
}

function escapeLrcValue(value: string) {
  return value.replace(/[\r\n[\]]/g, ' ').replace(/\s+/g, ' ').trim();
}

function toFileName(value: string) {
  return (
    value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .toLowerCase() || 'lyrics'
  );
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
