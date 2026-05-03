/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import TopBar from './components/TopBar';
import MobileAppShell from './components/MobileAppShell';
import Overview from './views/Overview';
import Transactions from './views/Transactions';
import Jars from './views/Jars';
import BudgetPlan from './views/BudgetPlan';
import Goals from './views/Goals';
import Debts from './views/Debts';
import MobileMore from './views/MobileMore';
import UiPlayground from './views/UiPlayground';
import AddTransactionModal from './components/AddTransactionModal';
import { getCurrentMonth } from './lib/api';

const APP_VIEWS = ['overview', 'transactions', 'jars', 'budget', 'goals', 'debts', 'more'] as const;
type AppView = typeof APP_VIEWS[number];
const APP_VIEW_QUERY_KEY = 'view';

function readAppViewFromQuery(): AppView {
  const view = new URLSearchParams(window.location.search).get(APP_VIEW_QUERY_KEY);
  return APP_VIEWS.includes(view as AppView) ? (view as AppView) : 'overview';
}

function writeAppViewToQuery(view: AppView) {
  const params = new URLSearchParams(window.location.search);
  if (view === 'overview') {
    params.delete(APP_VIEW_QUERY_KEY);
  } else {
    params.set(APP_VIEW_QUERY_KEY, view);
  }

  const query = params.toString();
  const nextUrl = `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`;
  window.history.replaceState(null, '', nextUrl);
}

function useHashRoute(): string {
  const [hash, setHash] = useState(() => window.location.hash);
  useEffect(() => {
    const onChange = () => setHash(window.location.hash);
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return hash;
}

function useIsMobileBreakpoint(): boolean {
  const [isMobile, setIsMobile] = useState(() => window.matchMedia('(max-width: 1023px)').matches);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 1023px)');
    const onChange = () => setIsMobile(media.matches);
    onChange();
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  return isMobile;
}

export default function App() {
  const hash = useHashRoute();
  const [currentView, setCurrentView] = useState<AppView>(() => readAppViewFromQuery());
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const isMobile = useIsMobileBreakpoint();
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    if (saved !== null) return saved === 'true';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('darkMode', String(darkMode));
  }, [darkMode]);

  useEffect(() => {
    if (!isMobile && currentView === 'more') {
      setCurrentView('overview');
    }
  }, [currentView, isMobile]);

  useEffect(() => {
    writeAppViewToQuery(currentView);
  }, [currentView]);

  // Phase A: dev playground for UI primitives. Access via #/__ui
  if (hash === '#/__ui' || hash === '#__ui') {
    return (
      <div className="min-h-screen bg-[var(--color-surface-alt)] text-[var(--color-text-primary)] font-sans">
        <UiPlayground />
      </div>
    );
  }

  const addModalOpen = hash === '#/add' || hash === '#add';
  const closeAddModal = () => {
    if (window.location.hash) {
      history.replaceState(null, '', window.location.pathname + window.location.search);
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    }
  };

  const renderCurrentView = (mobile = false) => {
    if (currentView === 'overview') return <Overview month={selectedMonth} hideDesktopAnalytics={mobile} />;
    if (currentView === 'transactions') return <Transactions month={selectedMonth} hideHeader={mobile} />;
    if (currentView === 'jars') return <Jars month={selectedMonth} hideHeader={mobile} />;
    if (currentView === 'budget') return <BudgetPlan month={selectedMonth} hideHeader={mobile} />;
    if (currentView === 'goals') return <Goals month={selectedMonth} />;
    if (currentView === 'debts') return <Debts month={selectedMonth} />;
    if (currentView === 'more') {
      return (
        <MobileMore
          monthLabel={selectedMonth}
          onNavigate={setCurrentView}
          onOpenInsights={() => setCurrentView('overview')}
        />
      );
    }
    return <Overview month={selectedMonth} />;
  };

  if (isMobile) {
    return (
      <>
        <MobileAppShell
          currentView={currentView}
          setCurrentView={setCurrentView}
          selectedMonth={selectedMonth}
          onMonthChange={setSelectedMonth}
          darkMode={darkMode}
          toggleDarkMode={() => setDarkMode(!darkMode)}
          onOpenAdd={() => {
            window.location.hash = '#/add';
          }}
        >
          {renderCurrentView(true)}
        </MobileAppShell>
        <AddTransactionModal open={addModalOpen} onClose={closeAddModal} />
      </>
    );
  }

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
      <main className="mx-auto max-w-[1440px] px-4 py-6 md:px-6 xl:px-8">
        {renderCurrentView(false)}
      </main>
      <AddTransactionModal open={addModalOpen} onClose={closeAddModal} />
    </div>
  );
}
