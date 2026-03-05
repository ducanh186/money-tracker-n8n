/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { TopNav } from './components/TopNav';
import { SummaryCard } from './components/SummaryCard';
import { IncomeExpenseChart } from './components/IncomeExpenseChart';
import { ExpenseStructureChart } from './components/ExpenseStructureChart';
import { RecentTransactions } from './components/RecentTransactions';
import { Wallet, TrendingUp, TrendingDown, Plus } from 'lucide-react';

export default function App() {
  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-300 font-sans selection:bg-blue-500/30">
      <TopNav />
      
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Tổng quan tài chính</h1>
            <p className="text-slate-400 mt-1">Theo dõi và quản lý dòng tiền của bạn theo phương pháp 6 Hũ.</p>
          </div>
          
          <button className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-lg shadow-blue-500/20 self-start md:self-auto">
            <Plus className="w-5 h-5" />
            Thêm giao dịch
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <SummaryCard 
            title="Tổng thu nhập"
            amount="25.000.000"
            trend={15}
            trendText="so với tháng trước"
            icon={TrendingUp}
            iconColor="text-emerald-400"
            iconBg="bg-emerald-400/10"
          />
          <SummaryCard 
            title="Tổng chi tiêu"
            amount="12.500.000"
            trend={-5}
            trendText="so với tháng trước"
            icon={TrendingDown}
            iconColor="text-rose-400"
            iconBg="bg-rose-400/10"
          />
          <SummaryCard 
            title="Số dư khả dụng"
            amount="12.500.000"
            trend={8}
            trendText="so với tháng trước"
            icon={Wallet}
            iconColor="text-blue-400"
            iconBg="bg-blue-400/10"
          />
        </div>

        {/* Charts & Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <IncomeExpenseChart />
            <RecentTransactions />
          </div>
          
          <div className="space-y-6">
            <ExpenseStructureChart />
            
            {/* Quick Actions or Info Card */}
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl p-6 text-white shadow-lg shadow-blue-900/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full blur-xl -ml-10 -mb-10"></div>
              
              <div className="relative z-10">
                <h3 className="font-bold text-lg mb-2">Mẹo quản lý tài chính</h3>
                <p className="text-blue-100 text-sm leading-relaxed mb-4">
                  Bạn đã tiết kiệm được 10% thu nhập tháng này. Hãy cố gắng duy trì thói quen này để đạt được mục tiêu tài chính dài hạn nhé!
                </p>
                <button className="bg-white/20 hover:bg-white/30 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors backdrop-blur-sm">
                  Xem chi tiết hũ Tiết kiệm
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
