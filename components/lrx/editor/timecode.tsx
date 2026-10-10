import { Text } from '@/components/ui/text';
import { formatTime } from '@/lib/lrx-editor-utils';
import type { AudioPlayer } from 'expo-audio';
import { View } from 'react-native';
import { usePlaybackTime } from './use-editor-audio';

// Subscribes to the playback position on its own so the rest of the editor does not re-render with it.
export function Timecode({ player, duration }: { player: AudioPlayer; duration: number }) {
  const time = usePlaybackTime(player);

  return (
    <View className="mb-2 flex-row items-end justify-between">
      <Text className="font-mono text-[22px] font-semibold leading-7 tracking-[-0.44px] text-foreground">
        {formatTime(time)}
      </Text>
      <Text className="font-mono text-xs text-subtle">{formatTime(duration)}</Text>
    </View>
  );
}
