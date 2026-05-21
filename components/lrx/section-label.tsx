import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';

function SectionLabel({ className, ...props }: React.ComponentProps<typeof Text>) {
  return (
    <Text
      className={cn(
        'text-muted-foreground text-[11px] font-semibold uppercase tracking-[0.12em]',
        className
      )}
      {...props}
    />
  );
}

export { SectionLabel };
