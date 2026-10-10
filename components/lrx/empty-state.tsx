import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react-native';
import { Plus } from 'lucide-react-native';
import { View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import { useCSSVariable } from 'uniwind';

type EmptyStateProps = React.ComponentProps<typeof View> & {
  // Mockup illustrations; use `icon` for contexts the mockup does not cover.
  illustration?: 'projects' | 'lyrics';
  icon?: LucideIcon;
  title: string;
  body: string;
  cta?: string;
  onCta?: () => void;
  secondaryCta?: string;
  onSecondaryCta?: () => void;
  variant?: 'default' | 'compact';
};

function Illustration({ kind, size }: { kind: 'projects' | 'lyrics'; size: number }) {
  const subtle = useCSSVariable('--color-subtle');
  const primary = useCSSVariable('--color-primary');
  const muted = typeof subtle === 'string' ? subtle : '#5C6068';
  const accent = typeof primary === 'string' ? primary : '#7C5CFF';

  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      {kind === 'projects' ? (
        <>
          {[10, 18, 26].map((y, index) => (
            <Rect key={y} x={10} y={y} width={28 - index * 4} height={3} rx={1.5} fill={muted} />
          ))}
          <Rect x={10} y={34} width={14} height={3} rx={1.5} fill={accent} />
        </>
      ) : (
        <Path d="M12 14h24M12 22h18M12 30h22M12 38h12" stroke={muted} strokeWidth={2} strokeLinecap="round" />
      )}
    </Svg>
  );
}

function EmptyState({
  className,
  illustration,
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
    <View
      className={cn('items-center gap-[18px] px-[30px]', compact ? 'py-8' : 'py-[60px]', className)}
      {...props}>
      <View
        className={cn(
          'items-center justify-center border border-border bg-card',
          compact ? 'size-16 rounded-2xl' : 'size-24 rounded-3xl'
        )}>
        {illustration ? (
          <Illustration kind={illustration} size={compact ? 32 : 48} />
        ) : icon ? (
          <Icon as={icon} className={cn('text-subtle', compact ? 'size-8' : 'size-12')} />
        ) : null}
      </View>
      <View className="items-center gap-2">
        <Text
          className={cn(
            'text-center font-semibold',
            compact ? 'text-lg leading-6' : 'text-2xl leading-7 tracking-[-0.48px]'
          )}>
          {title}
        </Text>
        <Text className="max-w-[260px] text-center text-sm leading-5 text-muted-foreground">{body}</Text>
      </View>
      {cta || secondaryCta ? (
        <View className={cn('gap-2', compact ? 'w-full' : 'items-center')}>
          {cta ? (
            <Button className={cn('h-12 rounded-[10px] px-5', compact ? 'w-full' : '')} onPress={onCta}>
              <Icon as={Plus} className="size-4 text-primary-foreground" />
              <Text>{cta}</Text>
            </Button>
          ) : null}
          {secondaryCta ? (
            <Button
              variant="outline"
              className={cn('h-12 rounded-[10px] bg-card px-5', compact ? 'w-full' : '')}
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
