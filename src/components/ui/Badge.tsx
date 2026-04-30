import { cn } from '../../lib/utils';
import type { JarKey } from '../../lib/jars';
import { JARS } from '../../lib/jars';

type FlowVariant = 'income' | 'expense' | 'transfer';
type StatusVariant = 'ok' | 'warn' | 'over';
type SimpleVariant = 'neutral' | 'primary';

export type BadgeVariant =
  | FlowVariant
  | StatusVariant
  | SimpleVariant
  | `jar-${JarKey}`;

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant: BadgeVariant;
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
}

const flowStyle: Record<FlowVariant, React.CSSProperties> = {
  income:   { backgroundColor: 'var(--color-income-bg)',   color: 'var(--color-income)' },
  expense:  { backgroundColor: 'var(--color-expense-bg)',  color: 'var(--color-expense)' },
  transfer: { backgroundColor: 'var(--color-transfer-bg)', color: 'var(--color-transfer)' },
};

const statusStyle: Record<StatusVariant, React.CSSProperties> = {
  ok:   { backgroundColor: 'var(--color-ok-bg)',   color: 'var(--color-ok)' },
  warn: { backgroundColor: 'var(--color-warn-bg)', color: 'var(--color-warn)' },
  over: { backgroundColor: 'var(--color-over-bg)', color: 'var(--color-over)' },
};

const simpleClass: Record<SimpleVariant, string> = {
  neutral: 'bg-[var(--color-surface-sunken)] text-[var(--color-text-secondary)]',
  primary: 'bg-primary-100 text-primary-700',
};

function styleFor(variant: BadgeVariant): { style?: React.CSSProperties; className?: string } {
  if (variant in flowStyle) return { style: flowStyle[variant as FlowVariant] };
  if (variant in statusStyle) return { style: statusStyle[variant as StatusVariant] };
  if (variant in simpleClass) return { className: simpleClass[variant as SimpleVariant] };
  if (variant.startsWith('jar-')) {
    const key = variant.slice(4) as JarKey;
    const jar = JARS[key];
    if (jar) return { style: { backgroundColor: jar.bg_light, color: jar.hex_light } };
  }
  return { className: simpleClass.neutral };
}

export function Badge({ variant, size = 'sm', icon, className, children, ...rest }: BadgeProps) {
  const { style, className: variantClassName } = styleFor(variant);
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-pill font-semibold whitespace-nowrap',
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs',
        variantClassName,
        className,
      )}
      style={style}
      {...rest}
    >
      {icon}
      {children}
    </span>
  );
}
