import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a number as VND currency (always unsigned).
 * Uses Math.abs() to avoid double-negative display bugs.
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })
    .format(Math.abs(value))
    .replace('₫', 'đ');
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
