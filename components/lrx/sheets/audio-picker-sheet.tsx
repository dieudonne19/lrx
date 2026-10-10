import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { getAudioFileError, pickAudioFile, saveAudioFile } from '@/lib/audio-files';
import { Info, TriangleAlert, Upload } from 'lucide-react-native';
import * as React from 'react';
import { Pressable, View } from 'react-native';
import { Sheet, SheetHeader } from './sheet';

export type PickedAudio = { name: string; uri: string; size?: number };
type ExistingProject = { id: string; title: string };

export function AudioPickerSheet({
  title = 'Importer un audio',
  onClose,
  onPicked,
  findDuplicate,
  onOpenExisting,
}: {
  title?: string;
  onClose: () => void;
  onPicked: (audio: PickedAudio) => void;
  // When given, a file already used by a project is not imported again; the user can open that project instead.
  findDuplicate?: (audio: { name: string; size?: number | null }) => ExistingProject | null;
  onOpenExisting?: (projectId: string) => void;
}) {
  const [picking, setPicking] = React.useState(false);
  // Synchronous guard: `picking` is only updated after a render, so a double tap could open two pickers.
  const busyRef = React.useRef(false);
  const [error, setError] = React.useState<string | null>(null);
  const [duplicate, setDuplicate] = React.useState<ExistingProject | null>(null);

  async function pickAudio() {
    if (busyRef.current) return;
    busyRef.current = true;
    setPicking(true);
    setError(null);
    setDuplicate(null);
    try {
      const file = await pickAudioFile();
      if (!file) return;

      const problem = getAudioFileError({ name: file.name, size: file.size });
      if (problem) {
        setError(problem);
        return;
      }

      const existing = findDuplicate?.({ name: file.name, size: file.size });
      if (existing) {
        setDuplicate(existing);
        return;
      }

      onPicked({ name: file.name, uri: await saveAudioFile(file), size: file.size ?? undefined });
    } catch {
      setError('Impossible de lire ce fichier. Vérifie qu’il est accessible, puis réessaie.');
    } finally {
      busyRef.current = false;
      setPicking(false);
    }
  }

  return (
    <Sheet onClose={onClose}>
      <SheetHeader title={title} subtitle="Choisis un fichier audio de ton appareil." onClose={onClose} />

      <Pressable
        accessibilityRole="button"
        disabled={picking}
        onPress={pickAudio}
        className="items-center justify-center rounded-3xl border border-dashed border-primary/60 bg-primary/10 px-5 py-8">
        <View className="mb-4 size-14 items-center justify-center rounded-2xl bg-primary">
          <Icon as={Upload} className="size-7 text-primary-foreground" />
        </View>
        <Text className="text-base font-semibold text-foreground">
          {picking ? 'Ouverture…' : 'Choisir un fichier audio'}
        </Text>
        <Text className="mt-1 text-center text-sm leading-5 text-muted-foreground">
          MP3, WAV, M4A, AAC, FLAC ou OGG, 100 Mo maximum.
        </Text>
      </Pressable>

      {error ? (
        <View accessibilityRole="alert" className="mt-4 flex-row items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3">
          <Icon as={TriangleAlert} className="mt-0.5 size-4 text-destructive" />
          <Text className="min-w-0 flex-1 text-sm leading-5 text-foreground">{error}</Text>
        </View>
      ) : null}

      {duplicate ? (
        <View accessibilityRole="alert" className="mt-4 gap-3 rounded-2xl border border-primary/30 bg-primary/10 px-4 py-3">
          <View className="flex-row items-start gap-3">
            <Icon as={Info} className="mt-0.5 size-4 text-primary-hi" />
            <Text className="min-w-0 flex-1 text-sm leading-5 text-foreground">
              Cette musique est déjà importée dans « {duplicate.title} ».
            </Text>
          </View>
          {onOpenExisting ? (
            <Button variant="outline" onPress={() => onOpenExisting(duplicate.id)} className="h-11 rounded-xl bg-card">
              <Text>Ouvrir le projet</Text>
            </Button>
          ) : null}
        </View>
      ) : null}
    </Sheet>
  );
}
