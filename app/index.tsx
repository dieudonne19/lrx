import { EditorScreen } from '@/components/lrx/editor';
import { HomeScreen, OnboardingScreen, SettingsScreen } from '@/components/lrx/screens';
import { AudioPickerSheet, ImportLyricsSheet, MetadataSheet } from '@/components/lrx/sheets';
import { normalizeAudioTitle, projectToViewProject } from '@/lib/lrx-editor-utils';
import { useLrxStore } from '@/lib/lrx-store';
import type { AppView, LyricLineData } from '@/lib/lrx-ui-types';
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


export default function IndexScreen() {
  const storeProjects = useLrxStore((state) => state.projects);
  const activeProjectId = useLrxStore((state) => state.activeProjectId);
  const openStoredProject = useLrxStore((state) => state.openProject);
  const createStoredProject = useLrxStore((state) => state.createProject);
  const settings = useLrxStore((state) => state.settings);
  const updateSettings = useLrxStore((state) => state.updateSettings);
  const saveStoredMetadata = useLrxStore((state) => state.saveMetadata);
  const [view, setView] = React.useState<AppView>('onboarding');
  const [importOpen, setImportOpen] = React.useState(false);
  const [audioOpen, setAudioOpen] = React.useState(false);
  const [metadataOpen, setMetadataOpen] = React.useState(false);
  const homeProjects = React.useMemo(() => storeProjects.map(projectToViewProject), [storeProjects]);
  const activeProject = React.useMemo(() => {
    const stored = storeProjects.find((item) => item.id === activeProjectId);
    return stored ? projectToViewProject(stored) : null;
  }, [storeProjects, activeProjectId]);

  if (view === 'editor' && activeProject) {
    return (
      <>
        <EditorScreen
          projectId={activeProject.id}
          onBack={() => setView('home')}
          onOpenMetadata={() => setMetadataOpen(true)}
        />
        {metadataOpen ? (
          <MetadataSheet
            project={activeProject}
            onClose={() => setMetadataOpen(false)}
            onSave={(metadata) => {
              saveStoredMetadata(activeProject.id, metadata);
              setMetadataOpen(false);
            }}
          />
        ) : null}
      </>
    );
  }

  if (view === 'settings') {
    return (
      <SettingsScreen
        preferences={settings}
        onBack={() => setView('home')}
        onChange={updateSettings}
      />
    );
  }

  if (view === 'home') {
    return (
      <>
        <HomeScreen
          projects={homeProjects}
          onOpen={(project) => {
            openStoredProject(project.id);
            setView('editor');
          }}
          onImportLyrics={() => setImportOpen(true)}
          onImportAudio={() => setAudioOpen(true)}
          onOpenSettings={() => setView('settings')}
        />
        {audioOpen ? (
          <AudioPickerSheet
            onClose={() => setAudioOpen(false)}
            onCreate={(audioName, duration = '00:00') => {
              createStoredProject({
                title: normalizeAudioTitle(audioName),
                artist: 'Audio importe',
                duration,
                audioName,
                lyrics: INITIAL_LYRICS.map((line) => line.text).filter(Boolean),
                cover: ['#7C5CFF', '#3B2BFF'],
              });
              setAudioOpen(false);
              setView('editor');
            }}
          />
        ) : null}
        {importOpen ? (
          <ImportLyricsSheet
            onClose={() => setImportOpen(false)}
            onCreate={(lines) => {
              createStoredProject({
                title: 'Nouveau lyrics',
                artist: 'Import manuel',
                duration: '00:00',
                lyrics: lines,
                cover: ['#7C5CFF', '#F5536D'],
              });
              setImportOpen(false);
              setView('editor');
            }}
          />
        ) : null}
      </>
    );
  }

  return <OnboardingScreen onComplete={() => setView('home')} />;
}
