import { Store, ArrowUpRight, ArrowDownLeft, ArrowLeftRight, Calendar, Clock, Tag, Wallet, Building2, FileText, Hash } from 'lucide-react';
import { formatSignedAmount } from '../lib/utils';
import type { Transaction } from '../lib/types';

function flowLabel(flow: string | null) {
  switch (flow) {
    case 'income': return 'Thu nhập';
    case 'expense': return 'Chi tiêu';
    case 'transfer': return 'Chuyển khoản';
    default: return flow ?? '—';
  }
}

function FlowIcon({ flow }: { flow: string | null }) {
  switch (flow) {
    case 'income': return <ArrowDownLeft className="size-4" />;
    case 'expense': return <ArrowUpRight className="size-4" />;
    case 'transfer': return <ArrowLeftRight className="size-4" />;
    default: return null;
  }
}

function flowColors(flow: string | null) {
  switch (flow) {
    case 'income':
      return { ring: 'border-green-200 dark:border-green-900/40', bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-700 dark:text-green-400' };
    case 'expense':
      return { ring: 'border-red-200 dark:border-red-900/40', bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-700 dark:text-red-400' };
    case 'transfer':
      return { ring: 'border-blue-200 dark:border-blue-900/40', bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-700 dark:text-blue-400' };
    default:
      return { ring: 'border-slate-200 dark:border-slate-700', bg: 'bg-slate-100 dark:bg-slate-700', text: 'text-slate-700 dark:text-slate-300' };
  }
}

function FieldRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Tag;
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="flex items-start gap-3 py-2 border-b border-slate-100 dark:border-slate-700 last:border-b-0">
      <Icon className="size-4 mt-0.5 text-slate-400 dark:text-slate-500 shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {label}
        </div>
        <div className="text-sm text-slate-900 dark:text-white break-words">
          {value || '—'}
        </div>
      </div>
    </div>
  );
}

export default function TxDetailPanel({ tx }: { tx: Transaction | null }) {
  if (!tx) {
    return (
      <aside className="hidden min-[1460px]:flex min-[1460px]:flex-col min-[1460px]:items-center min-[1460px]:justify-center bg-white dark:bg-[#1a2433] rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm p-6 text-center min-h-[400px]">
        <div className="size-12 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center mb-3">
          <Store className="size-5 text-slate-400 dark:text-slate-500" />
        </div>
        <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">
          Chi tiết giao dịch
        </h4>
        <p className="text-xs text-slate-400 dark:text-slate-500 max-w-[220px]">
          Click một dòng giao dịch để xem chi tiết ở đây.
        </p>
      </aside>
    );
  }

  const colors = flowColors(tx.flow);
  const sign = tx.flow === 'income' ? '+' : tx.flow === 'expense' ? '−' : '';
  const amountColor =
    tx.flow === 'income'
      ? 'text-green-600 dark:text-green-400'
      : tx.flow === 'expense'
      ? 'text-red-600 dark:text-red-400'
      : 'text-blue-600 dark:text-blue-400';

  return (
    <aside className="hidden min-[1460px]:flex min-[1460px]:flex-col bg-white dark:bg-[#1a2433] rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm sticky top-6 max-h-[calc(100vh-7rem)] overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700">
        <h4 className="text-sm font-bold text-slate-900 dark:text-white">Chi tiết giao dịch</h4>
      </div>
      <div className="flex-1 overflow-y-auto p-5">
        <div className="flex flex-col items-center text-center mb-5">
          <div className={`size-12 rounded-full flex items-center justify-center mb-2 border ${colors.ring} ${colors.bg} ${colors.text}`}>
            <FlowIcon flow={tx.flow} />
          </div>
          <div className={`text-2xl font-extrabold tabular-nums ${amountColor}`}>
            {sign}
            {formatSignedAmount(Math.abs(tx.amount_vnd), null)}
          </div>
          <span
            className={`mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${colors.bg} ${colors.text}`}
          >
            {flowLabel(tx.flow)}
          </span>
        </div>

        <div className="flex flex-col">
          <FieldRow icon={FileText} label="Mô tả" value={tx.description} />
          <FieldRow icon={Tag} label="Danh mục" value={tx.category} />
          <FieldRow icon={Wallet} label="Hũ" value={tx.jar} />
          <FieldRow icon={Building2} label="Tài khoản" value={tx.account} />
          <FieldRow icon={Calendar} label="Ngày" value={tx.date} />
          <FieldRow icon={Clock} label="Giờ" value={tx.time} />
          <FieldRow icon={Hash} label="Khoá idempotency" value={tx.idempotency_key} />
        </div>
      </div>
    </aside>
  );
}
