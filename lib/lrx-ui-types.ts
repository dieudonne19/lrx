export type LrcMetadata = {
  title: string;
  artist: string;
  album: string;
  author: string;
  genre: string;
};

export type Project = {
  id: string;
  title: string;
  artist: string;
  duration: string;
  updated: string;
  synced: number;
  total: number;
  status: 'done' | 'draft' | 'in-progress';
  cover: [string, string];
  audioName?: string;
  metadata?: LrcMetadata;
};

export type LyricLineData = {
  id?: string;
  text: string;
  t?: number;
};

export type ProjectFilter = 'all' | Project['status'];
export type ThemePreference = 'system' | 'dark' | 'light';
export type DefaultSpeed = 0.5 | 1 | 1.5;

export type SettingsPreferences = {
  theme: ThemePreference;
  defaultSpeed: DefaultSpeed;
  haptics: boolean;
  autoScroll: boolean;
  confirmUnsyncedExport: boolean;
  tapOffsetMs: number;
};
