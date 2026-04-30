// Mobile screens for Money Tracker
const { useState: uS } = React;

// ─── Top bar (mobile) ───
const MobileTopBar = ({ title = 'Th 04/2026', back = false, onBack, onInfo }) => (
  <div className="mt-topbar">
    <div className="mt-topbar-title">
      {back ? (
        <button className="mt-iconbtn" onClick={onBack} aria-label="Quay lại"><Icon name="arrowLeft" size={20} /></button>
      ) : (
        <span style={{ width: 28, height: 28, borderRadius: 10, background: 'var(--color-primary-600)', color: 'white', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginRight: 8, fontSize: 14, fontWeight: 700 }}>₫</span>
      )}
      <strong>{title}</strong>
      <Icon name="chevronDown" size={14} />
    </div>
    <div className="mt-topbar-actions">
      <button className="mt-iconbtn" aria-label="Thông báo"><Icon name="bell" size={18} /></button>
      <button className="mt-iconbtn" aria-label="Thông tin" onClick={onInfo}><Icon name="info" size={18} /></button>
    </div>
  </div>
);

// ─── Bottom tab ───
const BottomTab = ({ active, onNav, onAdd }) => (
  <div className="mt-bottomtab">
    <button className={`mt-tab ${active === 'home' ? 'active' : ''}`} onClick={() => onNav('home')}>
      <Icon name="home2" size={22} stroke={active === 'home' ? 2.4 : 1.8} />
      <span>Trang chủ</span>
    </button>
    <button className={`mt-tab ${active === 'tx' ? 'active' : ''}`} onClick={() => onNav('tx')}>
      <Icon name="receipt" size={22} stroke={active === 'tx' ? 2.4 : 1.8} />
      <span>Giao dịch</span>
    </button>
    <button className="mt-tab-fab" onClick={onAdd} aria-label="Thêm giao dịch">
      <Icon name="plus" size={26} stroke={2.5} />
    </button>
    <button className={`mt-tab ${active === 'jars' ? 'active' : ''}`} onClick={() => onNav('jars')}>
      <Icon name="layers" size={22} stroke={active === 'jars' ? 2.4 : 1.8} />
      <span>Hũ</span>
    </button>
    <button className={`mt-tab ${active === 'more' ? 'active' : ''}`} onClick={() => onNav('more')}>
      <Icon name="moreH" size={22} stroke={active === 'more' ? 2.4 : 1.8} />
      <span>Khác</span>
    </button>
  </div>
);

