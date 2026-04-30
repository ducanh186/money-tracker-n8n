import { useEffect, useState } from 'react';
import { X, Delete } from 'lucide-react';
import { cn } from '../lib/utils';
import { useDarkMode } from '../lib/hooks';
import { getJar, JAR_ORDER } from '../lib/jars';
import type { JarKey } from '../lib/jars';

type Flow = 'expense' | 'income' | 'transfer';

const full = (v: number): string => v.toLocaleString('vi-VN');

export default function AddTransactionModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [amount, setAmount] = useState('50000');
  const [flow, setFlow] = useState<Flow>('expense');
  const [jar, setJar] = useState<JarKey>('NEC');
  const [desc, setDesc] = useState('');
  const isDark = useDarkMode();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const tap = (k: string) => {
    setAmount((a) => {
      if (k === 'back') return a.slice(0, -1) || '0';
      if (k === '000') return a === '0' ? '0' : a + '000';
      return a === '0' ? k : a + k;
    });
  };

  const display = parseInt(amount || '0', 10);
  const sign = flow === 'expense' ? '−' : flow === 'income' ? '+' : '';
  const flowColor =
    flow === 'expense'
      ? 'text-orange-600 dark:text-orange-400'
      : flow === 'income'
      ? 'text-green-600 dark:text-green-400'
      : 'text-blue-600 dark:text-blue-400';

  const handleSave = () => {
    if (display <= 0) {
      alert('Vui lòng nhập số tiền > 0');
      return;
    }
    alert(
      `Lưu giao dịch (UI demo):\n` +
        `${sign}${full(display)} ₫ · ${flow}\n` +
        `Hũ: ${flow === 'income' ? '—' : jar}\n` +
        `Mô tả: ${desc || '(trống)'}\n\n` +
        `Lưu ý: API POST /transactions chưa sẵn. Vui lòng dùng MacroDroid/Telegram để tạo GD thật.`
    );
    onClose();
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-tx-title"
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[min(480px,calc(100vw-32px))] max-h-[calc(100vh-32px)] overflow-y-auto bg-white dark:bg-[#1a2433] rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-700">
          <h3
            id="add-tx-title"
            className="text-lg font-bold text-slate-900 dark:text-white"
          >
            Thêm giao dịch
          </h3>
          <button
            onClick={onClose}
            aria-label="Đóng"
            className="size-9 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors cursor-pointer"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Amount display */}
        <div className={cn('text-center py-6 text-4xl font-extrabold tabular-nums', flowColor)}>
          {sign}
          {full(display)}
          <span className="text-base font-semibold text-slate-400 dark:text-slate-500 ml-1.5">
            VND
          </span>
        </div>

        {/* Flow toggle */}
        <div className="px-5">
          <div className="inline-flex w-full items-center bg-slate-100 dark:bg-[#0c1222] rounded-lg p-0.5 mb-4">
            {(['expense', 'income', 'transfer'] as Flow[]).map((f) => (
              <button
                key={f}
                onClick={() => setFlow(f)}
                className={cn(
                  'flex-1 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer',
                  flow === f
                    ? 'bg-white dark:bg-[#1a2433] text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                )}
              >
                {f === 'expense' ? 'Chi' : f === 'income' ? 'Thu' : 'Chuyển khoản'}
              </button>
            ))}
          </div>
        </div>

        {/* Jar pick (hide on income) */}
        {flow !== 'income' && (
          <div className="px-5 mb-4">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Hũ
            </div>
            <div className="flex gap-2 flex-wrap">
              {JAR_ORDER.map((k) => {
                const j = getJar(k as JarKey);
                if (!j) return null;
                const Icon = j.icon;
                const selected = jar === k;
                const fg = isDark ? j.hex_dark : j.hex_light;
                const bg = isDark ? j.bg_dark : j.bg_light;
                return (
                  <button
                    key={k}
                    onClick={() => setJar(k as JarKey)}
                    className={cn(
                      'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer',
                      selected
                        ? 'border-current ring-2 ring-current/20 shadow-sm'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                    )}
                    style={selected ? { color: fg, backgroundColor: bg } : undefined}
                  >
                    <Icon className="size-3.5" />
                    {j.key}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Description */}
        <div className="px-5 mb-4">
          <label
            htmlFor="add-tx-desc"
            className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2"
          >
            Mô tả
          </label>
          <input
            id="add-tx-desc"
            type="text"
            placeholder="Ví dụ: Cà phê sáng"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            className="w-full bg-slate-50 dark:bg-[#0c1222] border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Numpad */}
        <div className="px-5 mb-4">
          <div className="grid grid-cols-3 gap-2">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '000', '0', 'back'].map((k) => (
              <button
                key={k}
                onClick={() => tap(k)}
                className="h-11 lg:h-12 flex items-center justify-center rounded-lg bg-slate-50 dark:bg-[#0c1222] hover:bg-slate-100 dark:hover:bg-slate-700/60 text-base font-semibold text-slate-900 dark:text-white border border-slate-100 dark:border-slate-700 transition-colors cursor-pointer active:scale-95"
                aria-label={k === 'back' ? 'Xoá ký tự' : k}
              >
                {k === 'back' ? <Delete className="size-4" /> : k}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="px-5 pb-5 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-[#0c1222] hover:bg-slate-200 dark:hover:bg-slate-700/60 transition-colors cursor-pointer"
          >
            Hủy
          </button>
          <button
            onClick={handleSave}
            className="flex-[2] px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors cursor-pointer"
          >
            Lưu giao dịch
          </button>
        </div>
      </div>
    </>
  );
}
