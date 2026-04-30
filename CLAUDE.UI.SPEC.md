# UI Design Specification — Money Tracker (Redesign Phase 1)

> **Mục đích**: Spec để implement redesign tối ưu cho Quản lý + Theo dõi chi tiêu.
> **Input**: `CLAUDE.UI.md` (audit hiện trạng).
> **Output kế tiếp**: implementation theo Migration Order ở Section 6, bắt đầu Phase A.
>
> **Naming convention**:
> - `J1`–`J6` = Jobs To Be Done (xem Memory block của prompt gốc)
> - `P1`–`P14` = Pain points từ `CLAUDE.UI.md` Section 5
> - `S1`–`S6` = Redesign suggestions từ `CLAUDE.UI.md` Section 7

---

## 1. Design Tokens

Toàn bộ tokens dưới đây để consume bằng Tailwind v4 `@theme` block (`src/index.css`). Sau migration, **mọi component KHÔNG còn dùng class hex literal** (`bg-[#1a2433]`, v.v.) — chỉ dùng utility class generated từ tokens.

### 1.1 Colors — Light mode

```css
@theme {
  /* ─── Primary (Refined Blue — accent duy nhất) ─── */
  --color-primary-50:  #eff5ff;
  --color-primary-100: #dbe7fe;
  --color-primary-200: #bfd4fe;
  --color-primary-300: #93b6fc;
  --color-primary-400: #608ff8;
  --color-primary-500: #3b6ff5;   /* main */
  --color-primary-600: #2453e6;   /* hover */
  --color-primary-700: #1c41cc;
  --color-primary-800: #1d39a4;
  --color-primary-900: #1d3582;
  --color-primary-950: #162353;

  /* ─── Surfaces ─── */
  --color-surface:        #ffffff;   /* card, panel */
  --color-surface-alt:    #f7f9fc;   /* page bg */
  --color-surface-raised: #ffffff;   /* modal, drawer, dropdown */
  --color-surface-sunken: #f0f3f8;   /* code, kbd, recessed */

  /* ─── Borders ─── */
  --color-border:        #e3e8ef;
  --color-border-light:  #eef1f6;
  --color-border-strong: #c8d0db;

  /* ─── Text ─── */
  --color-text-primary:   #0f172a;
  --color-text-secondary: #3d4859;
  --color-text-muted:     #6b7585;
  --color-text-faint:     #99a3b3;

  /* ─── Semantic ─── */
  --color-income:     #14a058;  --color-income-bg:   #e3f6ec;
  --color-expense:    #d8362a;  --color-expense-bg:  #fce6e4;
  --color-transfer:   #2453e6;  --color-transfer-bg: #e3ebff;
  --color-warn:       #b67200;  --color-warn-bg:     #fdf0d6;
  --color-over:       #c12a25;  --color-over-bg:     #fce4e2;
  --color-ok:         #14a058;  --color-ok-bg:       #e3f6ec;
}
```

### 1.2 Colors — Dark mode

```css
.dark {
  --color-primary-500: #5a87f7;   /* brightened for dark contrast */
  --color-primary-600: #3b6ff5;

  --color-surface:        #161c2c;
  --color-surface-alt:    #0f1422;
  --color-surface-raised: #1d2436;
  --color-surface-sunken: #0a0f1c;

  --color-border:         #2a3245;
  --color-border-light:   #1f2638;
  --color-border-strong:  #3a4258;

  --color-text-primary:   #eef1f7;
  --color-text-secondary: #c1c8d6;
  --color-text-muted:     #8a93a4;
  --color-text-faint:     #5e6677;

  --color-income:     #4ade80;  --color-income-bg:   rgba(74, 222, 128, 0.14);
  --color-expense:    #fb7185;  --color-expense-bg:  rgba(251, 113, 133, 0.14);
  --color-transfer:   #80a3ff;  --color-transfer-bg: rgba(128, 163, 255, 0.14);
  --color-warn:       #fbbf24;  --color-warn-bg:     rgba(251, 191, 36, 0.14);
  --color-over:       #fb7185;  --color-over-bg:     rgba(251, 113, 133, 0.18);
  --color-ok:         #4ade80;  --color-ok-bg:       rgba(74, 222, 128, 0.14);
}
```

### 1.3 Typography

Font family Inter giữ nguyên (`src/index.css:1`). **Bắt buộc thêm** `font-feature-settings: "tnum"` cho mọi `MoneyText` để số tabular thẳng cột.

| Token | Size | Line-height | Weight | Tracking | Use case |
|---|---|---|---|---|---|
| `display` | 36px (2.25rem) | 1.15 | 700 | -0.02em | Hero number trên Home (J2) |
| `h1` | 28px (1.75rem) | 1.2 | 700 | -0.015em | Page title |
| `h2` | 22px (1.375rem) | 1.25 | 600 | -0.01em | Section heading |
| `h3` | 18px (1.125rem) | 1.35 | 600 | 0 | Card title |
| `h4` | 16px (1rem) | 1.4 | 600 | 0 | Sub-heading |
| `body-lg` | 16px (1rem) | 1.55 | 400 | 0 | Reading text |
| `body` | 14px (0.875rem) | 1.55 | 400 | 0 | Default UI |
| `caption` | 13px (0.8125rem) | 1.4 | 400 | 0 | Meta info, ngày giờ |
| `overline` | 11px (0.6875rem) | 1.3 | 600 | 0.06em uppercase | Section label |

```css
@theme {
  --font-sans:   "Inter", ui-sans-serif, system-ui, sans-serif;
  --font-numeric-features: "tnum" 1, "cv11" 1;

  --text-display: 2.25rem;   --leading-display: 1.15;
  --text-h1:      1.75rem;   --leading-h1: 1.2;
  --text-h2:      1.375rem;  --leading-h2: 1.25;
  --text-h3:      1.125rem;  --leading-h3: 1.35;
  --text-h4:      1rem;      --leading-h4: 1.4;
  --text-body-lg: 1rem;      --leading-body-lg: 1.55;
  --text-body:    0.875rem;  --leading-body: 1.55;
  --text-caption: 0.8125rem; --leading-caption: 1.4;
  --text-overline:0.6875rem; --leading-overline: 1.3;
}
```

**Self-host font**: thay `@import url('https://fonts.googleapis.com/...')` (`src/index.css:1`) bằng local font file để fix P14 (FCP delay). Phase A tasks.

### 1.4 Spacing

Tailwind v4 default 4-based scale OK. Pin step list **explicit** để code không dùng số ngẫu nhiên:

| Token | Px | Use |
|---|---|---|
| `0` | 0 | reset |
| `1` | 4 | tight gap |
| `2` | 8 | element-internal |
| `3` | 12 | small gap |
| `4` | 16 | default card padding |
| `5` | 20 | uncommon |
| `6` | 24 | section gap |
| `8` | 32 | section divide |
| `10` | 40 | hero internal |
| `12` | 48 | hero divide |
| `16` | 64 | page divide |

**Rule**: spacing không trong list trên ⇒ phải có comment giải thích why.

### 1.5 Radius

| Token | Px | Use |
|---|---|---|
| `sm` | 6 | input, badge, small button |
| `md` | 10 | medium button, chip |
| `lg` | 16 | card, panel |
| `xl` | 24 | hero card, modal |
| `pill` | 9999 | toggle, status badge |

```css
@theme {
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 16px;
  --radius-xl: 24px;
  --radius-pill: 9999px;
}
```

### 1.6 Shadow

```css
@theme {
  /* light */
  --shadow-xs: 0 1px 2px rgba(15, 23, 42, 0.05);
  --shadow-sm: 0 1px 3px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.04);
  --shadow-md: 0 4px 8px -2px rgba(15, 23, 42, 0.08), 0 2px 4px -2px rgba(15, 23, 42, 0.04);
  --shadow-lg: 0 12px 24px -4px rgba(15, 23, 42, 0.10), 0 4px 8px -4px rgba(15, 23, 42, 0.06);
}
.dark {
  --shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.40);
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.45), 0 1px 2px rgba(0, 0, 0, 0.30);
  --shadow-md: 0 4px 8px -2px rgba(0, 0, 0, 0.50), 0 2px 4px -2px rgba(0, 0, 0, 0.30);
  --shadow-lg: 0 12px 24px -4px rgba(0, 0, 0, 0.55), 0 4px 8px -4px rgba(0, 0, 0, 0.40);
}
```

Use map: `xs` = chip; `sm` = card resting; `md` = card hover; `lg` = modal/drawer.

### 1.7 Motion