// ─── HeroCard with toggle ───
const HeroCard = ({ mode = 'remaining', onModeChange, onInsights }) => {
  const totalSpent = JAR_ORDER.reduce((s, k) => s + JAR_STATE[k].spent, 0);
  const totalPlanned = JAR_ORDER.reduce((s, k) => s + JAR_STATE[k].planned, 0);
  const remaining = INCOME_TOTAL - totalSpent;
  const savingsRate = Math.round(((INCOME_TOTAL - totalSpent) / INCOME_TOTAL) * 100);
  const planUsage = Math.round((totalSpent / totalPlanned) * 100);

  let big, label, sub;
  if (mode === 'remaining') {
    big = remaining; label = 'Còn chi được';
    sub = `Đã chi ${formatVND(totalSpent, 'compact')} / ${formatVND(totalPlanned, 'compact')} kế hoạch`;
  } else if (mode === 'spent') {
    big = totalSpent; label = 'Đã chi tháng này';
    sub = `Còn lại ${formatVND(remaining, 'compact')} • ${planUsage}% kế hoạch`;
  } else {
    big = savingsRate; label = 'Tỷ lệ tiết kiệm';
    sub = `Tiết kiệm ${formatVND(remaining, 'compact')} từ ${formatVND(INCOME_TOTAL, 'compact')} thu nhập`;
  }
  const onTrack = planUsage <= 100;

  return (
    <div className="mt-hero">
      <div className="mt-hero-toggle">
        <button className={mode === 'remaining' ? 'active' : ''} onClick={() => onModeChange('remaining')}>Còn lại</button>
        <button className={mode === 'spent' ? 'active' : ''} onClick={() => onModeChange('spent')}>Đã chi</button>
        <button className={mode === 'savings' ? 'active' : ''} onClick={() => onModeChange('savings')}>Tiết kiệm</button>
      </div>
      <div className="mt-hero-label-row">
        <span className="mt-hero-label">{label}</span>
        <span className={`mt-hero-pill ${onTrack ? '' : 'warn'}`}>
          <span className="mt-dot" style={{ margin: 0, width: 6, height: 6, background: 'currentColor' }}></span>
          {onTrack ? 'Đúng tiến độ' : 'Chậm tiến độ'}
        </span>
      </div>
      <div className="mt-money display" style={{ color: 'var(--color-text-primary)' }}>
        {mode === 'savings' ? `${big}%` : <>{formatVND(big, 'full')} <span style={{ fontSize: 18, fontWeight: 600, color: 'var(--color-text-muted)', letterSpacing: 0 }}>đ</span></>}
      </div>
      <div className="mt-hero-meta">
        <span><strong>+{formatVND(INCOME_TOTAL, 'compact')}</strong> thu</span>
        <span style={{ color: 'var(--color-border-strong)' }}>·</span>
        <span><strong>−{formatVND(totalSpent, 'compact')}</strong> chi</span>
        <span style={{ color: 'var(--color-border-strong)' }}>·</span>
        <span>KH {formatVND(totalPlanned, 'compact')}</span>
      </div>
      <Progress value={planUsage} size="md" />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 11, color: 'var(--color-text-muted)' }}>
        <span>{planUsage}% kế hoạch tháng</span>
        <button onClick={onInsights} style={{ background: 'transparent', border: 0, color: 'var(--color-primary-600)', fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: 0 }}>Phân tích →</button>
      </div>
    </div>
  );
};

// ─── Jar card (Home) ───
const JarMiniCard = ({ jarKey, onClick }) => {
  const j = JARS[jarKey];
  const s = JAR_STATE[jarKey];
  const usage = s.planned > 0 ? Math.round((s.spent / s.planned) * 100) : 0;
  const remain = s.planned - s.spent;
  const status = remain < 0 ? 'over' : usage >= 80 ? 'warn' : 'ok';
  const statusText = remain < 0 ? `vượt ${formatVND(Math.abs(remain), 'compact')}` : usage >= 80 ? `gần hết` : `còn ${formatVND(remain, 'compact')}`;

  return (
    <div className="mt-card interactive" onClick={onClick} style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span className="mt-jar-icon-only" style={{ background: j.hex, width: 32, height: 32 }}>
          <Icon name={j.icon} size={16} />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, color: 'var(--color-text-muted)', fontWeight: 500 }}>{j.key}</div>
          <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{j.label}</div>
        </div>
      </div>
      <div>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
          <span className="mt-num" style={{ fontSize: 14, fontWeight: 600 }}>{formatVND(s.spent, 'compact')}<span style={{ color: 'var(--color-text-faint)', fontWeight: 400 }}> / {formatVND(s.planned, 'compact')}</span></span>
          <span className="mt-num" style={{ fontSize: 11, fontWeight: 600, color: status === 'over' ? 'var(--color-over)' : 'var(--color-text-muted)' }}>{usage}%</span>
        </div>
        <Progress value={usage} />
        <div style={{ marginTop: 6, fontSize: 11, color: 'var(--color-text-muted)' }}>
          <span className={`mt-dot ${status}`}></span>{statusText}
        </div>
      </div>
    </div>
  );
};

