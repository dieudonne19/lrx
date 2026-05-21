import { cn } from '@/lib/utils';
import { Check } from 'lucide-react-native';
import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Icon } from '@/components/ui/icon';

type ProjectCoverProps = React.ComponentProps<typeof View> & {
  colors?: [string, string];
  size?: number;
  index?: number;
  status?: 'done' | 'draft' | 'in-progress';
};

function ProjectCover({
  className,
  colors = ['#7C5CFF', '#3B2BFF'],
  size = 48,
  index = 0,
  status,
  ...props
}: ProjectCoverProps) {
  const radius = Math.round(size * 0.22);

  return (
    <View
      className={cn('shrink-0 overflow-hidden', className)}
      style={{ width: size, height: size, borderRadius: radius, backgroundColor: colors[0] }}
      {...props}>
      <View
        className="absolute inset-0"
        style={{
          backgroundColor: colors[1],
          opacity: 0.72,
          transform: [{ rotate: '35deg' }, { scale: 1.7 }],
        }}
      />
      <Svg width={size} height={size} viewBox="0 0 48 48" style={{ position: 'absolute' }}>
        {[0, 1, 2, 3, 4, 5].map((line) => (
          <Path
            key={line}
            d={`M -6 ${10 + line * 7} Q 12 ${4 + line * 7 + (index % 3) * 2} 24 ${
              10 + line * 7
            } T 60 ${10 + line * 7}`}
            fill="none"
            stroke="rgba(255,255,255,0.42)"
            strokeWidth="0.8"
          />
        ))}
      </Svg>
      {status === 'draft' ? (
        <View className="absolute inset-0 bg-background/35" />
      ) : null}
      {status === 'done' ? (
        <View className="absolute bottom-1 right-1 size-4 items-center justify-center rounded-full bg-chart-2">
          <Icon as={Check} className="size-3 text-background" strokeWidth={3} />
        </View>
      ) : null}
    </View>
  );
}

export { ProjectCover };
