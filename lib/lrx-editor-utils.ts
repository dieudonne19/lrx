import { getLyricCount, getSyncedCount, type LrxProject } from './lrx-store';
import type { LyricLineData, Project } from './lrx-ui-types';

export function buildWaveformPath(data: number[], width: number, height: number) {
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

export function findNextLyric(lyrics: LyricLineData[], current: number) {
  for (let index = current + 1; index < lyrics.length; index += 1) {
    if (lyrics[index].text) return index;
  }
  return current;
}

export function findPreviousLyric(lyrics: LyricLineData[], current: number) {
  for (let index = current - 1; index >= 0; index -= 1) {
    if (lyrics[index].text) return index;
  }
  return current;
}

export function findDisplayLyric(lyrics: LyricLineData[], fromIndex: number, direction: -1 | 1) {
  for (let index = fromIndex + direction; index >= 0 && index < lyrics.length; index += direction) {
    const text = lyrics[index]?.text?.trim();
    if (text) return text;
  }
  return '';
}

export function cleanLyrics(value: string) {
  return value
    .replace(/\r/g, '')
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter((line, index, lines) => line || lines[index - 1])
    .join('\n')
    .trim();
}

export function splitLyrics(value: string) {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

export function projectToViewProject(project: LrxProject): Project {
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

export function projectLyricsToEditorLyrics(project: LrxProject): LyricLineData[] {
  return project.lyrics.map((line) => ({
    id: line.id,
    text: line.text,
    t: line.t,
  }));
}

export function formatRelativeUpdated(value: string) {
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

export function normalizeAudioTitle(fileName: string) {
  return fileName
    .replace(/\.[^/.]+$/, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim() || 'Nouveau projet';
}

export function buildLrcFile(project: Project, lyrics: LyricLineData[]) {
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

export function toFileName(value: string) {
  return (
    value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .toLowerCase() || 'lyrics'
  );
}

export function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const centiseconds = Math.floor((totalSeconds % 1) * 100);
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(centiseconds).padStart(2, '0')}`;
}

function escapeLrcValue(value: string) {
  return value.replace(/[\r\n[\]]/g, ' ').replace(/\s+/g, ' ').trim();
}
