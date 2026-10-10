import { Screen, ScreenBody } from '@/components/lrx';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { cssColor, PRIMARY, PRIMARY_GRADIENT, PRIMARY_HI, primaryAlpha } from '@/lib/brand';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import * as React from 'react';
import { Pressable, View } from 'react-native';
import { useCSSVariable } from 'uniwind';
import Svg, { Circle, Defs, Line, LinearGradient as SvgGradient, Rect, Stop } from 'react-native-svg';

const SLIDES = [
  {
    eyebrow: 'LRX · 01',
    title: 'Synchronise tes paroles\navec ta musique.',
    body: 'Un éditeur .lrc taillé pour les studios, les karaokés et les créateurs. Rapide, tactile, précis.',
    art: 'wave',
  },
  {
    eyebrow: 'LRX · 02',
    title: 'Un seul geste.\nUn seul bouton.',
    body: 'Lis ta musique, tape sur TAP TIME au bon moment. La ligne active reçoit le timestamp, la suivante s’enchaîne automatiquement.',
    art: 'tap',
  },
  {
    eyebrow: 'LRX · 03',
    title: 'Export .lrc propre,\nprêt à partager.',
    body: 'Aperçu fichier, copie, partage, ou export direct. Métadonnées, lyrics, timestamps — tout sort en standard.',
    art: 'export',
  },
] as const;

const GLOW = { textShadowColor: primaryAlpha(0.5), textShadowRadius: 20, textShadowOffset: { width: 0, height: 0 } };

export function OnboardingScreen({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = React.useState(0);
  const slide = SLIDES[step];
  const isLast = step === SLIDES.length - 1;

  function goNext() {
    if (step >= SLIDES.length - 1) {
      onComplete();
      return;
    }

    setStep(step + 1);
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <Screen>
        <ScreenBody>
          <View className="flex-1 px-7 pt-6">
            <Progress step={step} onSelect={setStep} />
            <View className="min-h-[220px] flex-1 items-center justify-center">
              {slide.art === 'wave' ? <WaveArt /> : null}
              {slide.art === 'tap' ? <TapArt /> : null}
              {slide.art === 'export' ? <ExportArt /> : null}
            </View>

            <View>
              <Text className="text-[11px] font-semibold uppercase tracking-[1.32px] text-primary">
                {slide.eyebrow}
              </Text>
              <Text className="my-3.5 text-[32px] font-semibold leading-[34px] tracking-[-0.8px] text-foreground">
                {slide.title}
              </Text>
              <Text className="max-w-[320px] text-sm leading-[20px] text-muted-foreground">{slide.body}</Text>
            </View>
          </View>

          <View className="flex-row items-center gap-2.5 px-[22px] pb-6 pt-5">
            <Button variant="ghost" size="lg" onPress={onComplete} className="px-4">
              <Text className="text-muted-foreground">Passer</Text>
            </Button>
            <View className="flex-1" />
            <Pressable
              onPress={goNext}
              hitSlop={10}
              style={{ shadowColor: PRIMARY, shadowOpacity: 0.3, shadowRadius: 12, shadowOffset: { width: 0, height: 8 }, elevation: 6 }}
              className="h-12 min-w-[140px] rounded-[10px] active:opacity-90">
              <View className="h-12 flex-row items-center justify-center gap-2 overflow-hidden rounded-[10px] bg-primary px-5">
                <Text className="text-[15px] font-medium text-white">{isLast ? 'Commencer' : 'Continuer'}</Text>
                <Icon as={ChevronRight} className="size-[18px] text-white" />
              </View>
            </Pressable>
          </View>
        </ScreenBody>
      </Screen>
    </>
  );
}

function Progress({ step, onSelect }: { step: number; onSelect: (step: number) => void }) {
  return (
    <View className="mb-7 flex-row gap-1.5">
      {SLIDES.map((slide, index) => (
        <Pressable
          key={slide.eyebrow}
          accessibilityLabel={`Étape ${index + 1}`}
          hitSlop={8}
          onPress={() => onSelect(index)}
          className={`h-[3px] rounded-full ${index === step ? 'flex-[3] bg-primary' : 'flex-1 bg-input'}`}
        />
      ))}
    </View>
  );
}

function WaveArt() {
  const [unplayedToken, playheadToken] = useCSSVariable(['--color-input', '--color-foreground']);
  const played = cssColor(unplayedToken, '#22252C');
  const playhead = cssColor(playheadToken, '#F2F3F6');
  const bars = Array.from({ length: 28 }, (_, index) => {
    const height = 30 + Math.abs(Math.sin(index * 0.5) * Math.cos(index * 0.3)) * 110;
    return { x: 6 + index * 9, y: 100 - height / 2, height };
  });

  return (
    <Svg width={260} height={200} viewBox="0 0 260 200">
      <Defs>
        <SvgGradient id="waveFill" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor={played} />
          <Stop offset="0.45" stopColor={played} />
          <Stop offset="0.45" stopColor={PRIMARY} />
          <Stop offset="1" stopColor={PRIMARY_HI} />
        </SvgGradient>
      </Defs>
      {bars.map((bar) => (
        <Rect key={bar.x} x={bar.x} y={bar.y} width={5} height={bar.height} rx={2.5} fill="url(#waveFill)" />
      ))}
      <Line x1={120} x2={120} y1={20} y2={180} stroke={playhead} strokeWidth={1} opacity={0.7} />
      <Circle cx={120} cy={20} r={4} fill={playhead} />
    </Svg>
  );
}

function TapArt() {
  return (
    <View className="h-[220px] w-[260px]">
      <View className="absolute left-0 right-0 top-0 rounded-[14px] border border-border bg-card px-[18px] py-3.5">
        <Text className="text-[13px] leading-[19px] text-muted-foreground">Sous les néons</Text>
        <Text className="text-[13px] leading-[19px] text-muted-foreground">Je cherche encore</Text>
        <Text style={GLOW} className="text-[17px] font-semibold leading-6 text-foreground">
          Les rues parlent en silence
        </Text>
        <Text className="text-[13px] leading-[19px] text-subtle">La nuit garde sa cadence</Text>
      </View>

      <View className="absolute bottom-[-10px] h-[76px] w-[240px] self-center rounded-[18px] border-[1.5px] border-primary opacity-50" />
      <View
        style={{ shadowColor: PRIMARY, shadowOpacity: 0.5, shadowRadius: 20, shadowOffset: { width: 0, height: 16 }, elevation: 10 }}
        className="absolute bottom-0 h-14 w-[200px] self-center rounded-2xl">
        <View className="h-14 items-center justify-center overflow-hidden rounded-2xl">
          <LinearGradient colors={PRIMARY_GRADIENT} style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }} />
          <Text className="text-[13px] font-semibold uppercase tracking-[2.3px] text-white">Tap Time</Text>
        </View>
      </View>
    </View>
  );
}

