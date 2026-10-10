import { HomeScreen } from '@/components/lrx/screens';
import { AudioPickerSheet, ImportLyricsSheet, MetadataSheet, MoreSheet } from '@/components/lrx/sheets';
import { confirmDeleteProject } from '@/lib/confirm';
import { normalizeAudioTitle, projectToViewProject } from '@/lib/lrx-editor-utils';
import { useLrxStore } from '@/lib/lrx-store';
import { openEditor } from '@/lib/navigation';
import type { Project } from '@/lib/lrx-ui-types';
import { Redirect, router } from 'expo-router';
import { Pencil, Trash2 } from 'lucide-react-native';
import * as React from 'react';

export default function HomeRoute() {
  const storeProjects = useLrxStore((state) => state.projects);
  const createStoredProject = useLrxStore((state) => state.createProject);
  const deleteStoredProject = useLrxStore((state) => state.deleteProject);
  const saveStoredMetadata = useLrxStore((state) => state.saveMetadata);
  const [actionProject, setActionProject] = React.useState<Project | null>(null);
  const [renameProject, setRenameProject] = React.useState<Project | null>(null);
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
        onMore={setActionProject}
      />
      {actionProject ? (
        <MoreSheet
          title={actionProject.title}
          onClose={() => setActionProject(null)}
          items={[
            {
              icon: Pencil,
              label: 'Renommer',
              sub: 'Titre, artiste, album',
              onPress: () => setRenameProject(actionProject),
            },
            {
              icon: Trash2,
              label: 'Supprimer le projet',
              danger: true,
              onPress: () => confirmDeleteProject(actionProject.title, () => deleteStoredProject(actionProject.id)),
            },
          ]}
        />
      ) : null}
      {renameProject ? (
        <MetadataSheet
          project={renameProject}
          onClose={() => setRenameProject(null)}
          onSave={(metadata) => {
            saveStoredMetadata(renameProject.id, metadata);
            setRenameProject(null);
          }}
        />
      ) : null}
      {audioOpen ? (
        <AudioPickerSheet
          onClose={() => setAudioOpen(false)}
          onPicked={(audio) => {
            const project = createStoredProject({
              title: normalizeAudioTitle(audio.name),
              artist: 'Audio importé',
              audioName: audio.name,
              audioUri: audio.uri,
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
