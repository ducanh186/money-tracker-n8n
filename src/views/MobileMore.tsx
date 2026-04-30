import { CreditCard, Crosshair, Sparkles, Target } from 'lucide-react';

type MobileMoreProps = {
  monthLabel: string;
  onNavigate: (view: string) => void;
  onOpenInsights: () => void;
};

const items = [
  {
    id: 'budget',
    label: 'Kế hoạch chi tiêu',
    description: 'Phân bổ thu nhập, khoản dự kiến và trạng thái đóng kỳ',
    icon: Target,
    tone: 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400',
  },
  {
    id: 'goals',
    label: 'Quỹ & Mục tiêu',
    description: 'Theo dõi mục tiêu tiết kiệm, deadline và tiến độ đóng góp',
    icon: Crosshair,
    tone: 'bg-violet-100 text-violet-600 dark:bg-violet-500/20 dark:text-violet-300',
  },
  {
    id: 'debts',
    label: 'Nợ',
    description: 'Dư nợ hiện tại, lịch thanh toán và cảnh báo đến hạn',
    icon: CreditCard,
    tone: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300',
  },
  {
    id: 'insights',
    label: 'Phân tích',
    description: 'Top ăn tiền, xu hướng tháng và giao dịch gần đây',
    icon: Sparkles,
    tone: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300',
  },
];

export default function MobileMore({ monthLabel, onNavigate, onOpenInsights }: MobileMoreProps) {
  return (
    <div className="flex flex-col gap-4 max-w-7xl mx-auto">
      <div className="rounded-[24px] border border-slate-200/80 bg-white/90 p-5 shadow-sm backdrop-blur-sm dark:border-slate-700/80 dark:bg-[#111827]/85">
        <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">
          More
        </span>
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Tiện ích tháng</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Mở các màn nâng cao cho {monthLabel.toLowerCase()} và xem snapshot phân tích nhanh trên mobile.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {items.map((item) => {
          const Icon = item.icon;
          const onClick = item.id === 'insights' ? onOpenInsights : () => onNavigate(item.id);
          return (
            <button
              key={item.id}
              onClick={onClick}
              className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white px-4 py-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md dark:border-slate-700 dark:bg-[#1a2433] dark:hover:border-slate-600"
            >
              <span className={`inline-flex size-11 shrink-0 items-center justify-center rounded-xl ${item.tone}`}>
                <Icon className="size-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-slate-900 dark:text-white">{item.label}</span>
                <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">{item.description}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}