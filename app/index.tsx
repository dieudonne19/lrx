import { HomeScreen } from '@/components/lrx/screens';
import { AudioPickerSheet, ImportLyricsSheet } from '@/components/lrx/sheets';
import { normalizeAudioTitle, projectToViewProject } from '@/lib/lrx-editor-utils';
import { useLrxStore } from '@/lib/lrx-store';
import { openEditor } from '@/lib/navigation';
import { Redirect, router } from 'expo-router';
import * as React from 'react';

export default function HomeRoute() {
  const storeProjects = useLrxStore((state) => state.projects);
  const createStoredProject = useLrxStore((state) => state.createProject);
  const hasOnboarded = useLrxStore((state) => state.hasOnboarded);
  const [importOpen, setImportOpen] = React.useState(false);
  const [audioOpen, setAudioOpen] = React.useState(false);
  const homeProjects = React.useMemo(() => storeProjects.map(projectToViewProject), [storeProjects]);

  if (!hasOnboarded) return <Redirect href="/onboarding" />;

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
