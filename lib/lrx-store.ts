import { createMMKV } from 'react-native-mmkv';
import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';

export type LrxProjectStatus = 'done' | 'draft' | 'in-progress';
export type LrxThemePreference = 'system' | 'dark' | 'light';
export type LrxDefaultSpeed = 0.5 | 1 | 1.5;

export type LrxMetadata = {
  title: string;
  artist: string;
  album: string;
  author: string;
  genre: string;
};

export type LrxLyricLine = {
  id: string;
  text: string;
  t?: number;
};

export type LrxProject = {
  id: string;
  title: string;
  artist: string;
  duration: string;
  updatedAt: string;
  status: LrxProjectStatus;
  cover: [string, string];
  audioName?: string;
  metadata: LrxMetadata;
  lyrics: LrxLyricLine[];
};

export type LrxSettings = {
  theme: LrxThemePreference;
  defaultSpeed: LrxDefaultSpeed;
  haptics: boolean;
  autoScroll: boolean;
  confirmUnsyncedExport: boolean;
};

export type CreateProjectInput = {
  title: string;
  artist?: string;
  duration?: string;
  audioName?: string;
  lyrics?: string[];
  cover?: [string, string];
};

type LrxStoreState = {
  projects: LrxProject[];
  activeProjectId: string | null;
  settings: LrxSettings;
};

type LrxStoreActions = {
  createProject: (input: CreateProjectInput) => LrxProject;
  openProject: (projectId: string) => void;
  deleteProject: (projectId: string) => void;
  importLyrics: (projectId: string, lines: string[]) => void;
  updateLyricText: (projectId: string, lineId: string, text: string) => void;
  updateTimestamp: (projectId: string, lineId: string, time: number) => void;
  clearTimestamp: (projectId: string, lineId: string) => void;
  saveMetadata: (projectId: string, metadata: LrxMetadata) => void;
  updateSettings: (settings: Partial<LrxSettings>) => void;
  resetToSeed: () => void;
};

export type LrxStore = LrxStoreState & LrxStoreActions;

const STORAGE_VERSION = 1;

const lrxStorage = createMMKV({ id: 'lrx-store' });

const zustandStorage: StateStorage = {
  getItem: (name) => lrxStorage.getString(name) ?? null,
  setItem: (name, value) => lrxStorage.set(name, value),
  removeItem: (name) => {
    lrxStorage.remove(name);
  },
};

export const DEFAULT_LRX_SETTINGS: LrxSettings = {
  theme: 'dark',
  defaultSpeed: 1,
  haptics: true,
  autoScroll: true,
  confirmUnsyncedExport: true,
};

const SEED_PROJECTS: LrxProject[] = [
  createProjectSeed({
    id: 'neons',
    title: 'Sous les neons',
    artist: 'Camille Roux',
    duration: '03:42',
    updatedAt: new Date('2026-05-21T12:00:00.000Z').toISOString(),
    status: 'in-progress',
    cover: ['#7C5CFF', '#3B2BFF'],
    lyrics: [
      { text: 'Sous les neons', t: 2.14 },
      { text: 'Je cherche encore', t: 5.82 },
      { text: 'Les rues parlent en silence' },
      { text: 'La nuit garde sa cadence' },
    ],
  }),
  createProjectSeed({
    id: 'after-hours',
    title: 'After Hours Demo',
    artist: 'Noir Atelier',
    duration: '02:58',
    updatedAt: new Date('2026-05-20T16:30:00.000Z').toISOString(),
    status: 'done',
    cover: ['#3FD17A', '#0A7F55'],
    lyrics: [
      { text: 'Lights on the pavement', t: 0.72 },
      { text: 'We move through the static', t: 4.2 },
      { text: 'No signal can find us', t: 8.8 },
    ],
  }),
];

