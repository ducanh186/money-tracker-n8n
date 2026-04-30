import { cn } from '../../lib/utils';

type Tone = 'primary' | 'ok' | 'warn' | 'over';
type Size = 'xs' | 'sm' | 'md' | 'lg';

interface ProgressBarProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
  value: number; // 0-100+; clamped internal for fill width
  tone?: Tone; // omit to auto-pick from value
  size?: Size;
  showLabel?: boolean;
  trackColor?: 'default' | 'transparent';
  ariaLabel?: string;
}

const sizeClass: Record<Size, string> = {
  xs: 'h-1',
  sm: 'h-1.5',
  md: 'h-2',
  lg: 'h-3',
};

const toneStyle: Record<Tone, React.CSSProperties> = {
  primary: { backgroundColor: 'var(--color-primary-500, #3b6ff5)' },
  ok:      { backgroundColor: 'var(--color-ok)' },
  warn:    { backgroundColor: 'var(--color-warn)' },
  over:    { backgroundColor: 'var(--color-over)' },
};

function autoTone(value: number): Tone {
  if (value > 100) return 'over';
  if (value >= 80) return 'warn';
  return 'ok';
}

export function ProgressBar({
  value,
  tone,
  size = 'sm',
  showLabel = false,
  trackColor = 'default',
  ariaLabel,
  className,
  ...rest
}: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const t = tone ?? autoTone(value);
  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={ariaLabel}
      className={cn(
        'w-full overflow-hidden rounded-pill relative',
        sizeClass[size],
        trackColor === 'transparent' ? 'bg-transparent' : 'bg-[var(--color-surface-sunken)]',
        className,
      )}
      {...rest}
    >
      <div
        className="h-full rounded-pill transition-[width] duration-300 ease-out"
        style={{ width: `${clamped}%`, ...toneStyle[t] }}
      />
      {showLabel && (
        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold text-[var(--color-text-primary)] mix-blend-difference">
          {Math.round(value)}%
        </span>
      )}
    </div>
  );
}
