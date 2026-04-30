import type { LucideIcon } from 'lucide-react';
import { Home, BookOpen, PiggyBank, PartyPopper, TrendingUp, Gift } from 'lucide-react';

export type JarKey = 'NEC' | 'EDU' | 'LTSS' | 'PLAY' | 'FFA' | 'GIVE';

export interface JarDef {
  key: JarKey;
  label_vi: string;
  description_vi: string;
  defaultPercent: number;
  hex_light: string;
  hex_dark: string;
  bg_light: string;
  bg_dark: string;
  tw: 'sky' | 'violet' | 'emerald' | 'orange' | 'amber' | 'pink';
  icon: LucideIcon;
}

export const JARS: Record<JarKey, JarDef> = {
  NEC: {
    key: 'NEC',
    label_vi: 'Thiết yếu',
    description_vi: 'Chi phí cố định: nhà, ăn, đi lại, hóa đơn',
    defaultPercent: 55,
    tw: 'sky',
    icon: Home,
    hex_light: '#0284c7',
    hex_dark:  '#38bdf8',
    bg_light:  '#e0f2fe',
    bg_dark:   'rgba(56, 189, 248, 0.18)',
  },
  EDU: {
    key: 'EDU',
    label_vi: 'Giáo dục',
    description_vi: 'Học hỏi, sách, khoá học, kỹ năng',
    defaultPercent: 10,
    tw: 'violet',
    icon: BookOpen,
    hex_light: '#7c3aed',
    hex_dark:  '#a78bfa',
    bg_light:  '#ede9fe',
    bg_dark:   'rgba(167, 139, 250, 0.18)',
  },
  LTSS: {
    key: 'LTSS',
    label_vi: 'Tiết kiệm dài hạn',
    description_vi: 'Mua lớn, dự phòng, tích lũy >12 tháng',
    defaultPercent: 10,
    tw: 'emerald',
    icon: PiggyBank,
    hex_light: '#059669',
    hex_dark:  '#34d399',
    bg_light:  '#d1fae5',
    bg_dark:   'rgba(52, 211, 153, 0.18)',
  },
  PLAY: {
    key: 'PLAY',
    label_vi: 'Hưởng thụ',
    description_vi: 'Giải trí, nhà hàng, du lịch ngắn ngày',
    defaultPercent: 10,
    tw: 'orange',
    icon: PartyPopper,
    hex_light: '#ea580c',
    hex_dark:  '#fb923c',
    bg_light:  '#ffedd5',
    bg_dark:   'rgba(251, 146, 60, 0.18)',
  },
  FFA: {
    key: 'FFA',
    label_vi: 'Tự do tài chính',
    description_vi: 'Đầu tư sinh lời thụ động',
    defaultPercent: 10,
    tw: 'amber',
    icon: TrendingUp,
    hex_light: '#d97706',
    hex_dark:  '#fbbf24',
    bg_light:  '#fef3c7',
    bg_dark:   'rgba(251, 191, 36, 0.18)',
  },
  GIVE: {
    key: 'GIVE',
    label_vi: 'Cho đi',
    description_vi: 'Quà tặng, từ thiện, hỗ trợ gia đình',
    defaultPercent: 5,
    tw: 'pink',
    icon: Gift,
    hex_light: '#db2777',
    hex_dark:  '#f472b6',
    bg_light:  '#fce7f3',
    bg_dark:   'rgba(244, 114, 182, 0.18)',
  },
};

export const JAR_ORDER: JarKey[] = ['NEC', 'EDU', 'LTSS', 'PLAY', 'FFA', 'GIVE'];

export function getJar(key: string | null | undefined): JarDef | null {
  if (!key) return null;
  return (JARS as Record<string, JarDef>)[key] ?? null;
}

export function getJarColor(key: JarKey, mode: 'light' | 'dark' = 'light'): string {
  return mode === 'dark' ? JARS[key].hex_dark : JARS[key].hex_light;
}

export function getJarBg(key: JarKey, mode: 'light' | 'dark' = 'light'): string {
  return mode === 'dark' ? JARS[key].bg_dark : JARS[key].bg_light;
}

export type JarStatus = 'ok' | 'warn' | 'over';

export function formatJarBudget(planned: number, spent: number): {
  remaining: number;
  usagePct: number;
  status: JarStatus;
} {
  const remaining = planned - spent;
  const usagePct = planned > 0 ? Math.min(999, Math.round((spent / planned) * 100)) : 0;
  let status: JarStatus = 'ok';
  if (remaining < 0) status = 'over';
  else if (usagePct >= 80) status = 'warn';
  return { remaining, usagePct, status };
}