function ExportArt() {
  return (
    <View className="w-[280px] rounded-[14px] border border-border bg-card px-[18px] pb-[22px] pt-[18px]">
      <View className="mb-3 flex-row items-center gap-1.5">
        <View className="size-[9px] rounded-full bg-faint" />
        <View className="size-[9px] rounded-full bg-faint" />
        <View className="size-[9px] rounded-full bg-primary" />
        <Text className="ml-auto text-[10px] text-subtle">track.lrc</Text>
      </View>
      <CodeLine muted="[ti:" text="Néons" end="]" />
      <CodeLine muted="[ar:" text="Camille Roux" end="]" />
      <View className="h-2" />
      <CodeLine muted="[00:12.40]" text=" Sous les néons" accent />
      <CodeLine muted="[00:16.10]" text=" Je cherche encore" accent />
      <CodeLine muted="[00:20.05]" text=" Les rues parlent…" accent />
    </View>
  );
}

function CodeLine({
  muted,
  text,
  end,
  accent,
}: {
  muted: string;
  text: string;
  end?: string;
  accent?: boolean;
}) {
  return (
    <View className="flex-row">
      <Text className={`font-mono text-xs leading-[18px] ${accent ? 'text-primary' : 'text-subtle'}`}>{muted}</Text>
      <Text className="font-mono text-xs leading-[18px] text-secondary-foreground">{text}</Text>
      {end ? <Text className="font-mono text-xs leading-[18px] text-subtle">{end}</Text> : null}
    </View>
  );
}
