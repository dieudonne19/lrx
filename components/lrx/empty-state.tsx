import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react-native';
import { Plus } from 'lucide-react-native';
import { View } from 'react-native';

type EmptyStateProps = React.ComponentProps<typeof View> & {
  icon: LucideIcon;
  title: string;
  body: string;
  cta?: string;
  onCta?: () => void;
};

function EmptyState({ className, icon, title, body, cta, onCta, ...props }: EmptyStateProps) {
  return (
    <View className={cn('items-center gap-5 px-8 py-16', className)} {...props}>
      <View className="border-border bg-card size-24 items-center justify-center rounded-3xl border">
        <Icon as={icon} className="text-muted-foreground size-12" />
      </View>
      <View className="items-center gap-2">
        <Text className="text-center text-2xl font-semibold leading-7">{title}</Text>
        <Text className="text-muted-foreground max-w-72 text-center text-sm leading-5">{body}</Text>
      </View>
      {cta ? (
        <Button className="h-12 rounded-xl px-5" onPress={onCta}>
          <Icon as={Plus} className="size-4" />
          <Text>{cta}</Text>
        </Button>
      ) : null}
    </View>
  );
}

export { EmptyState };
