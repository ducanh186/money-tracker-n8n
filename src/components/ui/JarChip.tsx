import { cn } from '../../lib/utils';
import type { JarKey } from '../../lib/jars';
import { JARS } from '../../lib/jars';

type Size = 'sm' | 'md' | 'lg';

interface JarChipProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, 'children' | 'onClick'> {
  jarKey: JarKey | string;
  size?: Size;
  showLabel?: boolean;
  selected?: boolean;
  onClick?: () => void;
}

const sizeMap: Record<Size, { chip: string; icon: string; iconBox: string; text: string }> = {
  sm: { chip: 'gap-1   pr-2 pl-1   py-0.5', icon: 'size-3.5', iconBox: 'size-5',  text: 'text-[11px]' },
  md: { chip: 'gap-1.5 pr-2.5 pl-1 py-0.5', icon: 'size-3.5', iconBox: 'size-5.5', text: 'text-xs' },
  lg: { chip: 'gap-2   pr-3.5 pl-1.5 py-1', icon: 'size-4',   iconBox: 'size-7',  text: 'text-sm' },
};

export function JarChip({
  jarKey,
  size = 'md',
  showLabel = true,
  selected = false,
  onClick,
  className,
  ...rest
}: JarChipProps) {
  const jar = (JARS as Record<string, (typeof JARS)[JarKey]>)[jarKey];

  if (!jar) {
    return (
      <span
        className={cn(
          'inline-flex items-center rounded-pill font-semibold whitespace-nowrap',
          'bg-[var(--color-surface-sunken)] text-[var(--color-text-secondary)]',
          sizeMap[size].chip,
          sizeMap[size].text,
          className,
        )}
        {...rest}
      >
        {jarKey}
      </span>
    );
  }

  const Icon = jar.icon;
  const s = sizeMap[size];

  const baseStyle: React.CSSProperties = selected
    ? { backgroundColor: jar.hex_light, color: '#fff', boxShadow: `0 0 0 2px ${jar.hex_light}33` }
    : { backgroundColor: jar.bg_light, color: jar.hex_light };

  const iconBgStyle: React.CSSProperties = selected
    ? { backgroundColor: 'rgba(255,255,255,0.25)', color: '#fff' }
    : { backgroundColor: jar.hex_light, color: '#fff' };

  const Tag = onClick ? 'button' : 'span';

  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={cn(
        'inline-flex items-center rounded-pill font-semibold whitespace-nowrap',
        'transition-shadow duration-150',
        s.chip,
        s.text,
        onClick && 'cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40',
        className,
      )}
      style={baseStyle}
      {...(rest as React.HTMLAttributes<HTMLElement>)}
    >
      <span
        className={cn('inline-flex items-center justify-center rounded-pill shrink-0', s.iconBox)}
        style={iconBgStyle}
      >
        <Icon className={s.icon} aria-hidden="true" />
      </span>
      {showLabel && <span>{jar.key}</span>}
    </Tag>
  );
}

interface JarIconCircleProps extends React.HTMLAttributes<HTMLSpanElement> {
  jarKey: JarKey | string;
  size?: number;
}

export function JarIconCircle({ jarKey, size = 36, className, ...rest }: JarIconCircleProps) {
  const jar = (JARS as Record<string, (typeof JARS)[JarKey]>)[jarKey];
  if (!jar) {
    return (
      <span
        className={cn(
          'inline-flex items-center justify-center rounded-pill bg-[var(--color-surface-sunken)] text-[var(--color-text-muted)]',
          className,
        )}
        style={{ width: size, height: size }}
        {...rest}
      />
    );
  }
  const Icon = jar.icon;
  return (
    <span
      className={cn('inline-flex items-center justify-center rounded-pill text-white shrink-0', className)}
      style={{ width: size, height: size, backgroundColor: jar.hex_light }}
      {...rest}
    >
      <Icon style={{ width: size * 0.5, height: size * 0.5 }} aria-hidden="true" />
    </span>
  );
}
