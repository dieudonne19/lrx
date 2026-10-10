import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import type { LucideIcon } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

export type MoreSheetItem = {
  icon: LucideIcon;
  label: string;
  sub?: string;
  danger?: boolean;
  onPress: () => void;
};

export function MoreSheet({ title, items, onClose }: { title?: string; items: MoreSheetItem[]; onClose: () => void }) {
  return (
    <View className="absolute inset-0 z-50 justify-end bg-black/60">
      <Pressable className="absolute inset-0" onPress={onClose} accessibilityLabel="Fermer" />
      <View className="rounded-t-[28px] border border-border bg-background px-3 pb-6 pt-3">
        <View className="mb-3 items-center">
          <View className="h-1.5 w-12 rounded-full bg-input" />
        </View>
        {title ? (
          <Text numberOfLines={1} className="px-3 pb-2 text-sm text-muted-foreground">
            {title}
          </Text>
        ) : null}
        {items.map((item) => (
          <Pressable
            key={item.label}
            accessibilityRole="button"
            onPress={() => {
              onClose();
              item.onPress();
            }}
            className="min-h-14 flex-row items-center gap-3.5 rounded-xl px-3 py-2.5 active:bg-card">
            <View className="size-9 items-center justify-center rounded-[10px] border border-border bg-card">
              <Icon as={item.icon} className={`size-[18px] ${item.danger ? 'text-destructive' : 'text-primary'}`} />
            </View>
            <View className="min-w-0 flex-1">
              <Text className={`text-[15px] font-medium ${item.danger ? 'text-destructive' : 'text-foreground'}`}>
                {item.label}
              </Text>
              {item.sub ? <Text className="mt-0.5 text-xs text-muted-foreground">{item.sub}</Text> : null}
            </View>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
