import { IconButton } from '@/components/lrx/icon-button';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { ArrowLeft } from 'lucide-react-native';
import { View } from 'react-native';

type TopBarProps = React.ComponentProps<typeof View> & {
  title?: string;
  subtitle?: string;
  onBack?: () => void;
  left?: React.ReactNode;
  right?: React.ReactNode;
};

function TopBar({ className, title, subtitle, onBack, left, right, ...props }: TopBarProps) {
  return (
    <View
      className={cn('min-h-14 flex-row items-center justify-between px-4 py-2', className)}
      {...props}>
      <View className="w-10 items-start">
        {left ?? (onBack ? <IconButton icon={ArrowLeft} onPress={onBack} /> : null)}
      </View>
      <View className="mx-3 flex-1 items-center">
        {title ? (
          <Text className="text-center text-[15px] font-semibold leading-5" numberOfLines={1}>
            {title}
          </Text>
        ) : null}
        {subtitle ? (
          <Text className="text-muted-foreground text-center font-mono text-[11px]" numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      <View className="w-10 items-end">{right}</View>
    </View>
  );
}

export { TopBar };