```css
@theme {
  --duration-instant: 0ms;
  --duration-fast:    150ms;   /* hover, tap feedback */
  --duration-base:    200ms;   /* drawer slide, modal in */
  --duration-slow:    320ms;   /* modal out, page transition */

  --ease-out:    cubic-bezier(0.2, 0.8, 0.2, 1);
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 2. UI Primitives — TypeScript Signatures

Mỗi primitive ở `src/components/ui/{name}.tsx`. **Convention**: forwardRef khi cần `ref`, dùng `cn()` từ `src/lib/utils.ts:4` để merge class.

### Button

```tsx
type ButtonProps = {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'link';  // default 'primary'
  size?: 'sm' | 'md' | 'lg';                                         // default 'md'
  loading?: boolean;
  disabled?: boolean;
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';                                   // default 'left'
  fullWidth?: boolean;
  type?: 'button' | 'submit' | 'reset';                              // default 'button'
  children: React.ReactNode;
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'>;
```
**Use**: action chính/phụ. Replace 9 chỗ `bg-blue-600 hover:bg-blue-700` (P6).
**A11y**: `disabled` → `aria-disabled` + tabIndex=-1; `loading` → `aria-busy="true"` + disable click. Min target 40×40 px (`size="md"` default).

### IconButton

```tsx
type IconButtonProps = {
  'aria-label': string;                                              // REQUIRED
  icon: LucideIcon;
  size?: 'sm' | 'md' | 'lg';                                         // default 'md' (40px)
  variant?: 'ghost' | 'solid';                                       // default 'ghost'
  loading?: boolean;
  disabled?: boolean;
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'aria-label'>;
```
**Use**: nút icon-only (close, menu, more). **A11y**: `aria-label` REQUIRED — TypeScript enforce.

### Input

```tsx
type InputProps = {
  variant?: 'default' | 'inline';                                    // default 'default'
  prefix?: React.ReactNode;       // icon trái hoặc text
  suffix?: React.ReactNode;       // icon phải hoặc text
  error?: string;                 // message; nếu set, border + ring đổi sang `over`
  helpText?: string;
  label?: string;                 // nếu omit, dùng aria-label
  size?: 'sm' | 'md' | 'lg';
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'prefix'>;
```
**Use**: replace 33 chỗ `rounded-lg border border-slate-300...` (P5).
**A11y**: `<label>` linked qua `htmlFor` + auto id; `error` → `aria-invalid="true"` + `aria-describedby` trỏ vào error msg.

### NumberInput

```tsx
type NumberInputProps = {
  value: number;
  onChange: (n: number) => void;
  thousandSep?: ',' | '.' | ' ';                                     // default ','
  currency?: 'VND' | null;                                           // default 'VND' (suffix)
  min?: number;
  max?: number;
  allowDecimal?: boolean;                                            // default false
  large?: boolean;                                                   // J1: numpad-friendly mobile mode (text-display)
  placeholder?: string;
  disabled?: boolean;
  autoFocus?: boolean;
};
```
**Use**: critical cho J1 Quick Capture. Format on blur, parse trên onChange. Mobile: `inputMode="numeric"` + `pattern="[0-9]*"` để mở numpad.
**A11y**: native `<input type="text">` với `inputMode="numeric"` (không dùng `type="number"` để control format).

### Select / Textarea / Switch / Checkbox / Radio

```tsx
type SelectProps    = { options: Array<{ value: string; label: string }>; placeholder?: string; error?: string; } & InputBaseProps;
type TextareaProps  = { rows?: number; autoResize?: boolean; } & Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'rows'>;
type SwitchProps    = { checked: boolean; onChange: (v: boolean) => void; label?: string; size?: 'sm' | 'md'; };
type CheckboxProps  = { checked: boolean; onChange: (v: boolean) => void; label?: string; indeterminate?: boolean; };
type RadioGroupProps<T extends string> = { value: T; onChange: (v: T) => void; options: Array<{ value: T; label: string; description?: string }>; orientation?: 'horizontal' | 'vertical'; };
```
**A11y**: native form elements ưu tiên; Switch dùng `role="switch"` + `aria-checked`; Radio luôn có `<fieldset><legend>` wrapper khi có nhiều option.

### Card

```tsx
type CardProps = {
  variant?: 'default' | 'raised' | 'interactive';                    // default 'default'
  padding?: 'none' | 'sm' | 'md' | 'lg';                             // default 'md'
  as?: 'div' | 'article' | 'section';                                // default 'div'
  children: React.ReactNode;
} & React.HTMLAttributes<HTMLDivElement>;

// + sub-components
<CardHeader>, <CardBody>, <CardFooter>
```
**Use**: replace ~30+ chỗ `bg-white dark:bg-[#1a2433] rounded-xl p-6 border ... shadow-sm`. `interactive` thêm hover shadow + cursor-pointer + focus-visible ring.

### Modal + Drawer

```tsx
type ModalProps = {
  open: boolean;
  onClose: () => void;
  size?: 'sm' | 'md' | 'lg';                                         // default 'md'
  title: string;                                                     // REQUIRED for a11y
  description?: string;
  closeOnEscape?: boolean;                                           // default true
  closeOnOverlay?: boolean;                                          // default true
  initialFocus?: React.RefObject<HTMLElement>;
  children: React.ReactNode;
};

type DrawerProps = {
  open: boolean;
  onClose: () => void;
  side: 'right' | 'bottom';                                          // mobile dùng 'bottom', desktop 'right'
  size?: 'sm' | 'md' | 'lg' | 'full';                                // default 'md'
  title: string;
  children: React.ReactNode;
};
```
**Use**: replace 6 chỗ inline overlay (P7). Render qua React Portal vào `document.body`.
**A11y**: `role="dialog"` + `aria-modal="true"` + `aria-labelledby` (title) + `aria-describedby` (description); focus trap (Tab + Shift+Tab vòng); restore focus khi close; `Escape` đóng nếu `closeOnEscape`.

### Badge

```tsx
type BadgeVariant =
  | 'income' | 'expense' | 'transfer'
  | `jar-${JarKey}`
  | 'status-ok' | 'status-warn' | 'status-over'
  | 'neutral';

type BadgeProps = {
  variant: BadgeVariant;
  size?: 'sm' | 'md';                                                // default 'sm'
  icon?: LucideIcon;
  children: React.ReactNode;
};
```
**Use**: thay flow badges in `Transactions.tsx:43-54`, `TransactionDetails.tsx:23-30`. Dùng cho jar identification, transaction flow, planner status.

### ProgressBar

```tsx
type ProgressBarProps = {
  value: number;                  // 0-100, clamp internal
  tone?: 'primary' | 'ok' | 'warn' | 'over';                         // auto-pick from value if omitted (>100 over, >=80 warn)
  size?: 'xs' | 'sm' | 'md';                                         // default 'sm' (8px)
  showLabel?: boolean;            // overlay percent text
  trackColor?: 'default' | 'transparent';
};
```
**Use**: replace ~12 inline progress bar trong `Overview.tsx:161-163`, `Jars.tsx:438-441`, `Goals.tsx:54-58`, `Debts.tsx:64-71`, BudgetPlan.

### JarChip (domain primitive)

```tsx
type JarChipProps = {
  jarKey: JarKey;
  size?: 'sm' | 'md' | 'lg';                                         // default 'md'
  showLabel?: boolean;                                               // default true
  selected?: boolean;
  onClick?: () => void;
};
```
**Use**: hiển thị 1 hũ với màu + icon đúng từ `jars.ts`. Dùng ở: Quick Capture jar picker, Transaction row, Jar grid, Budget Plan.

### MoneyText (domain primitive)

```tsx
type MoneyTextProps = {
  value: number;
  flow?: 'income' | 'expense' | 'transfer' | null;                   // controls sign + color
  size?: 'caption' | 'body' | 'h3' | 'h2' | 'h1' | 'display';        // default 'body'
  format?: 'compact' | 'full';                                       // default 'compact' (12,5M VND); 'full' = 12,500,000 VND
  signMode?: 'auto' | 'always' | 'never';                            // default 'auto' (theo flow)
  className?: string;
};
```
**Use**: mọi chỗ hiện tiền. Wrap `formatCurrency` + `formatSignedAmount` từ `utils.ts:16-55`. Apply `font-feature-settings: tnum` để số tabular.

### EmptyState

```tsx
type EmptyStateProps = {
  icon?: LucideIcon;                                                  // default sensible per context
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void; icon?: LucideIcon };
  size?: 'sm' | 'md' | 'lg';                                         // default 'md'
};
```
**Use**: 0-data state ở Transactions, Goals, Debts (P11). Replace ad-hoc placeholders.

### Skeleton

```tsx
type SkeletonProps = {
  variant: 'text' | 'card' | 'table-row' | 'chart' | 'circle';
  count?: number;                                                    // default 1
  width?: string | number;
  height?: string | number;
  className?: string;
};
```
**Use**: replace `<Loader2 className="animate-spin">` centered (Overview, Transactions, Goals, BudgetPlan). Render layout-stable placeholder để giảm CLS.

### Toaster

```tsx
// Mount once at root (main.tsx hoặc App.tsx)
<Toaster position="top-right" richColors />

// Use anywhere
toast.success('Đã lưu giao dịch', { description: '−50.000đ · Hũ NEC' });
toast.error('Không thể lưu', { description: error.message, action: { label: 'Thử lại', onClick: retry } });
toast.promise(savePromise, { loading: 'Đang lưu...', success: 'Đã lưu', error: 'Lỗi' });
toast.confirm('Xóa giao dịch này?', { onConfirm, onCancel });        // custom wrapper for sonner
```
**Use**: replace 4 `alert()`/`confirm()` (P8). Dùng `sonner` (3KB gzip).

---

## 3. Jar Identity — Single Source of Truth

**File mới**: `src/lib/jars.ts`. Mọi component import từ đây — **xóa** 3 bảng cũ ở `ExpenseStructureChart.tsx:9-16`, `Jars.tsx:40-47,49-56`, `BudgetPlan.tsx:59-66`.

```ts
// src/lib/jars.ts
import type { LucideIcon } from 'lucide-react';
import { Home, BookOpen, PiggyBank, PartyPopper, TrendingUp, Gift } from 'lucide-react';

export type JarKey = 'NEC' | 'EDU' | 'LTSS' | 'PLAY' | 'FFA' | 'GIVE';

export interface JarDef {
  key: JarKey;
  label_vi: string;
  description_vi: string;
  defaultPercent: number;
  hex_light: string;       // 600-tier — readable trên bg trắng
  hex_dark:  string;       // 400-tier — readable trên bg đen
  tw: 'sky' | 'violet' | 'emerald' | 'orange' | 'amber' | 'pink';
  icon: LucideIcon;
  gradient_from: string;   // hex_dark
  gradient_to:   string;   // hex_light
}

export const JARS: Record<JarKey, JarDef> = {
  NEC: {
    key: 'NEC', label_vi: 'Thiết yếu',
    description_vi: 'Chi phí cố định: nhà, ăn, đi lại, hóa đơn',
    defaultPercent: 55, tw: 'sky', icon: Home,
    hex_light: '#0284c7', hex_dark: '#38bdf8',
    gradient_from: '#38bdf8', gradient_to: '#0284c7',
  },
  EDU: {
    key: 'EDU', label_vi: 'Giáo dục',
    description_vi: 'Học hỏi, sách, khoá học, kỹ năng',
    defaultPercent: 10, tw: 'violet', icon: BookOpen,
    hex_light: '#7c3aed', hex_dark: '#a78bfa',
    gradient_from: '#a78bfa', gradient_to: '#7c3aed',
  },
  LTSS: {
    key: 'LTSS', label_vi: 'Tiết kiệm dài hạn',
    description_vi: 'Mua lớn, dự phòng, tích lũy >12 tháng',
    defaultPercent: 10, tw: 'emerald', icon: PiggyBank,
    hex_light: '#059669', hex_dark: '#34d399',
    gradient_from: '#34d399', gradient_to: '#059669',
  },
  PLAY: {
    key: 'PLAY', label_vi: 'Hưởng thụ',
    description_vi: 'Giải trí, nhà hàng, du lịch ngắn ngày',
    defaultPercent: 10, tw: 'orange', icon: PartyPopper,
    hex_light: '#ea580c', hex_dark: '#fb923c',
    gradient_from: '#fb923c', gradient_to: '#ea580c',
  },
  FFA: {
    key: 'FFA', label_vi: 'Tự do tài chính',
    description_vi: 'Đầu tư sinh lời thụ động',
    defaultPercent: 10, tw: 'amber', icon: TrendingUp,
    hex_light: '#d97706', hex_dark: '#fbbf24',
    gradient_from: '#fbbf24', gradient_to: '#d97706',
  },
  GIVE: {
    key: 'GIVE', label_vi: 'Cho đi',
    description_vi: 'Quà tặng, từ thiện, hỗ trợ gia đình',
    defaultPercent: 5, tw: 'pink', icon: Gift,
    hex_light: '#db2777', hex_dark: '#f472b6',
    gradient_from: '#f472b6', gradient_to: '#db2777',
  },
};

export const JAR_ORDER: JarKey[] = ['NEC', 'EDU', 'LTSS', 'PLAY', 'FFA', 'GIVE'];

export function getJar(key: string): JarDef | null {
  return (JARS as Record<string, JarDef>)[key] ?? null;
}

export function getJarColor(key: JarKey, mode: 'light' | 'dark' = 'light'): string {
  return mode === 'dark' ? JARS[key].hex_dark : JARS[key].hex_light;
}

export function formatJarBudget(planned: number, spent: number) {
  const remaining = planned - spent;
  const usagePct = planned > 0 ? Math.min(100, Math.round((spent / planned) * 100)) : 0;
  let status: 'ok' | 'warn' | 'over' = 'ok';
  if (remaining < 0) status = 'over';
  else if (usagePct >= 80) status = 'warn';
  return { remaining, usagePct, status };
}
```

**Migration note**:
- `ExpenseStructureChart.tsx:9` → import `JARS` + `getJarColor`. Xóa local `JAR_COLORS` + `FALLBACK_PALETTE` (chấp nhận miss khi user có jar custom — flag warning, không fallback).
- `Jars.tsx:40,49` → xóa `JAR_COLORS`, `JAR_ICON_BG`, `getJarColor`, `getJarIconBg`. Replace bằng `<JarChip>` primitive.
- `BudgetPlan.tsx:59-73` → xóa `JAR_STYLES`, `getJarStyle`. Replace bằng `<JarChip>` + `getJar()`.
- `Overview.tsx:152` (jar grid) → swap inline className soup bằng `<JarChip jarKey={key} size="md" />` + `<MoneyText>`.

**Custom jar handling**: nếu API trả jar key ngoài 6 keys (vd `INCOME` ở `Jars.tsx:255-260`), `getJar()` return `null`. Component xử lý null = fallback `<Badge variant="neutral">{key}</Badge>` — KHÔNG random palette.

---

## 4. Screen Wireframes

Mỗi screen: layout mobile (375px) + desktop (1280px), states, interactions, job mapping.

### Screen 1 — Home (replaces Overview)

**Serves**: J2 (glance check) + J4 (month close) chính, J5 (pattern spot) phụ.

#### Mobile 375px

```
┌─────────────────────────────────────┐
│ 💰  Th 04/2026 ▾          ☾   ⓘ   │  TopBar (compact, sticky)
├─────────────────────────────────────┤
│                                     │
│  Còn chi được          ● Đúng tiến │  ← HeroCard (J2)
│                                     │
│   4.236.000  VND                    │     display 36px tabular
│                                     │
│  Thu 18,0M · Chi 13,8M · KH 18,0M  │     caption row
│  ━━━━━━━━━━━━━━━━━━━━━━░░░░ 76%   │     overall progress
│                                     │
├─────────────────────────────────────┤
│  6 hũ tháng này       Quản lý →   │  ← section header (link to /jars)
│                                     │
│  ┌──────────────┐ ┌──────────────┐ │
│  │ 🏠  NEC      │ │ 📚  EDU      │ │  ← JarChip + Card (interactive)
│  │ Thiết yếu    │ │ Giáo dục     │ │
│  │ 1,8M / 9,9M  │ │ 200k / 1,8M  │ │     MoneyText body-lg
│  │ ▓▓▓▓░░░ 78%  │ │ ▓░░░░░  11%  │ │     ProgressBar tone auto
│  │ ● còn 8,1M   │ │ ● còn 1,6M   │ │
│  └──────────────┘ └──────────────┘ │
│  ┌──────────────┐ ┌──────────────┐ │
│  │ 🎉  PLAY     │ │ 🐷  LTSS     │ │
│  │ Hưởng thụ    │ │ Tiết kiệm DH │ │
│  │ 2,2M / 1,8M  │ │ 1,8M / 1,8M  │ │
│  │ ▓▓▓▓▓▓▓ 122% │ │ ▓▓▓▓▓▓▓ 100% │ │
│  │ ⚠ vượt 400k  │ │ ● đủ kế hoạch│ │     status-warn / status-ok
│  └──────────────┘ └──────────────┘ │
│  (FFA, GIVE — scroll thấy)         │
│                                     │
├─────────────────────────────────────┤
│  Tuần này                           │
│  ┌────────────────────────────────┐│
│  │ ↗ Thu  +500k    ↘ Chi −1,8M    ││  ← stat row
│  └────────────────────────────────┘│
├─────────────────────────────────────┤
│  Top ăn tiền tháng này   Xem hết→ │  ← Insights mini (J5)
│  1. Ăn ngoài         Hũ PLAY −1,2M │
│  2. Đi chợ           Hũ NEC  −980k │
│  3. Xăng xe          Hũ NEC  −560k │
├─────────────────────────────────────┤
│  Gần đây             Xem tất cả → │
│  ── Hôm nay  18/04 ────────         │
│  🏠 NEC  Cà phê             −50k   │  ← JarChip + desc + MoneyText
│  🏠 NEC  Grab               −45k   │
│  ── Hôm qua  17/04 ────────         │
│  💼 INC  Lương            +18,0M   │
│  🏠 NEC  Đi chợ            −180k   │
│                                     │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│  🏠   📋   ⊕   💼   ⋯              │  ← BottomTab (sticky)
│ Home  Tx  Add  Hũ   More           │     center "Add" raised FAB style
└─────────────────────────────────────┘
```

#### Desktop 1280px

```
┌────────────────────────────────────────────────────────────────────────────────┐
│  💰 Money Tracker     Tổng quan   Giao dịch   Hũ   Chi tiêu   Quỹ   Nợ        │
│                              Th 04/2026 ▾    ⌘K Tìm    ⊕ Thêm GD    ☾   ⓘ   │  TopBar
├────────────────────────────────────────────────────────────────────────────────┤
│                                                                                │
│  ┌───────────────────────────────────┐ ┌──────────────────────────────────┐  │
│  │                                   │ │  Tuần này                        │  │
│  │  Còn chi được      ● Đúng tiến   │ │  ↗ Thu  +500k                    │  │
│  │                                   │ │  ↘ Chi  −1,8M                    │  │
│  │   4.236.000 VND                   │ │  💎 Tiết kiệm 18%                 │  │
│  │                                   │ ├──────────────────────────────────┤  │
│  │  Thu 18,0M · Chi 13,8M · KH 18M  │ │  Top ăn tiền                     │  │
│  │  ━━━━━━━━━━━━━━━━━░░░░ 76%       │ │  Ăn ngoài    PLAY −1,2M          │  │
│  └───────────────────────────────────┘ │  Đi chợ      NEC  −980k          │  │
│                                        │  Xăng        NEC  −560k          │  │
│                                        └──────────────────────────────────┘  │
│                                                                                │
│  6 hũ tháng này                                          Quản lý hũ →        │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐│
│  │ 🏠 NEC   │ │ 📚 EDU   │ │ 🐷 LTSS  │ │ 🎉 PLAY  │ │ 📈 FFA   │ │ 🎁 GIVE││
│  │ 1,8/9,9M │ │ 200k/1,8M│ │ 1,8/1,8M │ │ 2,2/1,8M │ │ 0/1,8M   │ │ 0/900k ││
│  │ ▓▓▓▓░ 78%│ │ ▓░    11%│ │ ▓▓▓ 100% │ │ ▓▓▓ 122% │ │ ░░    0% │ │ ░  0% ││
│  │ ● 8,1M   │ │ ● 1,6M   │ │ ● đủ KH  │ │ ⚠ vượt   │ │ ● 1,8M   │ │ ● 900k ││
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘ └────────┘│
│                                                                                │
│  ┌───────────── Charts ─────────────┐ ┌───────── Gần đây ──────────────────┐ │
│  │  Thu chi 6 tháng (BarChart)      │ │  ── Hôm nay  18/04 ──              │ │
│  │  ▇▆▅▆▇█▇  income                 │ │  🏠 Cà phê         NEC −50k        │ │
│  │  ▾▿▾▿▾▿▾  expense                │ │  🏠 Grab           NEC −45k        │ │
│  │                                  │ │  ── Hôm qua  17/04 ──              │ │
│  │  Cơ cấu chi (Donut)              │ │  💼 Lương          INC +18M        │ │
│  │   ⊙  per-jar slice               │ │  🏠 Đi chợ         NEC −180k       │ │
│  └──────────────────────────────────┘ └────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────────────┘
```

**Components**: HeroCard (composed Card), JarChip × 6, ProgressBar (auto tone), MoneyText, Card interactive cho jar grid, IncomeExpenseChart (giữ recharts), ExpenseStructureChart, EmptyState (no transactions), Skeleton (loading).

**States**:
- `loading`: Hero card → Skeleton variant=card; jar grid → 6× Skeleton card; chart → Skeleton variant=chart.
- `empty` (tháng mới, 0 transaction): Hero hiện "Chưa có giao dịch" + Button "+ Thêm giao dịch đầu tiên" → mở Quick Capture.
- `error`: Hero card thay bằng `<Card>` với icon AlertTriangle + retry Button.

**Interactions**:
- Click jar card → Drawer drill-down (giao dịch của hũ trong tháng).
- Click recent tx row → Drawer detail (giữ pattern hiện tại `Transactions.tsx:212`).
- Click "Thêm GD" hoặc FAB → mở Quick Capture (Screen 2).
- Mobile: pull-to-refresh trigger `useTriggerSync()`.

---

### Screen 2 — Quick Capture (NEW)

**Serves**: J1 (capture nhanh) — chính.

**Entry**: Mobile = bottom-tab center FAB; Desktop = TopBar button "⊕ Thêm GD" hoặc shortcut `⌘K` (Cmd/Ctrl+K).

#### Mobile 375px (bottom Drawer, full-height)

```
┌─────────────────────────────────────┐
│  Hủy           Thêm GD          ⓧ  │  ← header (Cancel | Title | Close-X)
├─────────────────────────────────────┤
│                                     │
│      ─50.000  VND                   │  ← MoneyText size=display, currency
│                                     │     focus auto, numpad open
│                                     │
│     [ 1 ][ 2 ][ 3 ]                 │  ← native numpad qua inputMode=numeric
│     [ 4 ][ 5 ][ 6 ]                 │     (chỉ hiển thị nếu user dùng custom kbd)
│     [ 7 ][ 8 ][ 9 ]                 │
│     [000][ 0 ][ ⌫ ]                 │
│                                     │
├─────────────────────────────────────┤
│  Loại                               │
│  ⦿ Chi  ◯ Thu  ◯ Chuyển khoản    │  ← RadioGroup horizontal
├─────────────────────────────────────┤
│  Hũ                  Gợi ý: NEC ✦  │  ← suggestion từ tx tương tự
│  ┌──┬──┬──┬──┬──┬──┐                │
│  │NE│ED│LT│PL│FF│GI│                │  ← JarChip × 6, swipeable
│  └●─┴──┴──┴──┴──┴──┘                │     selected = NEC (default smart)
├─────────────────────────────────────┤
│  Mô tả                              │
│  ┌─────────────────────────────────┐│
│  │ Cà phê sáng                     ││  ← Input
│  └─────────────────────────────────┘│
│                                     │
│  Danh mục   ▾                       │  ← Select (autocomplete từ tx history)
│  Tài khoản  ▾                       │
├─────────────────────────────────────┤
│  Ngày  18/04   Giờ  09:30           │  ← collapsed default (now). Tap để edit.
├─────────────────────────────────────┤
│                                     │
│  ┌─────────────────────────────────┐│
│  │        Lưu giao dịch            ││  ← Button primary fullWidth size=lg
│  └─────────────────────────────────┘│
│                                     │
└─────────────────────────────────────┘
```

#### Desktop 1280px (Modal size=md, ~480px wide)

```
┌────────────────────────────────────────┐
│  Thêm giao dịch                    ⓧ  │
├────────────────────────────────────────┤
│                                        │
│   ─50.000  VND                         │  ← NumberInput large, autoFocus
│                                        │
│  Loại  ⦿ Chi  ◯ Thu  ◯ Chuyển         │
│                                        │
│  Hũ                                    │
│  ●NEC  ◯EDU  ◯LTSS ◯PLAY ◯FFA ◯GIVE  │
│                                        │
│  Mô tả  [ Cà phê sáng              ]  │
│  Danh mục [ Ăn uống          ▾    ]  │
│  Tài khoản[ MB Bank          ▾    ]  │
│                                        │
│  Ngày [18/04]  Giờ [09:30]            │
│                                        │
│              [ Hủy ] [ Lưu giao dịch ]│
└────────────────────────────────────────┘
```

**Components**: Modal/Drawer (auto-pick by viewport), NumberInput large, RadioGroup, JarChip swiper, Input, Select (autocomplete), Button.

**States**:
- `idle`: focus on amount NumberInput.
- `submitting`: Button loading=true, all inputs disabled, prevent close.
- `success`: toast.success "Đã lưu −50k vào NEC", auto close 600ms.
- `error`: inline `<Input error="...">` cho field invalid; non-field errors → toast.error với retry action.

**Interactions**:
- `Esc` close (with confirm if dirty).
- `⌘+Enter` save.
- Smart jar suggestion: lookup last 30 days của desc tương tự; nếu match >70% → pre-select jar.
- Description autocomplete: `<datalist>` hoặc Combobox từ recent unique descriptions.
- Sau save: KHÔNG tự đóng nếu user check "Thêm tiếp" (Switch dưới Button — chỉ desktop modal).

**A11y**: Modal `role="dialog" aria-labelledby` (title), focus trap, restore focus on close. RadioGroup `<fieldset><legend>` "Loại giao dịch".

---

### Screen 3 — Transactions (improve)

**Serves**: J3 (weekly review) chính, J5 phụ.

#### Mobile 375px

```
┌─────────────────────────────────────┐
│ ←  Giao dịch        Th 04/2026 ▾  ⊙│  ← TopBar back + title + month + filter
├─────────────────────────────────────┤
│  248 giao dịch                      │  ← caption count
├─────────────────────────────────────┤
│  🔍 Tìm kiếm...                     │  ← Input prefix=Search
├─────────────────────────────────────┤
│  [Tất cả] [Thu] [Chi] [Chuyển]     │  ← RadioGroup as chips
│  [+ Hũ] [+ Trạng thái]              │  ← active filter chips (bottom row)
├─────────────────────────────────────┤
│ ─── Hôm nay  Th hai 18/04 ────  −95k│  ← sticky day header với day total
│  🏠 NEC  Cà phê                     │
│             09:30           −50k    │
│  🏠 NEC  Grab                       │
│             08:15           −45k    │
│ ─── Hôm qua  CN 17/04 ────  +17,8M  │
│  💼 INC  Lương                      │
│             09:00       +18,0M     │
│  🏠 NEC  Đi chợ                     │
│             18:30          −180k    │
│ ─── Th bảy 16/04 ────────  −230k   │
│  🎉 PLAY Xem phim                   │
│             20:00          −230k    │
│  ↓ scroll thêm                       │
└─────────────────────────────────────┘
swipe-left tx row → 🖉  Sửa
swipe-right tx row → 🗑  Xóa (confirm toast)
tap tx row → mở Drawer detail
```

#### Desktop 1280px

```
┌────────────────────────────────────────────────────────────────────────────────┐
│ TopBar (giống Home)                                                            │
├────────────────────────────────────────────────────────────────────────────────┤
│  Giao dịch  Th 04/2026 ▾                                  ⊕ Thêm giao dịch    │
│  248 giao dịch                                                                 │
├────────────────────────────────────────────────────────────────────────────────┤
│  ┌──────┐ ┌──────┐ ┌──────────┐ ┌──────────┐                                   │
│  │ Tổng │ │ Tổng │ │ Được phép│ │ Số dư    │                                   │
│  │ thu  │ │ chi  │ │ chi      │ │ cuối kỳ  │                                   │
│  │+18M  │ │−13,8M│ │ +4,2M    │ │ 12,5M    │                                   │
│  └──────┘ └──────┘ └──────────┘ └──────────┘                                   │
├────────────────────────────────────────────────────────────────────────────────┤
│  🔍 [ Tìm kiếm... ]   [Tất cả|Thu|Chi|Chuyển]   [Hũ ▾]  [Trạng thái ▾]        │
├────────────────────────────────────────────────────────────────────────────────┤
│  Ngày        Mô tả               Hũ      Loại     Số tiền    Trạng thái       │
│ ── Hôm nay  Th hai 18/04 ──────────────────────────────────  −95k ──          │
│  18/04 09:30 Cà phê             🏠 NEC   Chi      −50.000   ● done            │
│  18/04 08:15 Grab               🏠 NEC   Chi      −45.000   ● done            │
│ ── Hôm qua  CN 17/04 ──────────────────────────────────────  +17,8M ──        │
│  17/04 09:00 Lương              💼 INC   Thu     +18,0M     ● done            │
│  ...                                                                           │
│                                                                                │
│  ‹  1  2  3  ...  13  ›                       (Trang 1 / 13, 248 kết quả)    │
└────────────────────────────────────────────────────────────────────────────────┘
hover row → background highlight
click row → right Drawer detail (giữ pattern)
```

**Components**: Input search, RadioGroup chip variant, FilterChip (compose Badge + close X), virtualized list (Phase E nếu >100), Drawer right (TransactionDetails giữ logic cũ, refactor primitives).

**States**:
- `loading`: Skeleton variant=table-row × 8.
- `empty filtered`: EmptyState "Không tìm thấy giao dịch" + "Xóa filter" action.
- `empty month`: EmptyState "Tháng này chưa có giao dịch" + "+ Thêm giao dịch" action → Quick Capture.
- `error`: Card với AlertTriangle + retry.

**Interactions**:
- Search debounce 400ms (giữ logic `Transactions.tsx:80-85`).
- Mobile swipe-left/right gesture qua `motion` library hoặc `useDrag` hook (không cần lib mới — CSS scroll-snap + JS).
- Click row → Drawer `TransactionDetails` (refactor sang primitives Phase D).

---

### Screen 4 — Jars (improve)

**Serves**: J6 (course correction) chính.

#### Mobile 375px

```
┌─────────────────────────────────────┐
│ ←  Hũ              Th 04/2026 ▾    │
├─────────────────────────────────────┤
│  Tổng phân bổ                       │
│  ▓▓▓▓▓▓▓▓▓░  90%   (chưa = 100%)   │  ← warning chip nếu ≠100
│  Còn 10% (1,8M) chưa phân bổ        │  ← color-warn nếu ≠100
├─────────────────────────────────────┤
│  ┌─────────────────────────────────┐│
│  │ 🏠 NEC   Thiết yếu              ││  ← Card interactive, tap = expand
│  │ 55%  ────●──────────  9,9M     ││     slider drag để đổi %
│  │ Đã chi 1,8M · còn 8,1M          ││
│  │ ▓▓▓▓░░░░ 18%                    ││
│  └─────────────────────────────────┘│
│  ┌─────────────────────────────────┐│
│  │ 📚 EDU   Giáo dục               ││
│  │ 10%  ──●──────────────  1,8M   ││
│  │ Đã chi 200k · còn 1,6M          ││
│  └─────────────────────────────────┘│
│  ... 4 hũ nữa                       │
├─────────────────────────────────────┤
│  ⓘ Tổng các hũ phải = 100%         │  ← persistent helper
│  ⊕ Tạo quỹ con                     │  ← Button secondary
└─────────────────────────────────────┘
tap card → expand inline để xem giao dịch của hũ + quỹ con
long-press slider → numeric input fallback
```

#### Desktop 1280px

```
┌────────────────────────────────────────────────────────────────────────────────┐
│ TopBar                                                                         │
├────────────────────────────────────────────────────────────────────────────────┤
│  Quản lý hũ  Th 04/2026 ▾              ⊕ Tạo quỹ con      Phân bổ: 90% ⚠     │
├──────────────────────────────────────────┬─────────────────────────────────────┤
│  ┌────────────────────────────────────┐  │  ┌───────────────────────────────┐ │
│  │ 🏠 NEC   Thiết yếu                 │  │  │ Detail: 🏠 NEC                │ │
│  │ 55%  ────●──────────  9,9M        │  │  │                               │ │
│  │ Đã chi 1,8M · còn 8,1M             │  │  │ Kế hoạch     9.900.000        │ │
│  │ ▓▓▓▓░░░░ 18%                       │  │  │ Cam kết        500.000        │ │
│  └────────────────────────────────────┘  │  │ Đã chi       1.800.000        │ │
│  ┌────────────────────────────────────┐  │  │ Còn lại      8.100.000        │ │
│  │ 📚 EDU   Giáo dục                  │  │  │ ──────────────────────────    │ │
│  │ 10%  ──●──────────────  1,8M      │  │  │ 3 quỹ con                     │ │
│  │ ...                                │  │  │ • Quỹ ăn  600k/1,2M           │ │
│  └────────────────────────────────────┘  │  │ • Quỹ xăng 500k/800k          │ │
│  ... 4 cards nữa                          │  │ • Quỹ điện 300k/500k          │ │
│                                           │  │                               │ │
│  ⓘ Tổng các hũ phải = 100%               │  │ Giao dịch tháng này (12)      │ │
│                                           │  │ • Cà phê    −50k              │ │
│                                           │  │ • Grab      −45k              │ │
│                                           │  └───────────────────────────────┘ │
└──────────────────────────────────────────┴─────────────────────────────────────┘
desktop = 2-col layout (list + sticky detail)
mobile = single col, inline expand
slider drag → live recompute total %; nếu drag 1 hũ thì hũ khác giữ nguyên (NOT auto-balance — user phải resolve)
```

**Components**: PercentSlider (custom, Phase A scope), JarChip, ProgressBar, Card interactive, MoneyText, Drawer/inline-expand.

**States**:
- `sum != 100`: persistent banner color-warn, save Button disabled.
- `loading`: Skeleton card × 6.
- `error`: per-card error chip.

**Interactions**:
- Drag slider → realtime preview, debounce 300ms before mutation.
- Long-press slider → open NumberInput modal (fallback for fine tune).
- Tap card → expand on mobile / select detail on desktop.

---

### Screen 5 — Budget Plan (simplify, refactor 1590 lines)

**Serves**: J4 (month close) + J6.

**Approach**: thay vì 1 page all-in-one, tách thành **3 tabs tuyến tính** = 3 phase mental model:
1. **Phân bổ** — set jar percent + base income (~30s).
2. **Khoản dự kiến** — list line items per jar (planner) (~2-5 phút).
3. **Tổng kết** — review actual vs planned, close period (~1 phút).

#### Mobile 375px (tabs)

```
┌─────────────────────────────────────┐
│ ←  Chi tiêu        Th 04/2026 ▾    │
├─────────────────────────────────────┤
│  [ Phân bổ ][ Khoản DK ][ Tổng kết]│  ← Tabs với underline + counter
│        ●                             │     (active = Phân bổ)
├─────────────────────────────────────┤
│                                     │
│  Tab 1: Phân bổ                     │
│  ─────────────────────              │
│  Thu nhập kỳ      18.000.000  🖉   │  ← editable inline
│  ↓                                   │
│  Tổng phân bổ     90% (16,2M)  ⚠   │
│  Chưa phân bổ     10% (1,8M)        │
│  ┌─────────────────────────────┐   │
│  │ NEC  ────●──────  55% 9,9M  │   │
│  │ EDU  ──●────────  10% 1,8M  │   │  ← inline slider per jar
│  │ ... (6 hũ)                   │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │       Lưu phân bổ           │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

```
Tab 2: Khoản dự kiến
┌─────────────────────────────────────┐
│  + Thêm khoản                        │
├─────────────────────────────────────┤
│  Hũ NEC (9,9M kế hoạch)             │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│  • Tiền nhà         5,0M planned    │
│      thực tế 5,0M  · OK             │
│  • Đi chợ           2,5M planned    │
│      thực tế 1,2M  · còn 1,3M       │
│  • Hóa đơn điện     500k planned    │
│      🔗 Định kỳ                     │
│  ─ tổng NEC: 8,0M planned ──        │
│  Hũ EDU (1,8M kế hoạch)             │
│  • Khóa học UX      1,0M  · 0% spent│
│  ...                                │
└─────────────────────────────────────┘
tap line → Drawer edit inline form
swipe → delete
```

```
Tab 3: Tổng kết
┌─────────────────────────────────────┐
│  Th 04/2026 — đang mở               │
│  ┌─────────────────────────────┐   │
│  │ Kế hoạch    18,0M           │   │
│  │ Đã chi      13,8M  (76%)    │   │
│  │ Cam kết        500k          │   │
│  │ ─────────────────            │   │
│  │ Còn lại      4,2M ●          │   │
│  └─────────────────────────────┘   │
│                                     │
│  6 hũ overview (compact list)       │
│  ✓ NEC   18% spent   ● OK          │
│  ✓ EDU   11% spent   ● OK          │
│  ⚠ PLAY 122%        ● Vượt 400k    │
│  ...                                │
│                                     │
│  Đầu tư tiến độ (FFA)               │
│  ▓▓▓░░░░ 30%  · 540k/1,8M          │
│                                     │
│  ┌─────────────────────────────┐   │
│  │  Đóng kỳ Th 04/2026        │   │  ← Button primary, disabled nếu unallocated > 0
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

#### Desktop 1280px

Cùng tabs, layout 2-col:
- Tab 1: left = jar list with sliders, right = pie preview + totals card.
- Tab 2: left = jar accordion of lines, right = sticky planner form (PlannedExpenseForm refactored).
- Tab 3: full width 4-card grid + close button.

**Refactor scope** (Phase E): tách `BudgetPlan.tsx` 1590 dòng → `src/views/budget-plan/{BudgetPlan,AllocationTab,LinesTab,SummaryTab,EditablePercent,JarDrillDown,PlannedExpenseForm,StatusBadge}.tsx`.

**States**: per-tab loading/error riêng. Close period: confirm modal nếu unallocated > 0 (replace `BudgetPlan.tsx:1109` alert).

---

### Screen 6 — Insights (NEW, embedded vào Home)

**Serves**: J5 (pattern spot) chính.

**Decision**: KHÔNG tạo route riêng. Render dưới dạng:
- Mobile Home: section "Top ăn tiền" (3-5 items) + "Xem hết →" link → bottom Drawer full insights.
- Desktop Home: card right column (sidebar) "Top ăn tiền" + "Xu hướng" mini chart.

#### Insights Drawer (full mobile / right Drawer desktop)

```
┌─────────────────────────────────────┐
│  Phân tích Th 04/2026          ⓧ   │
├─────────────────────────────────────┤
│  Top 5 danh mục ăn tiền             │
│  1. Ăn ngoài         PLAY  −1,2M   │  ← chart bar inline
│     ━━━━━━━━━━━━━━━━━━━━━━━━━━ 35%│
│  2. Đi chợ           NEC   −980k   │
│     ━━━━━━━━━━━━━━━━━━━━ 28%      │
│  3. Xăng xe          NEC   −560k   │
│     ━━━━━━━━━━━━ 16%               │
│  4. Cà phê           PLAY  −340k   │
│     ━━━━━━━ 10%                    │
│  5. Đăng ký          EDU   −200k   │
│     ━━━ 6%                         │
├─────────────────────────────────────┤
│  Xu hướng chi (4 tuần)              │
│  ▇▆▅▆  W1 W2 W3 W4                  │
│  W4 cao hơn TB 18%                  │
├─────────────────────────────────────┤
│  Hũ vượt mức 3 tháng liên tiếp      │
│  ⚠ PLAY:  Th2 +180k, Th3 +250k,    │
│           Th4 +400k                  │
│  Gợi ý: tăng 5% từ NEC/EDU         │
│  → [ Mở Phân bổ ]                   │
└─────────────────────────────────────┘
```

**Components**: Card, ProgressBar (inline trong row), MoneyText, JarChip badge inline.

**States**: loading=Skeleton; empty=EmptyState "Chưa đủ dữ liệu phân tích" (cần ≥30 transactions); error=Card error.

**Note**: data source = client-side reduce trên `useTransactions({ month, pageSize: 500 })` — KHÔNG cần endpoint mới. Phase F.

---

## 5. Decisions Log

Format: `D{n}. [decision]. Why: [rationale + ref Pn/Jn]. Tradeoff: [...]`.

**D1.** Routing: **giữ string switch + thêm URL hash routing (`#/overview`, `#/transactions/:id`)**. Why: P12 (CLAUDE.md doc inconsistency) + Quick Capture cần deep-link `#/add` để FAB hoạt động cross-page. Tradeoff: chưa lý tưởng như react-router nhưng zero deps; refactor sang TanStack Router là Phase G nếu cần.

**D2.** Form library: **giữ vanilla `useState`**, KHÔNG thêm react-hook-form. Why: P5 fix qua `<Input>` primitive, không phải qua form lib; size hiện tại dưới 10 form, vanilla đủ. Tradeoff: validation thủ công per-form; nếu Phase E thấy duplicate >50% logic thì add `zod` + thin custom hook.

**D3.** Toast lib: **`sonner` ^1.5 (3KB gzip)**. Why: P8 — replace 4 chỗ `alert/confirm`; sonner support `toast.promise`, `toast.confirm` qua wrapper. Tradeoff: +1 dep; alternative `react-hot-toast` cũng OK nhưng API kém hơn cho confirm flow.

**D4.** Modal portal: **React Portal native (`createPortal`)** + custom `<Modal>`/`<Drawer>` với focus-trap thủ công (`focus-trap-react` ^11 = 2KB) hoặc tự viết ~30 LOC. Why: P7 + P9; Radix Dialog mạnh nhưng kéo theo `@radix-ui/react-dialog` 8KB + 4 sub-deps. Tradeoff: phải maintain focus-trap logic; **[uncertain]** nếu user prefer prebuilt → swap sang Radix là 1 commit.

**D5.** Quick Capture entry: **Mobile = bottom-tab center FAB; Desktop = TopBar `⊕` button + `⌘K`/`Ctrl+K` shortcut**. Why: J1 <10s; mobile thumb-zone yêu cầu FAB; desktop power user familiar với ⌘K; cả 2 entry cùng route đến `<QuickCapture>` component qua URL hash `#/add`. Tradeoff: 2 entry pattern; mitigate bằng cùng 1 component.

**D6.** Number input: **custom `<NumberInput>` với formatting on-blur**. Why: J1 — `type="number"` không format thousand sep, hidden mobile spinner; cần currency suffix + tabular display. Tradeoff: ~50 LOC; alternative `react-number-format` 8KB không justify.

**D7.** Jar slider: **custom drag-handle component dựa trên `<input type="range">` styled** (NOT auto-balance). Why: J6 — 6 sliders sum = 100% với cảnh báo, KHÔNG tự cân bằng để user kiểm soát. Tradeoff: ~80 LOC custom; alternatives `react-range` 12KB không cần thiết.

**D8.** Date grouping ở Transactions: **client-side `Map<string, Transaction[]>` group by `tx.date`**, render `<StickyDateHeader>` mỗi group. Why: J3 + sticky header pattern phổ biến (YNAB, Apple Wallet); endpoint `/transactions` đã sort `datetime_desc`. Tradeoff: render cost với >100 rows; mitigate via virtualization (Phase E nếu cần).

**D9.** Mobile nav: **bottom tab 5-slot với center FAB raised** (Home / Transactions / **+Add** / Jars / More). Why: J1 thumb-zone + J2 glance check; thay current TopBar mobile menu (`TopBar.tsx:103-125`). Tradeoff: TopBar mobile chỉ còn month picker + theme toggle; "More" → drawer chứa Goals, Debts, Budget Plan, Settings.

**D10.** Theme strategy: **Tailwind v4 `@theme` tokens duy nhất**, xóa toàn bộ `.dark .bg-slate-50` overrides ở `index.css:69-309`. Why: P10 — current 120-LOC override patch dễ rotten. Tradeoff: phải migrate 77 hex literal trong 12 files (ground work cho Phase B); migration tracked per-file.

**D11.** Empty/Error/Loading: **3 primitives `<EmptyState>`, `<ErrorCard>`, `<Skeleton>`**. Why: P11 — current ad-hoc spinner centered + plain text. Tradeoff: thêm 3 components; bù lại mọi screen có cùng trải nghiệm.

**D12.** Animation library: **drop `motion ^12.23.24` (chưa dùng), CSS-only animations**. Why: app data-dense, không animation-heavy; CSS đủ cho fade/slide/scale. Tradeoff: lose spring physics & gesture; nếu later cần (vd swipe-to-delete) thì add lại — **[uncertain]** alternative giữ `motion` nếu Phase C cần gesture cho swipe-tx-row.

**D13.** Self-host Inter font: **convert CDN import → local woff2** (`/public/fonts/Inter-{400,500,600,700}.woff2`). Why: P14 (FCP delay 100ms+) + offline preview fail. Tradeoff: thêm 4 font files (~80KB total); mitigate qua `font-display: swap`.

**D14.** Dead code removal: **xóa `Header.tsx` (70 dòng) + `Sidebar.tsx` (62 dòng) ở Phase F**. Why: P3 — 132 LOC dead, gây nhầm lẫn. Tradeoff: rủi ro nếu có code chưa-merge tham chiếu → grep verify trước khi xóa.

**D15.** Currency format primitive: **giữ logic `formatCurrency` + `formatSignedAmount` ở `utils.ts:16-55`**, wrap trong `<MoneyText>`. Why: utility hiện tại đúng + có test mềm qua usage. Tradeoff: không refactor logic cũ; chỉ wrap UI.

**D16.** Quick Capture smart suggestion: **lookup last 30d của desc tương tự bằng simple substring match (client-side, từ TanStack Query cache)**, NOT ML. Why: J1 + zero infra cost; cache đã có. Tradeoff: accuracy ~70%; user vẫn override qua jar chips.

**D17.** Insights data source: **client-side reduce từ `useTransactions({ month, pageSize: 500 })`**, KHÔNG endpoint mới. Why: API contract giữ; max 500 rows/tháng đủ cho top-N + week trends. Tradeoff: nếu month >500 rows thì bias top — flag "có thể không đầy đủ" trong UI.

**D18.** Goals/Debts redesign: **Phase D chỉ swap primitives, KHÔNG redesign sâu**. Why: prompt scope giới hạn 6 screens chính; Goals/Debts screens hiện đã work + không phải core J1-J6. Tradeoff: sau Phase D vẫn còn pattern cũ; ghi vào TODO Phase G.

**Mapping pain points → decisions** (verify đủ P1-P14):
- P1 (tokens không dùng) → D10
- P2 (3 jar palettes) → Section 3 (jars.ts)
- P3 (dead code) → D14
- P4 (BudgetPlan 1590) → Phase E + Screen 5 tabs
- P5 (form duplicate) → Section 2 Input + D2
- P6 (button duplicate) → Section 2 Button
- P7 (modal duplicate) → D4 + Section 2 Modal
- P8 (alert/confirm) → D3
- P9 (a11y missing) → D4 + Phase F
- P10 (dark override hack) → D10
- P11 (no skeleton system) → D11
- P12 (CLAUDE.md sai) → D1 + post-Phase A note
- P13 (mobile gaps) → D9 + Screen 1-6 mobile wireframes
- P14 (CDN font) → D13

---

## 6. Migration Order

6 phases sequential. Mỗi phase: scope (file paths cụ thể), acceptance test (binary pass/fail), estimated LOC delta.

---

### Phase A — Design tokens + Base primitives

**Scope** (touch + create files):
- ✏ `src/index.css` — replace `@theme` block với tokens Section 1; xóa toàn bộ `.dark .bg-slate-50 {...}` overrides (`index.css:69-309`); self-host Inter.
- ✏ `package.json` — add `sonner` ^1.5; remove `@google/genai`, `better-sqlite3`, `express`, `dotenv`, `motion` (xác nhận unused trước).
- ➕ `src/components/ui/Button.tsx`
- ➕ `src/components/ui/IconButton.tsx`
- ➕ `src/components/ui/Input.tsx`, `NumberInput.tsx`, `Select.tsx`, `Textarea.tsx`, `Switch.tsx`, `Checkbox.tsx`, `RadioGroup.tsx`
- ➕ `src/components/ui/Card.tsx`
- ➕ `src/components/ui/Modal.tsx`, `Drawer.tsx`
- ➕ `src/components/ui/Badge.tsx`
- ➕ `src/components/ui/ProgressBar.tsx`
- ➕ `src/components/ui/MoneyText.tsx`
- ➕ `src/components/ui/EmptyState.tsx`
- ➕ `src/components/ui/Skeleton.tsx`
- ➕ `src/components/ui/Toaster.tsx` (sonner wrapper)
- ➕ `src/components/ui/index.ts` (barrel exports)
- ➕ `public/fonts/Inter-{400,500,600,700}.woff2`

**Acceptance test**:
- [ ] `npm run build` pass
- [ ] `npm run lint` (tsc --noEmit) pass
- [ ] Storybook (nếu setup) hoặc dev page `/__ui` render mọi primitive với 3 size + tất cả variants light + dark
- [ ] Lighthouse perf score không giảm >5 điểm so với baseline

**Estimated LOC delta**: +1200 LOC (16 primitives × ~70 LOC avg + index + tokens), -240 LOC (CSS overrides), net **+960**.

**Stop & Ask before**: cài deps mới, xóa file dependency.

---

### Phase B — Jar identity + Token migration

**Scope**:
- ➕ `src/lib/jars.ts` (Section 3 nội dung)
- ✏ `src/components/ExpenseStructureChart.tsx` — xóa `JAR_COLORS`+`FALLBACK_PALETTE` (l.9-22), import từ `jars.ts`
- ✏ `src/views/Jars.tsx` — xóa `JAR_COLORS`+`JAR_ICON_BG`+`getJarColor`+`getJarIconBg` (l.40-65), use `<JarChip>`
- ✏ `src/views/BudgetPlan.tsx` — xóa `JAR_STYLES`+`getJarStyle` (l.59-73), use `<JarChip>` + `getJar()`
- ✏ Replace 77 hex literal `bg-[#hex]` ở 12 files bằng utility class từ tokens (vd `bg-surface`, `bg-surface-alt`):
  - `src/App.tsx:31` (`bg-[#0c1222]` → `bg-surface-alt`)
  - `src/views/Overview.tsx`: 7 occurrences
  - `src/views/Transactions.tsx`: 8
  - `src/views/Jars.tsx`: 16
  - `src/views/BudgetPlan.tsx`: 12
  - `src/views/Debts.tsx`: 21
  - ... per CLAUDE.UI.md Section 2.1

**Acceptance test**:
- [ ] grep `bg-\[#[0-9a-fA-F]+\]` trong `src/` → 0 matches
- [ ] grep `JAR_COLORS|JAR_STYLES|JAR_ICON_BG` → only `src/lib/jars.ts`
- [ ] Visual regression: screenshot `/overview`, `/jars`, `/budget` light + dark — jar PLAY luôn cam, FFA luôn amber, GIVE luôn pink ở mọi page
- [ ] `npm run build` pass

**Estimated LOC delta**: +180 (jars.ts), -200 (3 cũ), net **-20** với clarity tăng đáng kể.

**Stop & Ask before**: nếu phát hiện jar key ngoài 6 keys (`INCOME` ở `Jars.tsx:255-260`), confirm UX cho fallback.

---

### Phase C — Migrate Home + Quick Capture (NEW) + Transactions

**Scope**:
- ✏ `src/views/Overview.tsx` → rewrite thành Home theo Wireframe Section 4.1
  - Replace HeroCard, summary cards, jar grid, recent tx bằng primitives Phase A
  - Add Top-5 categories mini section (J5)
  - Remove inline classNames soup
- ➕ `src/views/QuickCapture.tsx` (NEW, ~250 LOC)
  - Composes NumberInput, RadioGroup, JarChip swiper, Input, Select, Button
  - Smart suggestion logic dựa trên `useQueryClient.getQueriesData(['transactions'])`
  - Hash route `#/add`
- ✏ `src/App.tsx`:
  - Add hash routing parse (~20 LOC) → drive `currentView`
  - Mount `<QuickCapture>` khi hash = `#/add`
  - Mount `<Toaster />`
- ➕ `src/components/BottomTab.tsx` (mobile nav, ~80 LOC)
- ✏ `src/components/TopBar.tsx`:
  - Mobile: collapse nav (chỉ giữ logo + month + theme), bottom tab thay nav
  - Desktop: thêm `⊕ Thêm GD` button + `⌘K` shortcut listener
- ✏ `src/views/Transactions.tsx` → rewrite theo Wireframe Section 4.3
  - Group-by-day rendering
  - FilterChip composition
  - Mobile swipe gesture (chọn `motion` lib lại nếu D12 reverse, hoặc CSS scroll-snap)
  - `<TransactionDetails>` refactor sang Drawer primitive
- ✏ `src/components/TransactionDetails.tsx` → use Drawer, MoneyText, Badge, Card primitives

**Acceptance test**:
- [ ] J1: từ Home, FAB tap → modal mở → input 50k → chọn NEC → nhập "test" → save → toast.success → back to Home, balance cập nhật. End-to-end <10s.
- [ ] J2: open Home → "Còn chi được" số rõ trong viewport đầu tiên không scroll.
- [ ] J3: Transactions → swipe filter chip "Hũ NEC" → list filter; sticky day header dính khi scroll.
- [ ] Lighthouse a11y >=95 cho /overview, /transactions
- [ ] Mobile bottom tab visible mọi page, FAB raised center
- [ ] Dark mode cả 3 screen identical visual heirarchy

**Estimated LOC delta**: +400 (QuickCapture, BottomTab, refactored views) – 600 (remove inline soup), net **-200**.

**Stop & Ask before**: thay đổi route logic ở App.tsx (impact mọi view).

---

### Phase D — Migrate Jars + Goals + Debts (primitive swap)

**Scope** — KHÔNG redesign sâu, chỉ swap primitives + áp dụng patterns Phase A/B:
- ✏ `src/views/Jars.tsx`:
  - Wireframe Section 4.4 layout
  - Replace `CreateFundForm` inline (l.67-206) với `<Modal>` primitive
  - PercentSlider component mới (custom, ~80 LOC ở `src/components/ui/PercentSlider.tsx`)
- ✏ `src/views/Goals.tsx` (898 LOC):
  - Replace `CreateGoalForm`, `EditGoalForm`, `ContributeForm`, `GoalDetailPanel`, `SummaryCard` (5 inline components) bằng primitives
  - Replace `alert()` ở l.446 bằng `toast.success`
  - StatusBadge ở l.42 → use `<Badge variant="status-*">` (avoid name conflict với BudgetPlan)
- ✏ `src/views/Debts.tsx` (451 LOC):
  - Replace `confirm()` ở l.439 bằng `toast.confirm`
  - Modal forms swap

**Acceptance test**:
- [ ] grep `alert\(|confirm\(|prompt\(` trong `src/views/{Jars,Goals,Debts}.tsx` → 0 matches
- [ ] grep `fixed inset-0 bg-slate-900` trong `src/views/{Jars,Goals,Debts}.tsx` → 0 matches (all → Modal primitive)
- [ ] grep `rounded-lg border border-slate-300` → 0 matches (all → `<Input>`)
- [ ] LOC reduction: Jars −150, Goals −350, Debts −80 (target)
- [ ] Visual no regression on existing flows

**Estimated LOC delta**: -580 (giảm vì primitives extract).

**Stop & Ask before**: nếu PercentSlider phức tạp hơn dự kiến >120 LOC, ask trước khi tiếp.

---

### Phase E — Refactor BudgetPlan (1590 → module)

**Scope**:
- ➕ `src/views/budget-plan/index.tsx` (new entry, ~150 LOC)
- ➕ `src/views/budget-plan/AllocationTab.tsx` (~250 LOC)
- ➕ `src/views/budget-plan/LinesTab.tsx` (~350 LOC)
- ➕ `src/views/budget-plan/SummaryTab.tsx` (~200 LOC)
- ➕ `src/views/budget-plan/EditablePercent.tsx` (extract from `BudgetPlan.tsx:259-316`)
- ➕ `src/views/budget-plan/JarDrillDown.tsx` (extract from l.320-360)
- ➕ `src/views/budget-plan/PlannedExpenseForm.tsx` (extract from l.377+)
- ➕ `src/views/budget-plan/StatusBadge.tsx` (rename to `BudgetStatusBadge` để tránh trùng `Goals.tsx:42`)
- 🗑 `src/views/BudgetPlan.tsx` (1590 LOC) → delete sau khi imports update
- ✏ `src/App.tsx:11,44` update import path

**Acceptance test**:
- [ ] No file >400 LOC trong `src/views/budget-plan/`
- [ ] `BudgetPlan.tsx` không tồn tại
- [ ] All flows: edit percent / add line / close period / drill down — hoạt động như cũ
- [ ] Replace `alert()` ở l.1109 + `window.confirm()` ở l.704 bằng modal/toast
- [ ] Tabs Phân bổ / Khoản DK / Tổng kết switch smooth, state preserve khi tab switch trong cùng month

**Estimated LOC delta**: 0 net (1590 chia 7 files), nhưng max-per-file <400 → maintainability tăng.

**Stop & Ask before**: bắt đầu xóa `BudgetPlan.tsx` (point of no return); confirm all imports updated.

---

### Phase F — A11y baseline + cleanup

**Scope**:
- 🗑 `src/components/Header.tsx` (70 LOC, dead — verified P3)
- 🗑 `src/components/Sidebar.tsx` (62 LOC, dead)
- ✏ Add `aria-label` cho icon-only buttons ở:
  - `TopBar.tsx:84,93` (theme toggle, mobile menu)
  - `TransactionDetails.tsx:39` (close)
  - All `<IconButton>` usages (TypeScript already enforce)
- ✏ Modal a11y verify: focus-trap working, Escape close, focus restore, `aria-modal`
- ✏ Charts: thêm `accessibilityLayer` prop cho recharts (≥2.10) ở `IncomeExpenseChart.tsx`, `ExpenseStructureChart.tsx`, `JarStats.tsx`
- ✏ Status indicators: thêm icon hoặc text bên cạnh color-only state ở `Transactions.tsx:264-268`
- ➕ Insights component: render trong `Home` Drawer (Section 4.6)
- ✏ `package.json` add `eslint-plugin-jsx-a11y` + run pass
- 📄 Update `CLAUDE.md` fix `/api/v1/` → `/api/` (P12)

**Acceptance test**:
- [ ] `npx eslint --plugin jsx-a11y src/` 0 errors
- [ ] Lighthouse a11y >=95 mọi screen
- [ ] Manual screen reader (NVDA/VoiceOver) sweep: tab order logical, modal trap working, charts có alt
- [ ] grep `Header\|Sidebar` ở `src/` → 0 matches except `TopBar`/`Sidebar` if used in BottomTab description (verify)
- [ ] CLAUDE.md updated với base URL đúng

**Estimated LOC delta**: -132 (dead) + 50 (a11y attrs) = **-82**.

**Stop & Ask before**: xóa `Header.tsx`/`Sidebar.tsx` (final verification grep clean).

---

### Total estimated impact

| Metric | Before | After | Δ |
|---|---|---|---|
| Total src LOC | ~7,233 | ~7,400 | +167 (primitives net offset by view shrink) |
| Files >400 LOC | 4 (BudgetPlan 1590, Goals 898, Jars 573, Debts 451) | 1 (Goals 540 sau Phase D) | -3 |
| Hex literal in JSX | 77 | 0 | -77 |
| `alert()`/`confirm()` calls | 4 | 0 | -4 |
| Dead components | 2 (Header, Sidebar) | 0 | -2 |
| Duplicated jar palettes | 3 | 1 (jars.ts) | -2 |
| UI primitives | 0 | 16 | +16 |
| `aria-*` attribute coverage | 7 (1 file) | ≥80 (all views) | +73 |
| Screens with mobile bottom nav | 0 | 6 | +6 |
| New screens | — | 2 (QuickCapture, Insights) | +2 |

---

## Migration Pre-flight (chạy 1 lần trước Phase A)

- [ ] Tag git baseline: `git tag pre-redesign-2026-04-30`
- [ ] Branch: `git checkout -b redesign/phase-a-tokens-primitives`
- [ ] Confirm `motion`, `@google/genai`, `better-sqlite3`, `express`, `dotenv` thực sự unused (grep imports)
- [ ] Verify backup CLAUDE.md (chỉ ghi đè P12 fix ở Phase F)

---

## Open questions trước khi sang Phase A

1. **Confirm visual direction**: "Quiet & Confident" như Section 1.1 default? Hay user muốn thử direction khác (vd: warmer earthy palette)?
2. **Confirm Quick Capture entry**: bottom-FAB mobile + ⌘K desktop OK? Hay user muốn always-visible TopBar `⊕`?
3. **Confirm Goals/Debts scope**: chỉ swap primitives ở Phase D, KHÔNG redesign sâu — đồng ý hay user muốn redesign cả 2 views này?
4. **Confirm `motion` lib**: drop (D12) hay giữ cho swipe gesture ở Transactions?
5. **Confirm dependency cleanup**: drop `@google/genai`, `better-sqlite3`, `express`, `dotenv` từ `package.json` (suspected unused) — tôi verify trước Phase A?

---

**Next step**: review spec này. Khi OK, paste `CLAUDE.UI.SPEC.md` + nói "implement Phase A" trong session mới để code design tokens + 16 primitives + dev page `/__ui`.
