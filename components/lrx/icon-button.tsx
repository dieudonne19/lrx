import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react-native';

type IconButtonProps = React.ComponentProps<typeof Button> & {
  icon: LucideIcon;
  iconClassName?: string;
};

function IconButton({ className, icon, iconClassName, variant = 'ghost', size = 'icon', ...props }: IconButtonProps) {
  return (
    <Button
      className={cn('rounded-xl', className)}
      size={size}
      variant={variant}
      {...props}>
      <Icon as={icon} className={cn('size-5', iconClassName)} />
    </Button>
  );
}

export { IconButton };
