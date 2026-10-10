import { EditorScreen } from '@/components/lrx/editor';
import { MetadataSheet, MoreSheet } from '@/components/lrx/sheets';
import { projectToViewProject } from '@/lib/lrx-editor-utils';
import { useLrxStore } from '@/lib/lrx-store';
import { confirmDeleteProject } from '@/lib/confirm';
import { goBackOrHome } from '@/lib/navigation';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { Tag, Trash2 } from 'lucide-react-native';
import * as React from 'react';

export default function EditorRoute() {
  const { projectId } = useLocalSearchParams<{ projectId: string }>();
  const storedProject = useLrxStore((state) => state.projects.find((item) => item.id === projectId));
  const saveStoredMetadata = useLrxStore((state) => state.saveMetadata);
  const deleteStoredProject = useLrxStore((state) => state.deleteProject);
  const [moreOpen, setMoreOpen] = React.useState(false);
  const [metadataOpen, setMetadataOpen] = React.useState(false);
  const project = React.useMemo(
    () => (storedProject ? projectToViewProject(storedProject) : null),
    [storedProject]
  );

  if (!project) return <Redirect href="/" />;

  return (
    <>
      <EditorScreen
        projectId={project.id}
        onBack={goBackOrHome}
        onOpenMore={() => setMoreOpen(true)}
      />
      {moreOpen ? (
        <MoreSheet
          title={project.title}
          onClose={() => setMoreOpen(false)}
          items={[
            { icon: Tag, label: 'Metadonnees', sub: 'Titre, artiste, album', onPress: () => setMetadataOpen(true) },
            {
              icon: Trash2,
              label: 'Supprimer le projet',
              danger: true,
              onPress: () =>
                confirmDeleteProject(project.title, () => {
                  goBackOrHome();
                  deleteStoredProject(project.id);
                }),
            },
          ]}
        />
      ) : null}
      {metadataOpen ? (
        <MetadataSheet
          project={project}
          onClose={() => setMetadataOpen(false)}
          onSave={(metadata) => {
            saveStoredMetadata(project.id, metadata);
            setMetadataOpen(false);
          }}
        />
      ) : null}
    </>
  );
}
