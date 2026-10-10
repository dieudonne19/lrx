import Storage from 'expo-sqlite/kv-store';
import { findProjectByAudio, formatDuration, getLyricCount, getSyncedCount, useLrxStore } from '../lrx-store';

jest.mock('expo-sqlite/kv-store', () => ({
  __esModule: true,
  default: { getItemSync: jest.fn(() => null), setItemSync: jest.fn(), removeItemSync: jest.fn() },
}));

const store = () => useLrxStore.getState();

function createProject(lyrics = ['one', 'two', 'three']) {
  return store().createProject({ title: 'Test', artist: 'Artist', lyrics });
}

beforeEach(() => {
  jest.useFakeTimers();
  store().resetToSeed();
});

afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

describe('createProject', () => {
  it('creates a draft project, makes it active and puts it first', () => {
    const project = createProject();

    expect(project.status).toBe('draft');
    expect(project.lyrics.map((line) => line.text)).toEqual(['one', 'two', 'three']);
    expect(store().activeProjectId).toBe(project.id);
    expect(store().projects[0].id).toBe(project.id);
  });

  it('gives each line a unique id', () => {
    const ids = createProject().lyrics.map((line) => line.id);
    expect(new Set(ids).size).toBe(3);
  });

  it('falls back to default title and artist', () => {
    const project = store().createProject({ title: '   ' });
    expect(project.title).toBe('Nouveau projet');
    expect(project.artist).toBe('Artiste inconnu');
  });

  it('keeps the audio uri', () => {
    const project = store().createProject({ title: 'Song', audioName: 'a.mp3', audioUri: 'file:///audio/a.mp3' });
    expect(project.audioUri).toBe('file:///audio/a.mp3');
  });
});

describe('timestamps', () => {
  it('moves a project from draft to in-progress to done', () => {
    const project = createProject(['one', 'two']);
    const [first, second] = project.lyrics;

    store().updateTimestamp(project.id, first.id, 1.5);
    expect(store().projects[0].status).toBe('in-progress');

    store().updateTimestamp(project.id, second.id, 3);
    expect(store().projects[0].status).toBe('done');
  });

  it('never stores a negative timestamp', () => {
    const project = createProject(['one']);
    store().updateTimestamp(project.id, project.lyrics[0].id, -2);
    expect(store().projects[0].lyrics[0].t).toBe(0);
  });

  it('clears a timestamp and recomputes the status', () => {
    const project = createProject(['one']);
    const [line] = project.lyrics;
    store().updateTimestamp(project.id, line.id, 4);
    expect(store().projects[0].status).toBe('done');

    store().clearTimestamp(project.id, line.id);
    expect(store().projects[0].lyrics[0].t).toBeUndefined();
    expect(store().projects[0].status).toBe('draft');
  });

  it('ignores instrumental lines when counting progress', () => {
    const project = createProject(['one', '', 'two']);
    store().updateTimestamp(project.id, project.lyrics[0].id, 1);
    store().updateTimestamp(project.id, project.lyrics[2].id, 2);

    const lyrics = store().projects[0].lyrics;
    expect(getLyricCount(lyrics)).toBe(2);
    expect(getSyncedCount(lyrics)).toBe(2);
    expect(store().projects[0].status).toBe('done');
  });
});

describe('restoreLyrics', () => {
  it('replaces the lyrics (undo/redo) and recomputes the status', () => {
    const project = createProject(['one']);
    const [line] = project.lyrics;
    store().updateTimestamp(project.id, line.id, 2);

    store().restoreLyrics(project.id, [{ id: line.id, text: 'one' }]);
    expect(store().projects[0].lyrics[0].t).toBeUndefined();
    expect(store().projects[0].status).toBe('draft');
  });
});

describe('lyrics editing', () => {
  it('updates a line text without touching its timestamp', () => {
    const project = createProject(['one']);
    const [line] = project.lyrics;
    store().updateTimestamp(project.id, line.id, 2);

    store().updateLyricText(project.id, line.id, 'uno');
    expect(store().projects[0].lyrics[0]).toMatchObject({ text: 'uno', t: 2 });
  });

  it('importLyrics replaces every line and goes back to draft', () => {
    const project = createProject(['one']);
    store().updateTimestamp(project.id, project.lyrics[0].id, 2);

    store().importLyrics(project.id, ['a', 'b']);
    expect(store().projects[0].lyrics.map((line) => line.text)).toEqual(['a', 'b']);
    expect(store().projects[0].status).toBe('draft');
  });
});

