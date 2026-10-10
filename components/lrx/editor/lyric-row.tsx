import { resolveFontFamily } from '@/lib/fonts';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { formatTime } from '@/lib/lrx-editor-utils';
import type { LyricLineData } from '@/lib/lrx-ui-types';
import { SlidersHorizontal } from 'lucide-react-native';
import * as React from 'react';
import { LayoutChangeEvent, Pressable, TextInput, View } from 'react-native';

// Active line treatment from the mockup (highlight style "glow").
const GLOW = { textShadowColor: 'rgba(124, 92, 255, 0.45)', textShadowRadius: 24, textShadowOffset: { width: 0, height: 0 } };

export function LyricRow({
  line,
  index,
  active,
  past,
  onPress,
  editing,
  onFineTune,
  onEdit,
  onCommitEdit,
  onLayout,
}: {
  line: LyricLineData;
  index: number;
  active: boolean;
  past: boolean;
  onPress: () => void;
  editing: boolean;
  onFineTune: () => void;
  onEdit: () => void;
  onCommitEdit: (text: string) => void;
  onLayout?: (event: LayoutChangeEvent) => void;
}) {
  const instrumental = !line.text;
  const [draft, setDraft] = React.useState(line.text);

  React.useEffect(() => {
    if (editing) setDraft(line.text);
  }, [editing, line.text]);
  const textClass = active
    ? 'text-[22px] font-semibold leading-[26px] text-foreground'
    : past
      ? 'text-base leading-[21px] text-muted-foreground'
      : 'text-base leading-[21px] text-subtle';
  const timestamp = line.t == null ? (active ? '....' : '') : formatTime(line.t);

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onEdit}
      onLayout={onLayout}
      className="flex-row items-baseline gap-3 px-[22px] py-3.5">
      <Text
        className={`w-14 text-right font-mono text-[11px] font-medium ${
          active ? 'text-primary-hi' : past ? 'text-muted-foreground' : 'text-subtle'
        }`}>
        {timestamp}
      </Text>
      {instrumental ? (
        <View className="flex-row items-center gap-1.5">
          <View className="size-1 rounded-full bg-faint" />
          <View className="size-1 rounded-full bg-faint" />
          <View className="size-1 rounded-full bg-faint" />
          <Text className="ml-2 text-[11px] uppercase italic tracking-[1.3px] text-subtle">Instrumental</Text>
        </View>
      ) : (
        <View className="min-w-0 flex-1 flex-row items-center gap-2">
          {editing ? (
            <TextInput
              autoFocus
              value={draft}
              onChangeText={setDraft}
              onSubmitEditing={() => onCommitEdit(draft)}
              onBlur={() => onCommitEdit(draft)}
              returnKeyType="done"
              blurOnSubmit
              style={{ fontFamily: resolveFontFamily(textClass) }}
              className={`min-w-0 flex-1 rounded-lg border border-primary/40 bg-card px-2 py-1 ${textClass}`}
            />
          ) : (
            <Text style={active ? GLOW : undefined} className={`min-w-0 flex-1 ${textClass}`}>
              {line.text}
            </Text>
          )}
          {active && !editing ? (
            <Pressable
              onPress={(event) => {
                event.stopPropagation();
                onFineTune();
              }}
              className="size-9 items-center justify-center rounded-full border border-primary/25 bg-primary/10">
              <Icon as={SlidersHorizontal} className="size-4 text-primary" />
            </Pressable>
          ) : null}
        </View>
      )}
    </Pressable>
  );
}
