import { Directory, File, Paths } from 'expo-file-system';
import { toFileName } from './lrx-editor-utils';

export const MAX_AUDIO_BYTES = 100 * 1024 * 1024;
const SUPPORTED_EXTENSIONS = ['mp3', 'wav', 'm4a', 'aac', 'flac', 'ogg'];

function getExtension(name: string) {
  const match = /\.([a-z0-9]+)$/i.exec(name);
  return match ? match[1].toLowerCase() : '';
}

// Returns a user-facing message when the picked file cannot be used, otherwise null.
export function getAudioFileError(asset: { name?: string; size?: number | null }) {
  const extension = getExtension(asset.name ?? '');
  if (extension && !SUPPORTED_EXTENSIONS.includes(extension)) {
    return `Le format .${extension} n’est pas pris en charge. Utilise MP3, WAV, M4A, AAC, FLAC ou OGG.`;
  }
  if (asset.size != null && asset.size > MAX_AUDIO_BYTES) {
    return `Ce fichier fait ${Math.round(asset.size / 1024 / 1024)} Mo. La limite est de ${MAX_AUDIO_BYTES / 1024 / 1024} Mo.`;
  }
  return null;
}

// Opens the system picker. The returned File comes from the same module as the copy below, so it is
// readable without extra permissions (the document picker's cache file was rejected with "Missing READ permission").
export async function pickAudioFile() {
  const picked = await File.pickFileAsync({ mimeTypes: 'audio/*' });
  return picked.canceled ? null : picked.result;
}

// The picked file may live outside the app and can disappear, so keep a durable copy in the app documents.
export async function saveAudioFile(source: File) {
  const directory = new Directory(Paths.document, 'audio');
  directory.create({ idempotent: true, intermediates: true });

  const extension = getExtension(source.name);
  const baseName = toFileName(source.name.replace(/\.[^/.]+$/, ''));
  const target = new File(directory, `${Date.now().toString(36)}-${baseName}${extension ? `.${extension}` : ''}`);
  await source.copy(target);
  if (!target.exists || !target.size) throw new Error('The audio copy is missing or empty.');
  return target.uri;
}