describe('deleteProject', () => {
  it('falls back to the first remaining project when the active one is deleted', () => {
    const project = createProject();
    store().deleteProject(project.id);

    expect(store().projects.some((item) => item.id === project.id)).toBe(false);
    expect(store().activeProjectId).toBe(store().projects[0]?.id ?? null);
  });

  it('has no active project when the last one is deleted', () => {
    store().projects.forEach((item) => store().deleteProject(item.id));
    expect(store().projects).toEqual([]);
    expect(store().activeProjectId).toBeNull();
  });
});

describe('audio', () => {
  it('stores the real duration and its label', () => {
    const project = createProject();
    store().setDuration(project.id, 222.4);
    expect(store().projects[0]).toMatchObject({ durationSec: 222.4, duration: '03:42' });
  });

  it('does not touch the project when the duration is unchanged', () => {
    const project = createProject();
    store().setDuration(project.id, 100);
    const before = store().projects[0];
    store().setDuration(project.id, 100);
    expect(store().projects[0]).toBe(before);
  });

  it('forgets the old duration when another audio file is attached', () => {
    const project = createProject();
    store().setDuration(project.id, 100);
    store().attachAudio(project.id, { name: 'new.mp3', uri: 'file:///new.mp3' });
    expect(store().projects[0]).toMatchObject({ audioUri: 'file:///new.mp3', audioName: 'new.mp3', durationSec: undefined });
  });
});

describe('formatDuration', () => {
  it('formats seconds as mm:ss', () => {
    expect(formatDuration(0)).toBe('00:00');
    expect(formatDuration(61.9)).toBe('01:01');
  });
});

describe('settings and onboarding', () => {
  it('merges partial settings updates', () => {
    store().updateSettings({ haptics: false });
    expect(store().settings.haptics).toBe(false);
    expect(store().settings.autoScroll).toBe(true);
  });

  it('remembers that onboarding is done', () => {
    expect(store().hasOnboarded).toBe(false);
    store().completeOnboarding();
    expect(store().hasOnboarded).toBe(true);
  });
});

describe('persistence', () => {
  it('batches writes instead of writing on every change', () => {
    const setItem = Storage.setItemSync as jest.Mock;
    setItem.mockClear();
    jest.runOnlyPendingTimers();
    setItem.mockClear();

    const project = createProject(['one', 'two']);
    store().updateTimestamp(project.id, project.lyrics[0].id, 1);
    store().updateTimestamp(project.id, project.lyrics[1].id, 2);
    expect(setItem).not.toHaveBeenCalled();

    jest.advanceTimersByTime(500);
    expect(setItem).toHaveBeenCalledTimes(1);
    expect(JSON.parse(setItem.mock.calls[0][1]).state.projects[0].status).toBe('done');
  });
});

describe('findProjectByAudio', () => {
  const withAudio = () =>
    store().createProject({ title: 'Song', audioName: 'neons.mp3', audioUri: 'file:///a/neons.mp3', audioSize: 4000 });

  it('finds the project that already uses the same file name and size', () => {
    const project = withAudio();
    expect(findProjectByAudio(store().projects, { name: 'neons.mp3', size: 4000 })?.id).toBe(project.id);
  });

  it('does not match another size or another name', () => {
    withAudio();
    expect(findProjectByAudio(store().projects, { name: 'neons.mp3', size: 4001 })).toBeUndefined();
    expect(findProjectByAudio(store().projects, { name: 'other.mp3', size: 4000 })).toBeUndefined();
  });

  it('never reports a duplicate when the size is unknown', () => {
    withAudio();
    expect(findProjectByAudio(store().projects, { name: 'neons.mp3', size: null })).toBeUndefined();
    expect(findProjectByAudio(store().projects, { name: 'neons.mp3' })).toBeUndefined();
  });

  it('ignores the project being edited', () => {
    const project = withAudio();
    expect(findProjectByAudio(store().projects, { name: 'neons.mp3', size: 4000 }, project.id)).toBeUndefined();
  });

  it('keeps the size when audio is attached later', () => {
    const project = store().createProject({ title: 'Lyrics first' });
    store().attachAudio(project.id, { name: 'late.wav', uri: 'file:///late.wav', size: 10 });
    expect(findProjectByAudio(store().projects, { name: 'late.wav', size: 10 })?.id).toBe(project.id);
  });
});
