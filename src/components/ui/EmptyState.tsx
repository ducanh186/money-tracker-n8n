import type { LucideIcon } from 'lucide-react';
import { Button } from './Button';
import { cn } from '../../lib/utils';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
    variant?: 'primary' | 'secondary';
  };
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  size = 'md',
  className,
}: EmptyStateProps) {
  const padding = size === 'sm' ? 'py-8 px-4' : size === 'lg' ? 'py-20 px-8' : 'py-14 px-6';
  const iconSize = size === 'sm' ? 'size-10' : size === 'lg' ? 'size-20' : 'size-14';

  return (
    <div className={cn('flex flex-col items-center justify-center text-center', padding, className)}>
      {Icon && (
        <Icon
          className={cn(iconSize, 'text-[var(--color-text-faint)] mb-3')}
          strokeWidth={1.5}
          aria-hidden="true"
        />
      )}
      <h3 className="text-base font-semibold text-[var(--color-text-primary)] mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-[var(--color-text-muted)] max-w-sm">{description}</p>
      )}
      {action && (
        <Button
          variant={action.variant ?? 'primary'}
          size="md"
          icon={action.icon}
          onClick={action.onClick}
          className="mt-4"
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}
