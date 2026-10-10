import { Text } from '@/components/ui/text';
import { LinearGradient } from 'expo-linear-gradient';
import * as React from 'react';
import { Pressable, View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';

// The press animations run on the UI thread, so they stay smooth even if the JS thread is busy.
export function TapTimeButton({
  onTap,
  disabled,
  playing,
}: {
  onTap: () => void;
  disabled: boolean;
  playing: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const press = useSharedValue(0);
  const ring = useSharedValue(1);
  const touchHandledRef = React.useRef(false);

  function tap() {
    // Call first: the handler reads the playback position and must not wait for the animation setup.
    onTap();
    if (reduceMotion) return;
    ring.value = 0;
    ring.value = withTiming(1, { duration: 550 });
  }

  const buttonStyle = useAnimatedStyle(() => ({ transform: [{ scale: 1 - press.value * 0.03 }] }));
  const ringStyle = useAnimatedStyle(() => ({
    opacity: (1 - ring.value) * 0.7,
    transform: [{ scale: 1 + ring.value * 0.12 }],
  }));

  return (
    <Animated.View style={buttonStyle} className={`h-16 flex-1 ${disabled ? 'opacity-40' : ''}`}>
      <Pressable
        accessibilityLabel="Tap time"
        disabled={disabled}
        // Fire on touch down: onPress waits for the finger to lift, adding the press duration to the delay.
        onPressIn={() => {
          touchHandledRef.current = true;
          if (!reduceMotion) press.value = withTiming(1, { duration: 80 });
          tap();
        }}
        onPressOut={() => {
          if (!reduceMotion) press.value = withTiming(0, { duration: 140 });
        }}
        // Screen readers activate with onPress only, so keep it as the non-touch path.
        onPress={() => {
          if (touchHandledRef.current) touchHandledRef.current = false;
          else tap();
        }}
        style={{ shadowColor: '#7C5CFF', shadowOpacity: 0.45, shadowRadius: 20, shadowOffset: { width: 0, height: 14 }, elevation: 10 }}
        className="h-16 rounded-[18px]">
        <Animated.View pointerEvents="none" style={ringStyle} className="absolute inset-0 rounded-[18px] border-2 border-primary-hi" />
        <View className="h-16 flex-row items-center justify-center gap-3 overflow-hidden rounded-[18px] px-[18px]">
          <LinearGradient colors={['#9A82FF', '#7C5CFF']} style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }} />
          <View
            style={{ shadowColor: '#FFFFFF', shadowOpacity: 0.8, shadowRadius: 6, shadowOffset: { width: 0, height: 0 } }}
            className={`size-2 rounded-full bg-white ${playing ? 'opacity-100' : 'opacity-60'}`}
          />
          <Text className="text-[15px] font-bold uppercase tracking-[3.3px] text-white">Tap Time</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}
