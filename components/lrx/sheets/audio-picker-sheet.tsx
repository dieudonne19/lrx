import { EmptyState } from '@/components/lrx';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import * as DocumentPicker from 'expo-document-picker';
import { ChevronRight, FolderOpen, Upload, X } from 'lucide-react-native';
import * as React from 'react';
import { Pressable, View } from 'react-native';

const RECENT_AUDIO = [
  { name: 'neons_final_mix.wav', size: '42.8 MB', duration: '03:42' },
  { name: 'voice_memo_hook.m4a', size: '8.1 MB', duration: '01:41' },
  { name: 'after_hours_demo.mp3', size: '6.6 MB', duration: '02:58' },
];

export function AudioPickerSheet({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (audioName: string, duration?: string) => void;
}) {
  const [picking, setPicking] = React.useState(false);

  async function pickAudio() {
    setPicking(true);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (!result.canceled) {
        const asset = result.assets[0];
        onCreate(asset.name || 'audio-import');
      }
    } finally {
      setPicking(false);
    }
  }

  return (
    <View className="absolute inset-0 z-50 justify-end bg-black/60">
      <Pressable className="absolute inset-0" onPress={onClose} />
      <View className="rounded-t-[28px] border border-border bg-background px-5 pb-6 pt-3">
        <View className="mb-5 items-center">
          <View className="h-1.5 w-12 rounded-full bg-input" />
        </View>

        <View className="mb-5 flex-row items-start justify-between gap-4">
          <View className="flex-1">
            <Text className="text-2xl font-semibold text-foreground">Importer audio</Text>
            <Text className="mt-1 text-sm leading-5 text-muted-foreground">
              Choisis un fichier audio pour creer une session LRC.
            </Text>
          </View>
          <Button variant="ghost" size="icon" onPress={onClose} className="rounded-full">
            <Icon as={X} className="size-5 text-foreground" />
          </Button>
        </View>

        <Pressable
          onPress={pickAudio}
          className="items-center justify-center rounded-3xl border border-dashed border-primary/60 bg-primary/10 px-5 py-8">
          <View className="mb-4 size-14 items-center justify-center rounded-2xl bg-primary">
            <Icon as={Upload} className="size-7 text-primary-foreground" />
          </View>
          <Text className="text-base font-semibold text-foreground">
            {picking ? 'Ouverture...' : 'Choisir un fichier audio'}
          </Text>
          <Text className="mt-1 text-center text-sm leading-5 text-muted-foreground">
            MP3, WAV, M4A ou AAC. La lecture reelle sera branchee avec expo-av ensuite.
          </Text>
        </Pressable>

        <View className="mt-6">
          <Text className="mb-3 text-xs font-semibold uppercase tracking-[1.8px] text-muted-foreground">
            Recents
          </Text>
          {RECENT_AUDIO.length ? (
            <View className="gap-2">
              {RECENT_AUDIO.map((audio) => (
                <Pressable
                  key={audio.name}
                  onPress={() => onCreate(audio.name, audio.duration)}
                  className="flex-row items-center gap-3 rounded-2xl border border-border bg-card px-3 py-3">
                  <View className="size-11 items-center justify-center rounded-xl bg-input">
                    <Icon as={FolderOpen} className="size-5 text-muted-foreground" />
                  </View>
                  <View className="min-w-0 flex-1">
                    <Text numberOfLines={1} className="text-sm font-medium text-foreground">
                      {audio.name}
                    </Text>
                    <Text className="mt-0.5 text-xs text-muted-foreground">
                      {audio.size} - {audio.duration}
                    </Text>
                  </View>
                  <Icon as={ChevronRight} className="size-5 text-muted-foreground" />
                </Pressable>
              ))}
            </View>
          ) : (
            <EmptyState
              variant="compact"
              icon={FolderOpen}
              title="Aucun audio recent"
              body="Importe un fichier depuis ton appareil pour commencer une session."
              cta="Choisir audio"
              onCta={pickAudio}
              className="rounded-2xl border border-border bg-card"
            />
          )}
        </View>
      </View>
    </View>
  );
}
