import { forwardRef } from 'react';
import { cn } from '../../lib/utils';

type Variant = 'default' | 'raised' | 'interactive' | 'flat';
type Padding = 'none' | 'sm' | 'md' | 'lg';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: Variant;
  padding?: Padding;
  as?: 'div' | 'article' | 'section';
}

const variantClasses: Record<Variant, string> = {
  default:
    'bg-[var(--color-surface)] border border-[var(--color-border)] shadow-sm',
  raised:
    'bg-[var(--color-surface-raised)] border border-[var(--color-border)] shadow-md',
  interactive:
    'bg-[var(--color-surface)] border border-[var(--color-border)] shadow-sm ' +
    'cursor-pointer transition-[box-shadow,border-color,transform] duration-150 ease-out ' +
    'hover:shadow-md hover:border-[var(--color-border-strong)] active:scale-[0.997] ' +
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40',
  flat:
    'bg-[var(--color-surface)] border border-[var(--color-border)]',
};

const paddingClasses: Record<Padding, string> = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { variant = 'default', padding = 'md', as = 'div', className, children, ...rest },
  ref,
) {
  const Tag = as;
  return (
    <Tag
      ref={ref as React.Ref<HTMLDivElement>}
      className={cn('rounded-lg', variantClasses[variant], paddingClasses[padding], className)}
      {...rest}
    >
      {children}
    </Tag>
  );
});

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex items-center justify-between mb-3', className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn('text-base font-semibold text-[var(--color-text-primary)]', className)}
      {...props}
    />
  );
}

export function CardBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col gap-3', className)} {...props} />;
}

export function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex items-center justify-end gap-2 mt-4 pt-3 border-t border-[var(--color-border-light)]', className)}
      {...props}
    />
  );
}
