import { resolveFontFamily } from '@/lib/fonts';
import { EmptyState } from '@/components/lrx';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { cleanLyrics, splitLyrics } from '@/lib/lrx-editor-utils';
import { FileText, ListChecks, Plus, Sparkles } from 'lucide-react-native';
import * as React from 'react';
import { TextInput, View } from 'react-native';
import { Sheet, SheetHeader } from './sheet';

export function ImportLyricsSheet({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (lines: string[]) => void;
}) {
  const [rawText, setRawText] = React.useState('');
  const cleanedText = React.useMemo(() => cleanLyrics(rawText), [rawText]);
  const lines = React.useMemo(() => splitLyrics(cleanedText), [cleanedText]);
  const preview = lines.slice(0, 5);

  function applyCleanup() {
    setRawText(cleanedText);
  }

  return (
    <Sheet onClose={onClose}>
      <SheetHeader title="Importer lyrics" subtitle="Colle les paroles brutes, LRX cree une ligne par phrase." onClose={onClose} />

      <View className="rounded-2xl border border-border bg-card p-3">
        <TextInput
          value={rawText}
          onChangeText={setRawText}
          multiline
          textAlignVertical="top"
          placeholder="Colle tes paroles ici..."
          placeholderTextColor="#5C6068"
          style={{ fontFamily: resolveFontFamily() }}
          className="min-h-[160px] text-base leading-6 text-foreground"
        />
      </View>

      <View className="mt-3 flex-row gap-2">
        <Button variant="outline" onPress={applyCleanup} className="h-11 flex-1 rounded-xl bg-card">
          <Icon as={Sparkles} className="size-4 text-foreground" />
          <Text>Nettoyer</Text>
        </Button>
        <View className="h-11 flex-1 flex-row items-center justify-center gap-2 rounded-xl border border-border bg-card">
          <Icon as={ListChecks} className="size-4 text-muted-foreground" />
          <Text className="text-sm text-muted-foreground">{lines.length} lignes</Text>
        </View>
      </View>

      <View className="mt-5">
        <Text className="mb-2 text-xs font-semibold uppercase tracking-[1.8px] text-muted-foreground">Preview</Text>
        {preview.length ? (
          <View className="gap-2">
            {preview.map((line, index) => (
              <View key={`${line}-${index}`} className="flex-row items-center gap-3">
                <Text className="w-6 font-mono text-[11px] text-muted-foreground">{index + 1}</Text>
                <Text numberOfLines={1} className="flex-1 text-sm text-foreground">
                  {line}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <EmptyState
            variant="compact"
            icon={FileText}
            title="Aucune ligne detectee"
            body="Colle des paroles avec une phrase par ligne, puis nettoie si necessaire."
            className="rounded-2xl border border-border bg-card"
          />
        )}
      </View>

      <Button
        size="lg"
        disabled={!lines.length}
        onPress={() => onCreate(lines)}
        className="mt-6 h-14 rounded-2xl">
        <Icon as={Plus} className="size-5 text-primary-foreground" />
        <Text>Creer les lignes</Text>
      </Button>
    </Sheet>
  );
}
