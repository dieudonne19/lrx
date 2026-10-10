import { Screen, ScreenBody } from '@/components/lrx';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { Stack } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import * as React from 'react';
import { Pressable, View } from 'react-native';
import Svg, { Circle, Defs, Line, LinearGradient, Rect, Stop } from 'react-native-svg';

const SLIDES = [
  {
    eyebrow: 'LRX - 01',
    title: 'Synchronise tes paroles\navec ta musique.',
    body: 'Un editeur .lrc taille pour les studios, les karaokes et les createurs. Rapide, tactile, precis.',
    art: 'wave',
  },
  {
    eyebrow: 'LRX - 02',
    title: 'Un seul geste.\nUn seul bouton.',
    body: 'Lis ta musique, tape sur TAP TIME au bon moment. La ligne active recoit le timestamp, la suivante avance automatiquement.',
    art: 'tap',
  },
  {
    eyebrow: 'LRX - 03',
    title: 'Export .lrc propre,\npret a partager.',
    body: 'Apercu fichier, copie, partage, ou export direct. Metadonnees, lyrics, timestamps: tout sort en standard.',
    art: 'export',
  },
] as const;

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

  function skip() {
    onComplete();
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <Screen padded>
        <ScreenBody className="justify-between">
          <View>
            <Progress step={step} onSelect={setStep} />
            <View className="min-h-[260px] items-center justify-center">
              {slide.art === 'wave' ? <WaveArt /> : null}
              {slide.art === 'tap' ? <TapArt /> : null}
              {slide.art === 'export' ? <ExportArt /> : null}
            </View>
          </View>

          <View className="gap-8 pb-3">
            <View>
              <Text className="text-xs font-semibold uppercase tracking-[2.4px] text-primary">
                {slide.eyebrow}
              </Text>
              <Text className="mt-4 text-[38px] font-semibold leading-[42px] text-foreground">
                {slide.title}
              </Text>
              <Text className="mt-4 max-w-[320px] text-base leading-6 text-muted-foreground">
                {slide.body}
              </Text>
            </View>

            <View className="flex-row items-center gap-3">
              <Button variant="ghost" size="lg" onPress={skip} className="px-4">
                <Text className="text-muted-foreground">Passer</Text>
              </Button>
              <View className="flex-1" />
              <Pressable
                onPress={goNext}
                hitSlop={10}
                className="h-14 min-w-[150px] flex-row items-center justify-center gap-2 rounded-2xl bg-primary px-6 active:scale-[0.98] active:bg-primary/90">
                <Text className="text-sm font-medium text-primary-foreground">
                  {isLast ? 'Commencer' : 'Continuer'}
                </Text>
                <Icon as={ChevronRight} className="size-5 text-primary-foreground" />
              </Pressable>
            </View>
          </View>
        </ScreenBody>
      </Screen>
    </>
  );
}

function Progress({ step, onSelect }: { step: number; onSelect: (step: number) => void }) {
  return (
    <View className="mt-2 flex-row gap-1.5">
      {SLIDES.map((slide, index) => (
        <Pressable
          key={slide.eyebrow}
          onPress={() => onSelect(index)}
          className={`h-1 rounded-full ${index === step ? 'flex-[3] bg-primary' : 'flex-1 bg-input'}`}
        />
      ))}
    </View>
  );
}

function WaveArt() {
  const bars = Array.from({ length: 28 }, (_, index) => {
    const height = 30 + Math.abs(Math.sin(index * 0.5) * Math.cos(index * 0.3)) * 110;
    return { x: 6 + index * 9, y: 100 - height / 2, height };
  });

  return (
    <Svg width={260} height={210} viewBox="0 0 260 210">
      <Defs>
        <LinearGradient id="waveFill" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#22252C" />
          <Stop offset="0.44" stopColor="#22252C" />
          <Stop offset="0.45" stopColor="#7C5CFF" />
          <Stop offset="1" stopColor="#9A82FF" />
        </LinearGradient>
      </Defs>
      {bars.map((bar) => (
        <Rect key={bar.x} x={bar.x} y={bar.y + 5} width={5} height={bar.height} rx={2.5} fill="url(#waveFill)" />
      ))}
      <Line x1={120} x2={120} y1={25} y2={185} stroke="#F2F3F6" strokeWidth={1} opacity={0.72} />
      <Circle cx={120} cy={25} r={4} fill="#F2F3F6" />
    </Svg>
  );
}

function TapArt() {
  return (
    <View className="relative h-[235px] w-[280px] items-center">
      <View className="absolute left-0 right-0 top-2 gap-2 rounded-2xl border border-border bg-card px-5 py-4">
        <Text className="text-sm text-muted-foreground">Sous les neons</Text>
        <Text className="text-sm text-muted-foreground">Je cherche encore</Text>
        <Text className="text-lg font-semibold text-foreground">Les rues parlent en silence</Text>
        <Text className="text-sm text-subtle">La nuit garde sa cadence</Text>
      </View>

      <View className="absolute bottom-8 h-16 w-[220px] items-center justify-center rounded-2xl border border-primary bg-primary">
        <Text className="text-xs font-semibold uppercase tracking-[3px] text-primary-foreground">Tap Time</Text>
      </View>
      <View className="absolute bottom-5 h-20 w-[252px] rounded-[22px] border border-primary/50" />
    </View>
  );
}

function ExportArt() {
  return (
    <View className="w-[286px] rounded-2xl border border-border bg-card px-5 py-5">
      <View className="mb-4 flex-row items-center gap-1.5">
        <View className="size-2.5 rounded-full bg-muted" />
        <View className="size-2.5 rounded-full bg-muted" />
        <View className="size-2.5 rounded-full bg-primary" />
        <Text className="ml-auto font-mono text-[10px] text-muted-foreground">track.lrc</Text>
      </View>
      <CodeLine muted="[ti:" text="Neons" end="]" />
      <CodeLine muted="[ar:" text="Camille Roux" end="]" />
      <View className="h-3" />
      <CodeLine muted="[00:12.40]" text=" Sous les neons" accent />
      <CodeLine muted="[00:16.10]" text=" Je cherche encore" accent />
      <CodeLine muted="[00:20.05]" text=" Les rues parlent..." accent />
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
      <Text className={`font-mono text-xs leading-5 ${accent ? 'text-primary' : 'text-muted-foreground'}`}>
        {muted}
      </Text>
      <Text className="font-mono text-xs leading-5 text-foreground">{text}</Text>
      {end ? <Text className="font-mono text-xs leading-5 text-muted-foreground">{end}</Text> : null}
    </View>
  );
}
