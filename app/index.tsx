import { HomeScreen } from '@/components/lrx/screens';
import { AudioPickerSheet, ImportLyricsSheet } from '@/components/lrx/sheets';
import { normalizeAudioTitle, projectToViewProject } from '@/lib/lrx-editor-utils';
import { useLrxStore } from '@/lib/lrx-store';
import { openEditor } from '@/lib/navigation';
import type { LyricLineData } from '@/lib/lrx-ui-types';
import { router } from 'expo-router';
import * as React from 'react';

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

export default function HomeRoute() {
  const storeProjects = useLrxStore((state) => state.projects);
  const createStoredProject = useLrxStore((state) => state.createProject);
  const [importOpen, setImportOpen] = React.useState(false);
  const [audioOpen, setAudioOpen] = React.useState(false);
  const homeProjects = React.useMemo(() => storeProjects.map(projectToViewProject), [storeProjects]);

  return (
    <>
      <HomeScreen
        projects={homeProjects}
        onOpen={(project) => openEditor(project.id)}
        onImportLyrics={() => setImportOpen(true)}
        onImportAudio={() => setAudioOpen(true)}
        onOpenSettings={() => router.push('/settings')}
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
            setAudioOpen(false);
            openEditor(project.id);
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
            setImportOpen(false);
            openEditor(project.id);
          }}
        />
      ) : null}
    </>
  );
}
