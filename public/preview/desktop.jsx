// Desktop layout for Money Tracker — 1280px wide

const DesktopApp = ({ theme = 'default', density = 'comfort', label }) => {
  const [view, setView] = React.useState('home');
  const [drawer, setDrawer] = React.useState(null);
  const [heroMode, setHeroMode] = React.useState('remaining');

  const totalSpent = JAR_ORDER.reduce((s, k) => s + JAR_STATE[k].spent, 0);
  const totalPlanned = JAR_ORDER.reduce((s, k) => s + JAR_STATE[k].planned, 0);
  const totalCommitted = JAR_ORDER.reduce((s, k) => s + JAR_STATE[k].committed, 0);
  const remaining = INCOME_TOTAL - totalSpent;
  const planUsage = Math.round((totalSpent / totalPlanned) * 100);
  const savingsRate = Math.round((remaining / INCOME_TOTAL) * 100);

  return (
    <div data-theme={theme === 'default' ? null : theme} className={`mt-app mt-density-${density}`} style={{ width: 1280, background: 'var(--color-surface-alt)', borderRadius: 12, border: '1px solid var(--color-border)', boxShadow: '0 24px 64px rgba(15,23,42,0.12)', overflow: 'hidden' }}>
      {/* TopBar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 24px', background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--color-primary-600)', color: 'white', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700 }}>₫</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text-primary)' }}>Money Tracker</span>
          </div>
          <nav style={{ display: 'flex', gap: 4 }}>
            {[['home','Tổng quan'],['tx','Giao dịch'],['jars','Hũ'],['budget','Chi tiêu']].map(([k,l]) => (
              <button key={k} onClick={() => setView(k)} className="mt-btn ghost" style={{ fontWeight: view === k ? 600 : 500, color: view === k ? 'var(--color-text-primary)' : 'var(--color-text-muted)', background: view === k ? 'var(--color-surface-sunken)' : 'transparent', padding: '8px 14px', minHeight: 36 }}>{l}</button>
            ))}
          </nav>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, color: 'var(--color-text-muted)', marginRight: 8 }}>Th 04/2026 ▾</span>
          <div style={{ position: 'relative' }}>
            <input className="mt-input" placeholder="⌘K · Tìm kiếm" style={{ width: 220, paddingLeft: 12, fontSize: 13 }} />
          </div>
          <button className="mt-btn primary" onClick={() => setDrawer('add')} style={{ minHeight: 36, padding: '8px 14px' }}><Icon name="plus" size={16} /> Thêm GD</button>
          <button className="mt-iconbtn solid" aria-label="Thông báo"><Icon name="bell" size={16} /></button>
        </div>
      </div>

      {/* Content */}
      {view === 'home' && (
        <div style={{ padding: 24, display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20 }}>
          <div>
            {/* Hero */}
            <div className="mt-card" style={{ padding: 24, marginBottom: 20 }}>
              <div className="mt-hero-toggle" style={{ width: 280, marginBottom: 16 }}>
                <button className={heroMode === 'remaining' ? 'active' : ''} onClick={() => setHeroMode('remaining')}>Còn lại</button>
                <button className={heroMode === 'spent' ? 'active' : ''} onClick={() => setHeroMode('spent')}>Đã chi</button>
                <button className={heroMode === 'savings' ? 'active' : ''} onClick={() => setHeroMode('savings')}>Tiết kiệm</button>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
                  {heroMode === 'remaining' ? 'Còn chi được' : heroMode === 'spent' ? 'Đã chi tháng này' : 'Tỷ lệ tiết kiệm'}
                </span>
                <span className="mt-hero-pill"><span className="mt-dot ok" style={{ width: 6, height: 6, margin: 0, background: 'currentColor' }}></span>Đúng tiến độ</span>
              </div>
              <div className="mt-money display" style={{ fontSize: 48, marginTop: 8 }}>
                {heroMode === 'savings' ? `${savingsRate}%` : <>{formatVND(heroMode === 'remaining' ? remaining : totalSpent, 'full')} <span style={{ fontSize: 20, color: 'var(--color-text-muted)' }}>đ</span></>}
              </div>
              <div style={{ display: 'flex', gap: 16, fontSize: 13, color: 'var(--color-text-muted)', margin: '14px 0 12px' }}>
                <span>Thu <strong style={{ color: 'var(--color-text-primary)' }}>+{formatVND(INCOME_TOTAL, 'compact')}</strong></span>
                <span>·</span>
                <span>Chi <strong style={{ color: 'var(--color-text-primary)' }}>−{formatVND(totalSpent, 'compact')}</strong></span>
                <span>·</span>
                <span>Kế hoạch <strong style={{ color: 'var(--color-text-primary)' }}>{formatVND(totalPlanned, 'compact')}</strong></span>
              </div>
              <Progress value={planUsage} size="md" />
              <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 6 }}>{planUsage}% kế hoạch tháng</div>
            </div>

            {/* 6 Jars row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--color-text-muted)', margin: 0 }}>6 hũ tháng này</h3>
              <a href="#" onClick={(e) => { e.preventDefault(); setView('jars'); }} style={{ fontSize: 13, color: 'var(--color-primary-600)', textDecoration: 'none', fontWeight: 500 }}>Quản lý hũ →</a>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10, marginBottom: 24 }}>
              {JAR_ORDER.map(k => {
                const j = JARS[k]; const s = JAR_STATE[k];
                const u = Math.round((s.spent / s.planned) * 100);
                const remain = s.planned - s.spent;
                const status = remain < 0 ? 'over' : u >= 80 ? 'warn' : 'ok';
                return (
                  <div key={k} className="mt-card interactive" style={{ padding: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <span className="mt-jar-icon-only" style={{ background: j.hex, width: 26, height: 26 }}><Icon name={j.icon} size={13} /></span>
                      <span style={{ fontSize: 12, fontWeight: 600 }}>{j.key}</span>
                    </div>
                    <div className="mt-num" style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{formatVND(s.spent, 'compact')}<span style={{ color: 'var(--color-text-faint)', fontWeight: 400 }}> / {formatVND(s.planned, 'compact')}</span></div>
                    <Progress value={u} />
                    <div style={{ marginTop: 6, fontSize: 11, color: 'var(--color-text-muted)' }}>
                      <span className={`mt-dot ${status}`}></span>{remain < 0 ? `vượt ${formatVND(Math.abs(remain), 'compact')}` : `còn ${formatVND(remain, 'compact')}`}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Charts placeholder */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="mt-card" style={{ padding: 20 }}>
                <h4 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 600 }}>Thu chi 6 tháng</h4>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 140 }}>
                  {[
                    { m: 'T11', inc: 90, exp: 70 }, { m: 'T12', inc: 95, exp: 80 },
                    { m: 'T1', inc: 100, exp: 75 }, { m: 'T2', inc: 100, exp: 85 },
                    { m: 'T3', inc: 100, exp: 70 }, { m: 'T4', inc: 100, exp: 76 }
                  ].map((d, i) => (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: '100%', height: 110, display: 'flex', gap: 3, alignItems: 'flex-end' }}>
                        <div style={{ flex: 1, height: `${d.inc}%`, background: 'var(--color-income)', opacity: 0.85, borderRadius: '4px 4px 0 0' }}></div>
                        <div style={{ flex: 1, height: `${d.exp}%`, background: 'var(--color-expense)', opacity: 0.85, borderRadius: '4px 4px 0 0' }}></div>
                      </div>
                      <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>{d.m}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-card" style={{ padding: 20 }}>
                <h4 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 600 }}>Cơ cấu chi</h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                  <div style={{ width: 120, height: 120, borderRadius: '50%', background: `conic-gradient(${JAR_ORDER.map((k, i) => {
                    const offsets = [0, 50, 60, 70, 78, 88, 100];
                    return `${JARS[k].hex} ${offsets[i]}% ${offsets[i+1]}%`;
                  }).join(', ')})`, position: 'relative', flexShrink: 0 }}>
                    <div style={{ position: 'absolute', inset: 30, borderRadius: '50%', background: 'var(--color-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                      <span className="mt-num" style={{ fontSize: 16, fontWeight: 700 }}>{formatVND(totalSpent, 'compact')}</span>
                      <span style={{ fontSize: 9, color: 'var(--color-text-muted)' }}>chi tháng</span>
                    </div>
                  </div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {JAR_ORDER.map(k => (
                      <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: JARS[k].hex }}></span>
                        <span style={{ flex: 1, color: 'var(--color-text-secondary)' }}>{JARS[k].key}</span>
                        <span className="mt-num" style={{ color: 'var(--color-text-muted)' }}>{formatVND(JAR_STATE[k].spent, 'compact')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div>
            <div className="mt-card" style={{ padding: 18, marginBottom: 16 }}>
              <h4 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 600 }}>Tuần này</h4>
              {[
                ['↗ Thu', '+500k', 'income'],
                ['↘ Chi', '−1,8M', 'expense'],
                ['💎 Tiết kiệm', '18%', ''],
              ].map(([l, v, c], i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < 2 ? '1px solid var(--color-border-light)' : 'none', fontSize: 13 }}>
                  <span style={{ color: 'var(--color-text-secondary)' }}>{l}</span>
                  <span className="mt-num" style={{ fontWeight: 600, color: c ? `var(--color-${c})` : 'var(--color-text-primary)' }}>{v}</span>
                </div>
              ))}
            </div>
            <div className="mt-card" style={{ padding: 18, marginBottom: 16 }}>
              <h4 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 600 }}>Top ăn tiền</h4>
              {TOP_CATEGORIES.slice(0, 3).map((c, i) => (
                <div key={c.label} style={{ padding: '8px 0', borderBottom: i < 2 ? '1px solid var(--color-border-light)' : 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{c.label}</span>
                    <Money value={c.amount} flow="expense" sign size="caption" />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <JarChip jarKey={c.jar} />
                    <Progress value={c.pct} tone="warn" />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '14px 16px 8px', fontSize: 14, fontWeight: 600 }}>Gần đây</div>
              <div style={{ padding: '8px 16px', fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', borderTop: '1px solid var(--color-border-light)' }}>Hôm nay · 18/04</div>
              {SAMPLE_TX.filter(t => t.day === 'today').slice(0, 2).map(t => <TxRow key={t.id} tx={t} />)}
              <div style={{ padding: '8px 16px', fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', borderTop: '1px solid var(--color-border-light)' }}>Hôm qua · 17/04</div>
              {SAMPLE_TX.filter(t => t.day === 'yesterday').slice(0, 2).map(t => <TxRow key={t.id} tx={t} />)}
            </div>
          </div>
        </div>
      )}

      {/* Other views — reuse mobile screens, framed */}
      {view !== 'home' && (
        <div style={{ padding: 24, display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20, minHeight: 700 }}>
          <div className="mt-card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {view === 'tx' && <TxScreen onBack={() => setView('home')} onTxOpen={() => {}} />}
            {view === 'jars' && <JarsScreen onBack={() => setView('home')} />}
            {view === 'budget' && <BudgetScreen onBack={() => setView('home')} />}
          </div>
          <div className="mt-card" style={{ padding: 20 }}>
            <h4 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 600 }}>Chi tiết</h4>
            <p style={{ fontSize: 13, color: 'var(--color-text-muted)', lineHeight: 1.5 }}>Click một dòng giao dịch hoặc hũ để xem chi tiết ở panel này.</p>
          </div>
        </div>
      )}

      {/* Add modal */}
      {drawer === 'add' && (
        <>
          <div className="mt-overlay open" onClick={() => setDrawer(null)} style={{ position: 'fixed' }}></div>
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 480, background: 'var(--color-surface-raised)', borderRadius: 16, boxShadow: 'var(--shadow-lg)', zIndex: 100, padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Thêm giao dịch</h3>
              <button className="mt-iconbtn" onClick={() => setDrawer(null)}><Icon name="close" size={18} /></button>
            </div>
            <div style={{ textAlign: 'center', fontSize: 44, fontWeight: 700, color: 'var(--color-expense)', padding: '12px 0', fontFeatureSettings: '"tnum" 1' }}>−50.000 <span style={{ fontSize: 16, color: 'var(--color-text-muted)' }}>VND</span></div>
            <div className="mt-hero-toggle" style={{ marginBottom: 14 }}>
              <button className="active">Chi</button>
              <button>Thu</button>
              <button>Chuyển khoản</button>
            </div>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>Hũ</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {JAR_ORDER.map(k => <JarChip key={k} jarKey={k} size="lg" selected={k === 'NEC'} />)}
              </div>
            </div>
            <input className="mt-input" placeholder="Mô tả" defaultValue="Cà phê sáng" style={{ marginBottom: 14 }} />
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="mt-btn secondary" onClick={() => setDrawer(null)} style={{ flex: 1 }}>Hủy</button>
              <button className="mt-btn primary" onClick={() => setDrawer(null)} style={{ flex: 2 }}>Lưu giao dịch</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

Object.assign(window, { DesktopApp });
