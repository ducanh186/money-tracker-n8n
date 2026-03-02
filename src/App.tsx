/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Overview from './views/Overview';
import Transactions from './views/Transactions';
import Jars from './views/Jars';
import { getCurrentMonth } from './lib/api';

export default function App() {
  const [currentView, setCurrentView] = useState('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());

  return (
    <div className="flex h-screen w-full bg-slate-50 text-slate-900 font-sans">
      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 lg:hidden" onClick={() => setMobileMenuOpen(false)}></div>
      )}
      
      {/* Mobile Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white transform transition-transform duration-300 ease-in-out lg:hidden ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar currentView={currentView} setCurrentView={(v) => { setCurrentView(v); setMobileMenuOpen(false); }} />
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:block h-full">
        <Sidebar currentView={currentView} setCurrentView={setCurrentView} />
      </div>
      
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header
          toggleMobileMenu={() => setMobileMenuOpen(true)}
          selectedMonth={selectedMonth}
          onMonthChange={setSelectedMonth}
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {currentView === 'overview' && <Overview month={selectedMonth} />}
          {currentView === 'transactions' && <Transactions month={selectedMonth} />}
          {currentView === 'jars' && <Jars month={selectedMonth} />}
          {currentView === 'account' && (
            <div className="flex items-center justify-center h-full">
              <p className="text-slate-500">Trang tài khoản đang được phát triển</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
