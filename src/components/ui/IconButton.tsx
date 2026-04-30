import { forwardRef } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

type Size = 'sm' | 'md' | 'lg';
type Variant = 'ghost' | 'solid';

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  'aria-label': string;
  icon: LucideIcon;
  size?: Size;
  variant?: Variant;
  loading?: boolean;
}

const sizeMap: Record<Size, { box: string; icon: string }> = {
  sm: { box: 'size-8',  icon: 'size-4' },
  md: { box: 'size-10', icon: 'size-5' },
  lg: { box: 'size-12', icon: 'size-6' },
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { icon: Icon, size = 'md', variant = 'ghost', loading = false, disabled, className, type = 'button', ...rest },
  ref,
) {
  const { box, icon } = sizeMap[size];
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        'inline-flex items-center justify-center rounded-pill',
        'transition-colors duration-150 ease-out cursor-pointer',
        'outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variant === 'ghost'
          ? 'bg-transparent text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-sunken)]'
          : 'bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface-sunken)]',
        box,
        className,
      )}
      {...rest}
    >
      {loading ? (
        <Loader2 className={cn(icon, 'animate-spin')} aria-hidden="true" />
      ) : (
        <Icon className={icon} aria-hidden="true" />
      )}
    </button>
  );
});
