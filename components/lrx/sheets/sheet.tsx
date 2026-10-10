import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react-native';
import type * as React from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';

// Bottom sheet frame from the mockup (.sheet): elevated background, 20px top corners, top border,
// 36x4 handle and a 60% scrim. Content scrolls when it is taller than 92% of the screen.
function Sheet({
  children,
  onClose,
  className,
}: {
  children: React.ReactNode;
  onClose: () => void;
  className?: string;
}) {
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="absolute inset-0 z-50 justify-end bg-black/60">
      <Pressable accessibilityLabel="Fermer" className="absolute inset-0" onPress={onClose} />
      <View
        style={{ shadowColor: '#000000', shadowOpacity: 0.5, shadowRadius: 30, shadowOffset: { width: 0, height: -20 }, elevation: 24 }}
        className="max-h-[92%] rounded-t-[20px] border-t border-border bg-popover">
        <View className="mb-1 mt-2.5 h-1 w-9 self-center rounded-full bg-input" />
        <ScrollView
          className="shrink"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerClassName={cn('px-5 pb-6 pt-2', className)}>
          {children}
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

function SheetHeader({ title, subtitle, onClose }: { title: string; subtitle?: string; onClose: () => void }) {
  return (
    <View className="mb-4 flex-row items-start justify-between gap-3">
      <View className="min-w-0 flex-1 pt-1">
        <Text className="text-xl font-semibold leading-6 tracking-[-0.3px] text-foreground">{title}</Text>
        {subtitle ? <Text className="mt-1 text-xs leading-4 text-muted-foreground">{subtitle}</Text> : null}
      </View>
      <Button variant="ghost" size="icon" accessibilityLabel="Fermer" onPress={onClose} className="size-12 rounded-full">
        <Icon as={X} className="size-5 text-foreground" />
      </Button>
    </View>
  );
}

export { Sheet, SheetHeader };
