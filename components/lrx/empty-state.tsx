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
  secondaryCta?: string;
  onSecondaryCta?: () => void;
  variant?: 'default' | 'compact';
};

function EmptyState({
  className,
  icon,
  title,
  body,
  cta,
  onCta,
  secondaryCta,
  onSecondaryCta,
  variant = 'default',
  ...props
}: EmptyStateProps) {
  const compact = variant === 'compact';

  return (
    <View className={cn('items-center gap-5 px-8', compact ? 'py-8' : 'py-16', className)} {...props}>
      <View
        className={cn(
          'items-center justify-center rounded-3xl border border-border bg-card',
          compact ? 'size-16 rounded-2xl' : 'size-24'
        )}>
        <Icon as={icon} className={cn('text-muted-foreground', compact ? 'size-8' : 'size-12')} />
      </View>
      <View className="items-center gap-2">
        <Text className={cn('text-center font-semibold', compact ? 'text-lg leading-6' : 'text-2xl leading-7')}>
          {title}
        </Text>
        <Text className="text-muted-foreground max-w-72 text-center text-sm leading-5">{body}</Text>
      </View>
      {cta || secondaryCta ? (
        <View className={cn('gap-2', compact ? 'w-full' : 'items-center')}>
          {cta ? (
            <Button className={cn('h-12 rounded-xl px-5', compact ? 'w-full' : '')} onPress={onCta}>
              <Icon as={Plus} className="size-4" />
              <Text>{cta}</Text>
            </Button>
          ) : null}
          {secondaryCta ? (
            <Button
              variant="outline"
              className={cn('h-12 rounded-xl bg-card px-5', compact ? 'w-full' : '')}
              onPress={onSecondaryCta}>
              <Text>{secondaryCta}</Text>
            </Button>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

export { EmptyState };
