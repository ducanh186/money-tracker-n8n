import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format VND amount in compact style:
 * - >= 1,000,000 => x M VND (one decimal when needed, e.g. 1,2 M VND)
 * - >= 1,000 and < 1,000,000 => xk VND
 * - < 1,000 => x VND
 *
 * Always unsigned. Sign is handled by `formatSignedAmount`.
 */
export function formatCurrency(value: number): string {
  const amount = Math.abs(value);

  if (amount >= 1_000_000) {
    const millions = Math.round((amount / 1_000_000) * 10) / 10;
    const millionText = Number.isInteger(millions)
      ? String(millions)
      : millions.toFixed(1).replace('.', ',');
    return `${millionText} M VND`;
  }

  if (amount >= 1_000) {
    const thousands = Math.round((amount / 1_000) * 10) / 10;
    const thousandText = Number.isInteger(thousands)
      ? String(thousands)
      : thousands.toFixed(1).replace('.', ',');
    return `${thousandText}k VND`;
  }

  return `${Math.round(amount)} VND`;
}

/**
 * Format an amount with a sign prefix.
 *
 * @param value   - The raw monetary value (may be positive or negative).
 * @param flow    - Optional flow type ('income' | 'expense' | 'transfer').
 *                  When provided, the sign is derived from the flow.
 *                  When omitted, the sign is derived from the value itself.
 */
export function formatSignedAmount(value: number, flow?: string | null): string {
  const formatted = formatCurrency(value);
  if (flow === 'income') return `+${formatted}`;
  if (flow === 'expense') return `-${formatted}`;
  if (flow === 'transfer') return formatted;
  // No flow specified → derive sign from the numeric value
  if (value > 0) return `+${formatted}`;
  if (value < 0) return `-${formatted}`;
  return formatted;
}
