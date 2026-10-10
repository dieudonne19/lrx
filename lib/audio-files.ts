import { Directory, File, Paths } from 'expo-file-system';
import { toFileName } from './lrx-editor-utils';

export const MAX_AUDIO_BYTES = 100 * 1024 * 1024;
const SUPPORTED_EXTENSIONS = ['mp3', 'wav', 'm4a', 'aac', 'flac', 'ogg'];

function getExtension(name: string) {
  const match = /\.([a-z0-9]+)$/i.exec(name);
  return match ? match[1].toLowerCase() : '';
}

// Returns a user-facing message when the picked file cannot be used, otherwise null.
export function getAudioFileError(asset: { name?: string; size?: number }) {
  const extension = getExtension(asset.name ?? '');
  if (extension && !SUPPORTED_EXTENSIONS.includes(extension)) {
    return `Le format .${extension} n’est pas pris en charge. Utilise MP3, WAV, M4A, AAC, FLAC ou OGG.`;
  }
  if (asset.size != null && asset.size > MAX_AUDIO_BYTES) {
    return `Ce fichier fait ${Math.round(asset.size / 1024 / 1024)} Mo. La limite est de ${MAX_AUDIO_BYTES / 1024 / 1024} Mo.`;
  }
  return null;
}

// The picker returns a cache copy that the system may purge, so keep a durable copy in the app documents.
export function saveAudioFile(sourceUri: string, name: string) {
  const directory = new Directory(Paths.document, 'audio');
  directory.create({ idempotent: true, intermediates: true });

  const extension = getExtension(name);
  const baseName = toFileName(name.replace(/\.[^/.]+$/, ''));
  const target = new File(directory, `${Date.now().toString(36)}-${baseName}${extension ? `.${extension}` : ''}`);
  new File(sourceUri).copy(target);
  return target.uri;
}
