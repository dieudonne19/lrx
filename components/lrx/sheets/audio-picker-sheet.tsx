import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { getAudioFileError, pickAudioFile, saveAudioFile } from '@/lib/audio-files';
import { TriangleAlert, Upload } from 'lucide-react-native';
import * as React from 'react';
import { Pressable, View } from 'react-native';
import { Sheet, SheetHeader } from './sheet';

export type PickedAudio = { name: string; uri: string };

export function AudioPickerSheet({
  title = 'Importer un audio',
  onClose,
  onPicked,
}: {
  title?: string;
  onClose: () => void;
  onPicked: (audio: PickedAudio) => void;
}) {
  const [picking, setPicking] = React.useState(false);
  // Synchronous guard: `picking` is only updated after a render, so a double tap could open two pickers.
  const busyRef = React.useRef(false);
  const [error, setError] = React.useState<string | null>(null);

  async function pickAudio() {
    if (busyRef.current) return;
    busyRef.current = true;
    setPicking(true);
    setError(null);
    try {
      const file = await pickAudioFile();
      if (!file) return;

      const problem = getAudioFileError({ name: file.name, size: file.size });
      if (problem) {
        setError(problem);
        return;
      }

      onPicked({ name: file.name, uri: await saveAudioFile(file) });
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
    </Sheet>
  );
}
