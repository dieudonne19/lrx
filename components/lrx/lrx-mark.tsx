import { View } from 'react-native';
import Svg, { Line } from 'react-native-svg';

export function LrxMark() {
  return (
    <View className="size-8 items-center justify-center overflow-hidden rounded-[9px] bg-primary">
      <Svg width={18} height={18} viewBox="0 0 18 18">
        <Line x1={3} x2={3} y1={4} y2={14} stroke="#FFFFFF" strokeWidth={2} strokeLinecap="round" />
        <Line x1={7} x2={7} y1={8} y2={14} stroke="#FFFFFF" strokeWidth={2} strokeLinecap="round" />
        <Line x1={11} x2={11} y1={3} y2={15} stroke="#FFFFFF" strokeWidth={2} strokeLinecap="round" />
        <Line x1={15} x2={15} y1={7} y2={13} stroke="#FFFFFF" strokeWidth={2} strokeLinecap="round" />
      </Svg>
    </View>
  );
}