// ─── Recent tx row ───
const TxRow = ({ tx, onClick }) => {
  const isInc = tx.flow === 'income';
  return (
    <div className="mt-tx-row" onClick={onClick}>
      {isInc ? (
        <span className="mt-jar-icon-only" style={{ background: 'var(--color-income)', width: 36, height: 36 }}>
          <Icon name="arrowDown" size={16} />
        </span>
      ) : <JarIconCircle jarKey={tx.jar} />}
      <div className="mt-tx-body">
        <p className="mt-tx-desc">{tx.desc}</p>
        <span className="mt-tx-meta">{tx.time} · {isInc ? 'Thu nhập' : JARS[tx.jar]?.label}</span>
      </div>
      <Money value={tx.amount} flow={tx.flow} sign size="body" />
    </div>
  );
};

// ─── Top categories list (Home preview) ───
const TopCatRow = ({ cat }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0' }}>
    <JarIconCircle jarKey={cat.jar} size={32} />
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
        <span style={{ fontSize: 13, fontWeight: 500 }}>{cat.label}</span>
        <Money value={cat.amount} flow="expense" sign size="body" />
      </div>
      <Progress value={cat.pct} tone="ok" />
    </div>
  </div>
);

// ╭─────────────────────────────────────────╮
// │ SCREEN 1: Home                          │
// ╰─────────────────────────────────────────╯
const HomeScreen = ({ onTxOpen, onJarOpen, onInsights, onAdd }) => {
  const [heroMode, setHeroMode] = uS('remaining');
  const todayTx = SAMPLE_TX.filter(t => t.day === 'today');
  const yesterdayTx = SAMPLE_TX.filter(t => t.day === 'yesterday');

  return (
    <div className="mt-screen">
      <MobileTopBar />
      <HeroCard mode={heroMode} onModeChange={setHeroMode} onInsights={onInsights} />

      <div className="mt-section-h">
        <h3>6 hũ tháng này</h3>
        <a href="#" onClick={(e) => { e.preventDefault(); onJarOpen('NEC'); }}>Quản lý →</a>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, padding: '0 16px 8px' }}>
        {JAR_ORDER.map(k => <JarMiniCard key={k} jarKey={k} onClick={() => onJarOpen(k)} />)}
      </div>

      <div className="mt-section-h" style={{ marginTop: 20 }}>
        <h3>Top ăn tiền</h3>
        <a href="#" onClick={(e) => { e.preventDefault(); onInsights(); }}>Xem hết →</a>
      </div>
      <div className="mt-card flat" style={{ margin: '0 16px', padding: '4px 16px' }}>
        {TOP_CATEGORIES.slice(0, 3).map(c => <TopCatRow key={c.label} cat={c} />)}
      </div>

      <div className="mt-section-h" style={{ marginTop: 20 }}>
        <h3>Gần đây</h3>
        <a href="#" onClick={(e) => { e.preventDefault(); onTxOpen(); }}>Xem tất cả →</a>
      </div>
      <div style={{ background: 'var(--color-surface)', margin: '0 16px 24px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
        <div className="mt-date-header" style={{ position: 'static', background: 'var(--color-surface)', padding: '10px 16px 4px' }}>
          <span className="mt-date-header-left">Hôm nay · 18/04</span>
          <span className="mt-date-header-total">−{formatVND(todayTx.reduce((s, t) => s + t.amount, 0), 'compact')}</span>
        </div>
        {todayTx.map(t => <TxRow key={t.id} tx={t} onClick={onTxOpen} />)}
        <div className="mt-date-header" style={{ position: 'static', background: 'var(--color-surface)', padding: '10px 16px 4px', borderTop: '1px solid var(--color-border-light)' }}>
          <span className="mt-date-header-left">Hôm qua · 17/04</span>
          <span className="mt-date-header-total">+{formatVND(yesterdayTx.reduce((s, t) => s + (t.flow === 'income' ? t.amount : -t.amount), 0), 'compact')}</span>
        </div>
        {yesterdayTx.map(t => <TxRow key={t.id} tx={t} onClick={onTxOpen} />)}
      </div>
    </div>
  );
};

