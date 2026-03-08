/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import TopBar from './components/TopBar';
import Overview from './views/Overview';
import Transactions from './views/Transactions';
import Jars from './views/Jars';
import BudgetPlan from './views/BudgetPlan';
import Goals from './views/Goals';
import Accounts from './views/Accounts';
import { getCurrentMonth } from './lib/api';

export default function App() {
  const [currentView, setCurrentView] = useState('overview');
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    if (saved !== null) return saved === 'true';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('darkMode', String(darkMode));
  }, [darkMode]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0c1222] text-slate-900 dark:text-slate-200 font-sans transition-colors duration-200">
      <TopBar
        currentView={currentView}
        setCurrentView={setCurrentView}
        selectedMonth={selectedMonth}
        onMonthChange={setSelectedMonth}
        darkMode={darkMode}
        toggleDarkMode={() => setDarkMode(!darkMode)}
      />
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-6">
        {currentView === 'overview' && <Overview month={selectedMonth} />}
        {currentView === 'transactions' && <Transactions month={selectedMonth} />}
        {currentView === 'jars' && <Jars month={selectedMonth} />}
        {currentView === 'budget' && <BudgetPlan month={selectedMonth} />}
        {currentView === 'goals' && <Goals month={selectedMonth} />}
        {currentView === 'account' && <Accounts month={selectedMonth} />}
      </main>
    </div>
  );
}
