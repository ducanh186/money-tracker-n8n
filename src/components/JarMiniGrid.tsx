import { useBudgetStatus, useDarkMode } from '../lib/hooks';
import { getJar, JAR_ORDER } from '../lib/jars';
import type { JarKey } from '../lib/jars';

const compact = (v: number): string => {
  const a = Math.abs(v);
  if (a >= 1_000_000) return `${(v / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (a >= 1_000) return `${Math.round(v / 1_000)}K`;
  return v.toLocaleString('vi-VN');
};

export default function JarMiniGrid({ month }: { month: string }) {
  const { data: budgetStatus } = useBudgetStatus(month);
  const isDark = useDarkMode();

  if (!budgetStatus || budgetStatus.jars.length === 0) {
    return null;
  }

  const hasBudgetPlan = budgetStatus.plan?.has_period ?? budgetStatus.has_period;
  const byKey = new Map(budgetStatus.jars.map((j) => [j.key, j]));

  return (
    <div className="bg-white dark:bg-[#1a2433] rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-4 lg:p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {hasBudgetPlan ? '6 hũ tháng này' : 'Gợi ý 6 hũ'}
        </h3>
        <a
          href="#jars"
          onClick={(e) => {
            e.preventDefault();
            window.location.hash = '#jars';
          }}
          className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
        >
          Quản lý hũ →
        </a>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {JAR_ORDER.map((k) => {
          const jar = getJar(k as JarKey);
          if (!jar) return null;
          const data = byKey.get(k);
          const planned = data?.planned ?? 0;
          const spent = data?.spent ?? 0;
          const remain = data?.available ?? (planned - spent);
          const usage = planned > 0 ? Math.round((spent / planned) * 100) : 0;
          const status: 'over' | 'warn' | 'ok' = remain < 0 ? 'over' : usage >= 80 ? 'warn' : 'ok';
          const dotColor =
            status === 'over' ? '#ef4444' : status === 'warn' ? '#f59e0b' : '#10b981';
          const Icon = jar.icon;
          const bgColor = isDark ? jar.bg_dark : jar.bg_light;
          const fgColor = isDark ? jar.hex_dark : jar.hex_light;
          const barColor = status === 'over' ? '#ef4444' : isDark ? jar.hex_dark : jar.hex_light;

          return (
            <div
              key={k}
              className="flex flex-col gap-2 p-2.5 lg:p-3 rounded-xl bg-slate-50 dark:bg-[#0c1222] border border-slate-100 dark:border-slate-700"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="size-7 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: bgColor, color: fgColor }}
                >
                  <Icon className="size-3.5" />
                </span>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {jar.key}
                </span>
              </div>
              <div className="text-[13px] font-semibold tabular-nums text-slate-900 dark:text-white truncate">
                {compact(spent)}
                <span className="text-slate-400 dark:text-slate-500 font-normal"> / {compact(planned)}</span>
              </div>
              <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${Math.min(100, usage)}%`, backgroundColor: barColor }}
                />
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                <span className="size-1.5 rounded-full shrink-0" style={{ backgroundColor: dotColor }} />
                <span className="truncate">
                  {remain < 0
                    ? `vượt ${compact(Math.abs(remain))}`
                    : usage >= 80
                    ? 'gần hết'
                    : `còn ${compact(remain)}`}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
