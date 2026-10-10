import { EmptyState } from '@/components/lrx';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { buildLrcFile, toFileName } from '@/lib/lrx-editor-utils';
import type { LyricLineData, Project } from '@/lib/lrx-ui-types';
import * as Clipboard from 'expo-clipboard';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Check, Copy, Download, FileText, Share2, ShieldAlert, X } from 'lucide-react-native';
import * as React from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';

export function ExportSheet({
  project,
  lyrics,
  confirmUnsynced = false,
  onClose,
}: {
  project: Project;
  lyrics: LyricLineData[];
  confirmUnsynced?: boolean;
  onClose: () => void;
}) {
  const [copied, setCopied] = React.useState(false);
  const [shareStatus, setShareStatus] = React.useState<'idle' | 'sharing' | 'done' | 'unavailable' | 'error'>('idle');
  const lrcText = React.useMemo(() => buildLrcFile(project, lyrics), [project, lyrics]);
  const synced = lyrics.filter((line) => line.text && line.t != null).length;
  const total = lyrics.filter((line) => line.text).length;
  const hasLyrics = total > 0;
  const hasUnsyncedLyrics = hasLyrics && synced < total;

  function confirmIfUnsynced(onConfirm: () => void) {
    if (!confirmUnsynced || !hasUnsyncedLyrics) {
      onConfirm();
      return;
    }
    const missing = total - synced;
    Alert.alert(
      'Export incomplet',
      `${missing} ligne${missing > 1 ? 's' : ''} sans timestamp seront marquees --:--.--. Exporter quand meme ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Exporter', onPress: onConfirm },
      ]
    );
  }

  async function copyToClipboard() {
    if (!hasLyrics) return;
    await Clipboard.setStringAsync(lrcText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  async function shareFile() {
    if (!hasLyrics) return;
    setShareStatus('sharing');

    try {
      const available = await Sharing.isAvailableAsync();
      if (!available) {
        setShareStatus('unavailable');
        return;
      }

      const fileName = `${toFileName(project.title)}.lrc`;
      const file = new File(Paths.cache, fileName);
      file.create({ overwrite: true });
      file.write(lrcText);

      await Sharing.shareAsync(file.uri, {
        mimeType: 'text/plain',
        UTI: 'public.plain-text',
        dialogTitle: `Partager ${fileName}`,
      });
      setShareStatus('done');
    } catch {
      setShareStatus('error');
    }
  }

  return (
    <View className="absolute inset-0 z-50 justify-end bg-black/60">
      <Pressable className="absolute inset-0" onPress={onClose} />
      <View className="max-h-[88%] rounded-t-[28px] border border-border bg-background px-5 pb-6 pt-3">
        <View className="mb-5 items-center">
          <View className="h-1.5 w-12 rounded-full bg-input" />
        </View>

        <View className="mb-5 flex-row items-start justify-between gap-4">
          <View className="flex-1">
            <Text className="text-2xl font-semibold text-foreground">Export .lrc</Text>
            <Text className="mt-1 text-sm leading-5 text-muted-foreground">
              Preview final avec metadonnees et timestamps synchronises.
            </Text>
          </View>
          <Button variant="ghost" size="icon" onPress={onClose} className="rounded-full">
            <Icon as={X} className="size-5 text-foreground" />
          </Button>
        </View>

        {hasUnsyncedLyrics ? (
          <View className="mb-4 flex-row items-center gap-3 rounded-2xl border border-primary/25 bg-primary/10 px-4 py-3">
            <View className="size-10 items-center justify-center rounded-xl bg-primary/20">
              <Icon as={ShieldAlert} className="size-5 text-primary" />
            </View>
            <View className="min-w-0 flex-1">
              <Text className="text-sm font-semibold text-foreground">Export incomplet</Text>
              <Text className="mt-0.5 text-xs leading-4 text-muted-foreground">
                {total - synced} ligne{total - synced > 1 ? 's' : ''} sans timestamp seront marquees --:--.--.
              </Text>
            </View>
          </View>
        ) : null}

        <View className="mb-4 flex-row gap-2">
          <View className="flex-1 rounded-2xl border border-border bg-card px-4 py-3">
            <Text className="font-mono text-xl font-semibold text-foreground">
              {synced}/{total}
            </Text>
            <Text className="mt-1 text-xs text-muted-foreground">lignes timees</Text>
          </View>
          <View className="flex-1 rounded-2xl border border-border bg-card px-4 py-3">
            <Text className="font-mono text-xl font-semibold text-foreground">{lrcText.split('\n').length}</Text>
            <Text className="mt-1 text-xs text-muted-foreground">lignes export</Text>
          </View>
        </View>

        <View className="rounded-2xl border border-border bg-card">
          <View className="flex-row items-center justify-between border-b border-border px-4 py-3">
            <View className="flex-row items-center gap-2">
              <Icon as={FileText} className="size-4 text-primary" />
              <Text className="text-xs font-semibold uppercase tracking-[1.8px] text-primary">Preview</Text>
            </View>
            <Text className="font-mono text-[11px] text-muted-foreground">{toFileName(project.title)}.lrc</Text>
          </View>
          {hasLyrics ? (
            <ScrollView className="h-[310px]" contentContainerClassName="px-4 py-3">
              <Text selectable className="font-mono text-xs leading-5 text-foreground">
                {lrcText}
              </Text>
            </ScrollView>
          ) : (
            <EmptyState
              variant="compact"
              icon={FileText}
              title="Aucune lyric a exporter"
              body="Ajoute ou importe des paroles avant de generer un fichier .lrc."
              className="h-[310px] justify-center"
            />
          )}
        </View>

        <View className="mt-4 flex-row gap-2">
          <Button
            variant="outline"
            onPress={() => confirmIfUnsynced(copyToClipboard)}
            disabled={!hasLyrics}
            className="h-14 flex-1 rounded-2xl bg-card">
            <Icon as={copied ? Check : Copy} className="size-5 text-foreground" />
            <Text>{copied ? 'Copie' : 'Copier'}</Text>
          </Button>
          <Button onPress={() => confirmIfUnsynced(shareFile)} disabled={!hasLyrics || shareStatus === 'sharing'} className="h-14 flex-1 rounded-2xl">
            <Icon as={shareStatus === 'done' ? Check : Share2} className="size-5 text-primary-foreground" />
            <Text>{shareStatus === 'sharing' ? 'Partage...' : 'Partager'}</Text>
          </Button>
        </View>

        <View className="mt-3 flex-row items-center justify-center gap-2">
          <Icon as={Download} className="size-4 text-muted-foreground" />
          <Text className="text-center text-xs text-muted-foreground">
            {shareStatus === 'unavailable'
              ? 'Partage indisponible sur cette plateforme.'
              : shareStatus === 'error'
                ? 'Impossible de creer le fichier pour le moment.'
                : 'Le fichier est genere localement au moment du partage.'}
          </Text>
        </View>
      </View>
    </View>
  );
}