// ╭─────────────────────────────────────────╮
// │ SCREEN 2: Quick Capture (Drawer)        │
// ╰─────────────────────────────────────────╯
const QuickCaptureDrawer = ({ open, onClose, onSave }) => {
  const [amount, setAmount] = uS('50000');
  const [flow, setFlow] = uS('expense');
  const [jar, setJar] = uS('NEC');
  const [desc, setDesc] = uS('');

  const tap = (k) => {
    if (k === 'back') setAmount(a => a.slice(0, -1) || '0');
    else if (k === '000') setAmount(a => (a === '0' ? '0' : a + '000'));
    else setAmount(a => a === '0' ? k : a + k);
  };
  const display = parseInt(amount || '0', 10);

  return (
    <>
      <div className={`mt-overlay ${open ? 'open' : ''}`} onClick={onClose}></div>
      <div className={`mt-drawer ${open ? 'open' : ''}`} style={{ height: '92%' }}>
        <div className="mt-drawer-handle"></div>
        <div className="mt-drawer-header">
          <button className="mt-btn ghost" onClick={onClose} style={{ minHeight: 32, padding: '4px 8px' }}>Hủy</button>
          <h2>Thêm giao dịch</h2>
          <button className="mt-iconbtn" onClick={onClose} aria-label="Đóng"><Icon name="close" size={18} /></button>
        </div>
        <div className="mt-drawer-body" style={{ padding: 0 }}>
          {/* Amount display */}
          <div className={`mt-numpad-display ${flow}`}>
            {flow === 'expense' ? '−' : flow === 'income' ? '+' : ''}{formatVND(display, 'full')}
            <span className="currency">VND</span>
          </div>

          {/* Flow toggle */}
          <div style={{ padding: '0 20px 16px' }}>
            <div className="mt-hero-toggle" style={{ background: 'var(--color-surface-sunken)' }}>
              <button className={flow === 'expense' ? 'active' : ''} onClick={() => setFlow('expense')}>Chi</button>
              <button className={flow === 'income' ? 'active' : ''} onClick={() => setFlow('income')}>Thu</button>
              <button className={flow === 'transfer' ? 'active' : ''} onClick={() => setFlow('transfer')}>Chuyển khoản</button>
            </div>
          </div>

          {/* Jar pick */}
          {flow !== 'income' && (
            <div style={{ padding: '0 20px 14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Hũ</span>
                <span style={{ fontSize: 11, color: 'var(--color-primary-600)' }}><Icon name="sparkles" size={11} stroke={2} /> Gợi ý: NEC</span>
              </div>
              <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, margin: '0 -4px', padding: '0 4px 4px' }}>
                {JAR_ORDER.map(k => (
                  <JarChip key={k} jarKey={k} size="lg" selected={jar === k} onClick={() => setJar(k)} />
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          <div style={{ padding: '0 20px 14px' }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 6 }}>Mô tả</label>
            <input className="mt-input" placeholder="Ví dụ: Cà phê sáng" value={desc} onChange={e => setDesc(e.target.value)} />
          </div>

          {/* Numpad */}
          <div style={{ marginTop: 4 }}>
            <div className="mt-numpad">
              {['1','2','3','4','5','6','7','8','9','000','0','back'].map(k => (
                <button key={k} onClick={() => tap(k)}>
                  {k === 'back' ? <Icon name="arrowLeft" size={20} /> : k}
                </button>
              ))}
            </div>
          </div>

          <div style={{ padding: '8px 20px 24px' }}>
            <button className="mt-btn primary lg full" onClick={() => onSave({ amount: display, flow, jar, desc })}>
              Lưu giao dịch
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

Object.assign(window, { MobileTopBar, BottomTab, HeroCard, JarMiniCard, TxRow, TopCatRow, HomeScreen, QuickCaptureDrawer });
