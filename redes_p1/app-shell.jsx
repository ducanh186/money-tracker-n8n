// Phone wrapper + main app — composes mobile screens into a clickable prototype

const PhoneShell = ({ label, theme = 'default', density = 'comfort', children, width = 375, height = 812 }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
    <div className={`mt-app mt-density-${density}`} data-theme={theme === 'default' ? null : theme} style={{ width, height }}>
      <div className="mt-phone" style={{ width, height }}>
        <StatusBar />
        <div className="mt-phone-inner">
          {children}
        </div>
      </div>
    </div>
    {label && <div style={{ fontSize: 12, color: '#6b7585', fontWeight: 500 }}>{label}</div>}
  </div>
);

// Self-contained mobile app: navigates between screens via state
const MobileApp = ({ initialView = 'home', theme = 'default', density = 'comfort', label }) => {
  const [view, setView] = React.useState(initialView);
  const [drawer, setDrawer] = React.useState(null);

  const ScreenEl = (() => {
    if (view === 'home') return <HomeScreen onTxOpen={() => setView('tx')} onJarOpen={() => setView('jars')} onInsights={() => setDrawer('insights')} onAdd={() => setDrawer('add')} />;
    if (view === 'tx') return <TxScreen onBack={() => setView('home')} onTxOpen={() => {}} />;
    if (view === 'jars') return <JarsScreen onBack={() => setView('home')} />;
    if (view === 'budget') return <BudgetScreen onBack={() => setView('home')} />;
    if (view === 'more') return (
      <div className="mt-screen">
        <MobileTopBar title="Khác" back onBack={() => setView('home')} />
        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { id: 'budget', icon: 'sliders', label: 'Kế hoạch chi tiêu', desc: '3 tabs phân bổ + khoản dự kiến' },
            { id: 'jars', icon: 'layers', label: 'Quản lý hũ', desc: 'Phân bổ % thu nhập' },
            { id: 'insights', icon: 'sparkles', label: 'Phân tích', desc: 'Top ăn tiền, xu hướng' },
          ].map(item => (
            <button key={item.id} className="mt-card interactive" style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left', background: 'var(--color-surface)', border: '1px solid var(--color-border)', cursor: 'pointer' }} onClick={() => item.id === 'insights' ? setDrawer('insights') : setView(item.id)}>
              <span className="mt-jar-icon-only" style={{ background: 'var(--color-primary-600)', width: 36, height: 36 }}><Icon name={item.icon} size={18} /></span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{item.label}</div>
                <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{item.desc}</div>
              </div>
              <Icon name="chevronRight" size={18} />
            </button>
          ))}
        </div>
      </div>
    );
    return null;
  })();

  return (
    <PhoneShell label={label} theme={theme}>
      <div className={`mt-app mt-density-${density}`} style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {ScreenEl}
        <BottomTab active={view} onNav={setView} onAdd={() => setDrawer('add')} />
        <QuickCaptureDrawer open={drawer === 'add'} onClose={() => setDrawer(null)} onSave={() => setDrawer(null)} />
        <InsightsDrawer open={drawer === 'insights'} onClose={() => setDrawer(null)} />
      </div>
    </PhoneShell>
  );
};

Object.assign(window, { PhoneShell, MobileApp });
