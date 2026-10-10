import {
  buildLrcFile,
  cleanLyrics,
  findNextLyric,
  findPreviousLyric,
  formatTime,
  getLrcFileName,
  normalizeAudioTitle,
  splitLyrics,
  toFileName,
} from '../lrx-editor-utils';
import type { Project } from '../lrx-ui-types';

jest.mock('expo-sqlite/kv-store', () => ({
  __esModule: true,
  default: { getItemSync: jest.fn(() => null), setItemSync: jest.fn(), removeItemSync: jest.fn() },
}));

const project: Project = {
  id: 'p1',
  title: 'Sous les néons',
  artist: 'Camille Roux',
  duration: '03:42',
  updated: 'maintenant',
  synced: 1,
  total: 2,
  status: 'in-progress',
  cover: ['#7C5CFF', '#3B2BFF'],
};

describe('cleanLyrics', () => {
  it('collapses spaces, trims lines and strips carriage returns', () => {
    expect(cleanLyrics('  Hello   world \r\n  second   line  ')).toBe('Hello world\nsecond line');
  });

  it('keeps a single blank line between stanzas', () => {
    expect(cleanLyrics('a\n\n\n\nb')).toBe('a\n\nb');
  });
});

describe('splitLyrics', () => {
  it('drops empty lines', () => {
    expect(splitLyrics('a\n\n  \nb')).toEqual(['a', 'b']);
  });
});

describe('formatTime', () => {
  it('formats minutes, seconds and centiseconds', () => {
    expect(formatTime(0)).toBe('00:00.00');
    expect(formatTime(75.5)).toBe('01:15.50');
  });

  it('does not lose a centisecond to floating point error', () => {
    expect(formatTime(75.05)).toBe('01:15.05');
    expect(formatTime(12.4)).toBe('00:12.40');
  });

  it('carries a rounded-up centisecond into the next second and clamps negatives', () => {
    expect(formatTime(59.999)).toBe('01:00.00');
    expect(formatTime(-3)).toBe('00:00.00');
  });
});

describe('toFileName', () => {
  it('removes accents and punctuation', () => {
    expect(toFileName('Sous les néons !')).toBe('sous-les-neons');
  });

  it('falls back to lyrics when nothing is left', () => {
    expect(toFileName('???')).toBe('lyrics');
  });
});

describe('normalizeAudioTitle', () => {
  it('turns a file name into a title', () => {
    expect(normalizeAudioTitle('neons_master-v3.wav')).toBe('neons master v3');
  });

  it('falls back when the name is empty', () => {
    expect(normalizeAudioTitle('.wav')).toBe('Nouveau projet');
  });
});

describe('findNextLyric / findPreviousLyric', () => {
  const lyrics = [{ text: 'a' }, { text: '' }, { text: 'b' }, { text: '' }];

  it('skips instrumental lines', () => {
    expect(findNextLyric(lyrics, 0)).toBe(2);
    expect(findPreviousLyric(lyrics, 2)).toBe(0);
  });

  it('stays on the current line at the edges', () => {
    expect(findNextLyric(lyrics, 2)).toBe(2);
    expect(findPreviousLyric(lyrics, 0)).toBe(0);
  });
});

describe('buildLrcFile', () => {
  it('writes metadata tags then timestamped lines', () => {
    const file = buildLrcFile(
      { ...project, metadata: { title: 'Titre', artist: 'Artiste', album: 'Album', author: 'Moi', genre: '' } },
      [
        { text: 'Première ligne', t: 12.4 },
        { text: 'Deuxième ligne', t: 75.05 },
      ]
    );

    expect(file.split('\n')).toEqual([
      '[ti:Titre]',
      '[ar:Artiste]',
      '[al:Album]',
      '[by:Moi]',
      '',
      '[00:12.40] Première ligne',
      '[01:15.05] Deuxième ligne',
    ]);
  });

  it('falls back to the project title and artist and omits empty tags', () => {
    const file = buildLrcFile(project, [{ text: 'a', t: 1 }]);
    expect(file).toBe('[ti:Sous les néons]\n[ar:Camille Roux]\n\n[00:01.00] a');
  });

  it('skips instrumental lines and marks lines without a timestamp', () => {
    const file = buildLrcFile(project, [
      { text: '', t: 5 },
      { text: 'sans temps' },
    ]);
    expect(file.split('\n').slice(3)).toEqual(['[--:--.--] sans temps']);
  });

  it('keeps brackets and line breaks out of tag values', () => {
    const file = buildLrcFile(
      { ...project, metadata: { title: 'A [live]\nversion', artist: 'B', album: '', author: '', genre: '' } },
      []
    );
    expect(file.split('\n')[0]).toBe('[ti:A live version]');
  });
});

describe('getLrcFileName', () => {
  it('uses the music file name with a .lrc extension', () => {
    expect(getLrcFileName({ title: 'Titre du projet', audioName: 'Sous les néons - Master v3.mp3' })).toBe(
      'Sous les néons - Master v3.lrc'
    );
  });

  it('only drops the last extension of the music file', () => {
    expect(getLrcFileName({ title: 'x', audioName: 'a.b.c.wav' })).toBe('a.b.c.lrc');
  });

  it('removes characters file systems reject but keeps case and accents', () => {
    expect(getLrcFileName({ title: 'x', audioName: 'Été: "Live" / 2/3?.m4a' })).toBe('Été Live 2 3.lrc');
  });

  it('falls back to the title when there is no audio', () => {
    expect(getLrcFileName({ title: 'Mes paroles' })).toBe('Mes paroles.lrc');
    expect(getLrcFileName({ title: 'Mes paroles', audioName: '   ' })).toBe('Mes paroles.lrc');
  });

  it('never returns an empty name', () => {
    expect(getLrcFileName({ title: '???' })).toBe('lyrics.lrc');
    expect(getLrcFileName({ title: '', audioName: '.mp3' })).toBe('lyrics.lrc');
  });
});
