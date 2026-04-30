import { cn } from '../../lib/utils';
import { formatCurrency, formatSignedAmount } from '../../lib/utils';

type Size = 'caption' | 'body' | 'h3' | 'h2' | 'h1' | 'display';
type Flow = 'income' | 'expense' | 'transfer' | null;

interface MoneyTextProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, 'children'> {
  value: number;
  flow?: Flow;
  size?: Size;
  format?: 'compact' | 'full';
  signMode?: 'auto' | 'always' | 'never';
}

const sizeClass: Record<Size, string> = {
  caption: 'text-xs',
  body:    'text-sm font-semibold',
  h3:      'text-lg font-semibold',
  h2:      'text-[22px] font-bold leading-tight',
  h1:      'text-[28px] font-bold leading-tight tracking-tight',
  display: 'text-[36px] font-bold leading-tight tracking-tight',
};

const flowColor: Record<NonNullable<Flow>, string> = {
  income:   'text-[var(--color-income)]',
  expense:  'text-[var(--color-expense)]',
  transfer: 'text-[var(--color-transfer)]',
};

export function MoneyText({
  value,
  flow,
  size = 'body',
  format = 'compact',
  signMode = 'auto',
  className,
  ...rest
}: MoneyTextProps) {
  const showSign = signMode === 'always' || (signMode === 'auto' && flow != null);
  const text = showSign
    ? formatSignedAmount(value, format === 'full' ? null : flow)
    : formatCurrency(value);

  return (
    <span
      className={cn(
        'font-numeric tabular-nums',
        sizeClass[size],
        flow ? flowColor[flow] : 'text-[var(--color-text-primary)]',
        className,
      )}
      {...rest}
    >
      {format === 'full' ? value.toLocaleString('vi-VN') + ' đ' : text}
    </span>
  );
}
