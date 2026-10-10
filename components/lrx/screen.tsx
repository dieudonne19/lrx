import { cn } from '@/lib/utils';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { withUniwind } from 'uniwind';

// react-native-safe-area-context is a third-party component, so Uniwind only maps className through this wrapper.
const StyledSafeAreaView = withUniwind(SafeAreaView);

type ScreenProps = React.ComponentProps<typeof StyledSafeAreaView> & {
  padded?: boolean;
};

function Screen({ className, padded = false, ...props }: ScreenProps) {
  return (
    <StyledSafeAreaView
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