export const useLrxStore = create<LrxStore>()(
  persist(
    (set, get) => ({
      projects: SEED_PROJECTS,
      activeProjectId: SEED_PROJECTS[0]?.id ?? null,
      settings: DEFAULT_LRX_SETTINGS,

      createProject: (input) => {
        const project = createProjectFromInput(input);
        set((state) => ({
          projects: [project, ...state.projects],
          activeProjectId: project.id,
        }));
        return project;
      },

      openProject: (projectId) => {
        if (!get().projects.some((project) => project.id === projectId)) return;
        set({ activeProjectId: projectId });
      },

      deleteProject: (projectId) => {
        set((state) => {
          const projects = state.projects.filter((project) => project.id !== projectId);
          return {
            projects,
            activeProjectId:
              state.activeProjectId === projectId ? projects[0]?.id ?? null : state.activeProjectId,
          };
        });
      },

      importLyrics: (projectId, lines) => {
        set((state) => ({
          projects: updateProject(state.projects, projectId, (project) => ({
            ...project,
            lyrics: linesToLyrics(lines),
            status: 'draft',
            updatedAt: nowIso(),
          })),
        }));
      },

      updateLyricText: (projectId, lineId, text) => {
        set((state) => ({
          projects: updateProject(state.projects, projectId, (project) => ({
            ...project,
            lyrics: project.lyrics.map((line) => (line.id === lineId ? { ...line, text } : line)),
            updatedAt: nowIso(),
          })),
        }));
      },

      updateTimestamp: (projectId, lineId, time) => {
        set((state) => ({
          projects: updateProject(state.projects, projectId, (project) => {
            const lyrics = project.lyrics.map((line) =>
              line.id === lineId ? { ...line, t: Math.max(0, time) } : line
            );

            return {
              ...project,
              lyrics,
              status: getProjectStatus(lyrics),
              updatedAt: nowIso(),
            };
          }),
        }));
      },

      clearTimestamp: (projectId, lineId) => {
        set((state) => ({
          projects: updateProject(state.projects, projectId, (project) => {
            const lyrics = project.lyrics.map((line) => {
              if (line.id !== lineId) return line;
              const { t: _timestamp, ...nextLine } = line;
              return nextLine;
            });

            return {
              ...project,
              lyrics,
              status: getProjectStatus(lyrics),
              updatedAt: nowIso(),
            };
          }),
        }));
      },

      saveMetadata: (projectId, metadata) => {
        set((state) => ({
          projects: updateProject(state.projects, projectId, (project) => ({
            ...project,
            title: metadata.title || project.title,
            artist: metadata.artist || project.artist,
            metadata,
            updatedAt: nowIso(),
          })),
        }));
      },

      updateSettings: (settings) => {
        set((state) => ({ settings: { ...state.settings, ...settings } }));
      },

      resetToSeed: () => {
        set({
          projects: SEED_PROJECTS,
          activeProjectId: SEED_PROJECTS[0]?.id ?? null,
          settings: DEFAULT_LRX_SETTINGS,
        });
      },
    }),
    {
      name: 'lrx-store',
      version: STORAGE_VERSION,
      storage: createJSONStorage(() => zustandStorage),
      partialize: (state) => ({
        projects: state.projects,
        activeProjectId: state.activeProjectId,
        settings: state.settings,
      }),
    }
  )
);

export function selectActiveProject(state: LrxStore) {
  return state.projects.find((project) => project.id === state.activeProjectId) ?? null;
}

export function getSyncedCount(lyrics: LrxLyricLine[]) {
  return lyrics.filter((line) => line.text.trim() && line.t != null).length;
}

export function getLyricCount(lyrics: LrxLyricLine[]) {
  return lyrics.filter((line) => line.text.trim()).length;
}

function createProjectFromInput(input: CreateProjectInput): LrxProject {
  const title = input.title.trim() || 'Nouveau projet';
  const artist = input.artist?.trim() || 'Artiste inconnu';

  return {
    id: createId('project'),
    title,
    artist,
    duration: input.duration ?? '00:00',
    updatedAt: nowIso(),
    status: 'draft',
    cover: input.cover ?? ['#7C5CFF', '#3B2BFF'],
    audioName: input.audioName,
    metadata: {
      title,
      artist,
      album: '',
      author: '',
      genre: '',
    },
    lyrics: linesToLyrics(input.lyrics ?? []),
  };
}

function createProjectSeed(input: Omit<LrxProject, 'metadata' | 'lyrics'> & { lyrics: Array<{ text: string; t?: number }> }) {
  return {
    ...input,
    metadata: {
      title: input.title,
      artist: input.artist,
      album: '',
      author: '',
      genre: '',
    },
    lyrics: input.lyrics.map((line, index) => ({
      id: `${input.id}-line-${index + 1}`,
      ...line,
    })),
  };
}

function linesToLyrics(lines: string[]) {
  return lines.map((text, index) => ({
    id: createId(`line-${index + 1}`),
    text,
  }));
}

function updateProject(projects: LrxProject[], projectId: string, update: (project: LrxProject) => LrxProject) {
  return projects.map((project) => (project.id === projectId ? update(project) : project));
}

function getProjectStatus(lyrics: LrxLyricLine[]): LrxProjectStatus {
  const total = getLyricCount(lyrics);
  if (!total) return 'draft';
  return getSyncedCount(lyrics) === total ? 'done' : 'in-progress';
}

function createId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function nowIso() {
  return new Date().toISOString();
}
