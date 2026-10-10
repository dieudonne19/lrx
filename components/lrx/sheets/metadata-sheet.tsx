import { resolveFontFamily } from '@/lib/fonts';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import type { LrcMetadata, Project } from '@/lib/lrx-ui-types';
import { Save, Tag } from 'lucide-react-native';
import * as React from 'react';
import { TextInput, View } from 'react-native';
import { Sheet, SheetHeader } from './sheet';

export function MetadataSheet({
  project,
  onClose,
  onSave,
}: {
  project: Project;
  onClose: () => void;
  onSave: (metadata: LrcMetadata) => void;
}) {
  const [metadata, setMetadata] = React.useState<LrcMetadata>({
    title: project.metadata?.title ?? project.title,
    artist: project.metadata?.artist ?? project.artist,
    album: project.metadata?.album ?? '',
    author: project.metadata?.author ?? '',
    genre: project.metadata?.genre ?? '',
  });

  function updateField(field: keyof LrcMetadata, value: string) {
    setMetadata((current) => ({ ...current, [field]: value }));
  }

  return (
    <Sheet onClose={onClose}>
      <SheetHeader title="Metadata LRC" subtitle="Ces infos seront ajoutees en entete du fichier exporte." onClose={onClose} />

      <View className="gap-3">
        <MetadataField label="Title" value={metadata.title} onChange={(value) => updateField('title', value)} />
        <MetadataField label="Artist" value={metadata.artist} onChange={(value) => updateField('artist', value)} />
        <MetadataField label="Album" value={metadata.album} onChange={(value) => updateField('album', value)} />
        <MetadataField label="Author" value={metadata.author} onChange={(value) => updateField('author', value)} />
        <MetadataField label="Genre" value={metadata.genre} onChange={(value) => updateField('genre', value)} />
      </View>

      <View className="mt-5 rounded-2xl border border-border bg-card px-4 py-3">
        <View className="mb-2 flex-row items-center gap-2">
          <Icon as={Tag} className="size-4 text-primary" />
          <Text className="text-xs font-semibold uppercase tracking-[1.8px] text-primary">Preview tags</Text>
        </View>
        <Text className="font-mono text-xs leading-5 text-muted-foreground">[ti:{metadata.title || project.title}]</Text>
        <Text className="font-mono text-xs leading-5 text-muted-foreground">[ar:{metadata.artist || project.artist}]</Text>
        {metadata.album ? <Text className="font-mono text-xs leading-5 text-muted-foreground">[al:{metadata.album}]</Text> : null}
        {metadata.author ? <Text className="font-mono text-xs leading-5 text-muted-foreground">[by:{metadata.author}]</Text> : null}
        {metadata.genre ? <Text className="font-mono text-xs leading-5 text-muted-foreground">[re:{metadata.genre}]</Text> : null}
      </View>

      <Button size="lg" onPress={() => onSave(metadata)} className="mt-6 h-14 rounded-2xl">
        <Icon as={Save} className="size-5 text-primary-foreground" />
        <Text>Enregistrer</Text>
      </Button>
    </Sheet>
  );
}

function MetadataField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <View className="rounded-2xl border border-border bg-card px-4 py-3">
      <Text className="mb-1 text-[11px] font-semibold uppercase tracking-[1.6px] text-muted-foreground">
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={label}
        placeholderTextColor="#5C6068"
        style={{ fontFamily: resolveFontFamily() }}
        className="text-base text-foreground"
      />
    </View>
  );
}
