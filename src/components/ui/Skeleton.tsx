import { cn } from '../../lib/utils';

type Variant = 'text' | 'card' | 'table-row' | 'chart' | 'circle';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: Variant;
  count?: number;
  width?: string | number;
  height?: string | number;
}

const baseClass = 'animate-pulse bg-[var(--color-surface-sunken)] rounded-md';

const variantClass: Record<Variant, string> = {
  text:        'h-3.5 w-full',
  card:        'h-32 w-full rounded-lg',
  'table-row': 'h-12 w-full',
  chart:       'h-64 w-full rounded-lg',
  circle:      'rounded-pill',
};

export function Skeleton({
  variant = 'text',
  count = 1,
  width,
  height,
  className,
  style,
  ...rest
}: SkeletonProps) {
  const items = Array.from({ length: count });
  const inlineStyle: React.CSSProperties = {
    ...(width !== undefined ? { width } : {}),
    ...(height !== undefined ? { height } : {}),
    ...style,
  };
  return (
    <div className={cn(count > 1 && 'flex flex-col gap-2', className)} {...rest}>
      {items.map((_, i) => (
        <div key={i} className={cn(baseClass, variantClass[variant])} style={inlineStyle} />
      ))}
    </div>
  );
}
