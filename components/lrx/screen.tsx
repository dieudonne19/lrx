import { cn } from '@/lib/utils';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type ScreenProps = React.ComponentProps<typeof SafeAreaView> & {
  padded?: boolean;
};

function Screen({ className, padded = false, ...props }: ScreenProps) {
  return (
    <SafeAreaView
      className={cn('flex-1 bg-background', padded && 'px-5', className)}
      edges={['top', 'bottom']}
      {...props}
    />
  );
}

function ScreenBody({ className, ...props }: React.ComponentProps<typeof View>) {
  return <View className={cn('flex-1', className)} {...props} />;
}

export { Screen, ScreenBody };
