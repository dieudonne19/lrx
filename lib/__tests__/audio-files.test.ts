import { getAudioFileError, MAX_AUDIO_BYTES } from '../audio-files';

jest.mock('expo-file-system', () => ({ Directory: class {}, File: class {}, Paths: { document: '' } }));
jest.mock('expo-sqlite/kv-store', () => ({
  __esModule: true,
  default: { getItemSync: jest.fn(() => null), setItemSync: jest.fn(), removeItemSync: jest.fn() },
}));

describe('getAudioFileError', () => {
  it.each(['song.mp3', 'song.WAV', 'a.b.m4a', 'x.aac', 'x.flac', 'x.ogg'])('accepts %s', (name) => {
    expect(getAudioFileError({ name, size: 1000 })).toBeNull();
  });

  it('rejects an unsupported format and names it', () => {
    expect(getAudioFileError({ name: 'video.mp4', size: 1000 })).toContain('.mp4');
  });

  it('rejects a file over the size limit and states the limit', () => {
    const message = getAudioFileError({ name: 'big.wav', size: MAX_AUDIO_BYTES + 1 });
    expect(message).toContain('100 Mo');
  });

  it('accepts a file exactly at the limit', () => {
    expect(getAudioFileError({ name: 'ok.wav', size: MAX_AUDIO_BYTES })).toBeNull();
  });

  it('does not reject a file whose size or extension is unknown', () => {
    expect(getAudioFileError({ name: 'noextension', size: null })).toBeNull();
    expect(getAudioFileError({})).toBeNull();
  });
});
