import { EditorScreen } from '@/components/lrx/editor';
import { MetadataSheet } from '@/components/lrx/sheets';
import { projectToViewProject } from '@/lib/lrx-editor-utils';
import { useLrxStore } from '@/lib/lrx-store';
import { goBackOrHome } from '@/lib/navigation';
import { Redirect, useLocalSearchParams } from 'expo-router';
import * as React from 'react';

export default function EditorRoute() {
  const { projectId } = useLocalSearchParams<{ projectId: string }>();
  const storedProject = useLrxStore((state) => state.projects.find((item) => item.id === projectId));
  const saveStoredMetadata = useLrxStore((state) => state.saveMetadata);
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
        onOpenMetadata={() => setMetadataOpen(true)}
      />
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
