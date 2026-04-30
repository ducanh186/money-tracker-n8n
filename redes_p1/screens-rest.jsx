// Transactions, Jars, Budget Plan, Insights screens

// ╭─────────────────────────────────────────╮
// │ SCREEN 3: Transactions                  │
// ╰─────────────────────────────────────────╯
const TxScreen = ({ onBack, onTxOpen }) => {
  const [filter, setFilter] = React.useState('all');
  const [search, setSearch] = React.useState('');

  const filtered = SAMPLE_TX.filter(t => {
    if (filter === 'income' && t.flow !== 'income') return false;
    if (filter === 'expense' && t.flow !== 'expense') return false;
    if (search && !t.desc.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  // group by date
  const groups = filtered.reduce((acc, t) => {
    (acc[t.date] = acc[t.date] || []).push(t);
    return acc;
  }, {});
  const dateLabels = { '18/04': 'Hôm nay · Th hai 18/04', '17/04': 'Hôm qua · CN 17/04', '16/04': 'Th bảy 16/04', '15/04': 'Th sáu 15/04' };

  return (
    <div className="mt-screen">
      <MobileTopBar title="Giao dịch · Th 04" back onBack={onBack} />
      <div style={{ padding: '0 16px 12px' }}>
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }}>
            <Icon name="search" size={16} />
          </span>
          <input className="mt-input" placeholder="Tìm giao dịch..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 36 }} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, padding: '0 16px 12px', overflowX: 'auto' }}>
        {[['all','Tất cả'],['expense','Chi'],['income','Thu'],['transfer','Chuyển']].map(([k, l]) => (
          <button key={k} className={`mt-chip ${filter === k ? 'active' : ''}`} onClick={() => setFilter(k)}>{l}</button>
        ))}
        <button className="mt-chip"><Icon name="filter" size={13} /> Hũ</button>
      </div>
      <div style={{ fontSize: 12, color: 'var(--color-text-muted)', padding: '0 20px 8px' }}>{filtered.length} giao dịch</div>
      <div>
        {Object.entries(groups).map(([date, txs]) => {
          const total = txs.reduce((s, t) => s + (t.flow === 'income' ? t.amount : -t.amount), 0);
          return (
            <div key={date}>
              <div className="mt-date-header">
                <span className="mt-date-header-left">{dateLabels[date] || date}</span>
                <span className="mt-date-header-total mt-num" style={{ color: total >= 0 ? 'var(--color-income)' : 'var(--color-expense)' }}>
                  {total >= 0 ? '+' : '−'}{formatVND(Math.abs(total), 'compact')}
                </span>
              </div>
              <div style={{ background: 'var(--color-surface)' }}>
                {txs.map(t => <TxRow key={t.id} tx={t} onClick={() => onTxOpen(t)} />)}
              </div>
            </div>
          );
        })}
        <div style={{ height: 24 }} />
      </div>
    </div>
  );
};

// ╭─────────────────────────────────────────╮
// │ SCREEN 4: Jars (allocate %)             │
// ╰─────────────────────────────────────────╯
const PercentSlider = ({ value, onChange, color }) => (
  <input
    type="range" min="0" max="100" value={value}
    onChange={e => onChange(parseInt(e.target.value, 10))}
    style={{
      width: '100%',
      height: 6,
      WebkitAppearance: 'none',
      appearance: 'none',
      background: `linear-gradient(to right, ${color} 0%, ${color} ${value}%, var(--color-surface-sunken) ${value}%, var(--color-surface-sunken) 100%)`,
      borderRadius: 3,
      outline: 'none',
      cursor: 'pointer',
    }}
  />
);

const JarsScreen = ({ onBack }) => {
  const [pcts, setPcts] = React.useState(() => Object.fromEntries(JAR_ORDER.map(k => [k, JARS[k].pct])));
  const total = Object.values(pcts).reduce((a, b) => a + b, 0);
  const remain = 100 - total;

  return (
    <div className="mt-screen">
      <MobileTopBar title="Hũ · Th 04" back onBack={onBack} />
      <div style={{ padding: '0 16px 16px' }}>
        <div className="mt-card" style={{ padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Tổng phân bổ</span>
            <span className="mt-num" style={{ fontSize: 16, fontWeight: 700, color: total === 100 ? 'var(--color-ok)' : 'var(--color-warn)' }}>{total}%</span>
          </div>
          <Progress value={total} tone={total === 100 ? 'ok' : 'warn'} size="md" />
          {total !== 100 && (
            <div style={{ marginTop: 8, fontSize: 12, color: 'var(--color-warn)' }}>
              {remain > 0 ? `Còn ${remain}% (${formatVND(INCOME_TOTAL * remain / 100, 'compact')}) chưa phân bổ` : `Vượt ${Math.abs(remain)}% — cần giảm`}
            </div>
          )}
        </div>
      </div>
      <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {JAR_ORDER.map(k => {
          const j = JARS[k];
          const s = JAR_STATE[k];
          const planned = INCOME_TOTAL * pcts[k] / 100;
          const usage = planned > 0 ? Math.round((s.spent / planned) * 100) : 0;
          return (
            <div key={k} className="mt-card" style={{ padding: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <span className="mt-jar-icon-only" style={{ background: j.hex, width: 36, height: 36 }}><Icon name={j.icon} size={18} /></span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{j.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{j.desc}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="mt-num" style={{ fontSize: 16, fontWeight: 700 }}>{pcts[k]}%</div>
                  <div className="mt-num" style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{formatVND(planned, 'compact')}</div>
                </div>
              </div>
              <PercentSlider value={pcts[k]} onChange={v => setPcts(p => ({ ...p, [k]: v }))} color={j.hex} />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 11, color: 'var(--color-text-muted)' }}>
                <span>Đã chi {formatVND(s.spent, 'compact')}</span>
                <span>{usage}%</span>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ padding: '0 16px 24px', display: 'flex', gap: 10 }}>
        <button className="mt-btn secondary" style={{ flex: 1 }}><Icon name="plus" size={16} /> Quỹ con</button>
        <button className="mt-btn primary" style={{ flex: 2 }} disabled={total !== 100}>Lưu phân bổ</button>
      </div>
    </div>
  );
};

// ╭─────────────────────────────────────────╮
// │ SCREEN 5: Budget Plan (3 tabs)          │
// ╰─────────────────────────────────────────╯
const BudgetScreen = ({ onBack }) => {
  const [tab, setTab] = React.useState('lines');
  const totalSpent = JAR_ORDER.reduce((s, k) => s + JAR_STATE[k].spent, 0);
  const totalPlanned = JAR_ORDER.reduce((s, k) => s + JAR_STATE[k].planned, 0);
  const totalCommitted = JAR_ORDER.reduce((s, k) => s + JAR_STATE[k].committed, 0);

  return (
    <div className="mt-screen">
      <MobileTopBar title="Chi tiêu · Th 04" back onBack={onBack} />
      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface)', position: 'sticky', top: 0, zIndex: 4 }}>
        {[['alloc','Phân bổ'],['lines','Khoản DK'],['summary','Tổng kết']].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} style={{ flex: 1, padding: '14px 0', background: 'transparent', border: 0, borderBottom: tab === k ? '2px solid var(--color-primary-600)' : '2px solid transparent', fontSize: 13, fontWeight: 600, color: tab === k ? 'var(--color-primary-600)' : 'var(--color-text-muted)', cursor: 'pointer', fontFamily: 'inherit' }}>
            {l}
          </button>
        ))}
      </div>

      {tab === 'alloc' && (
        <div style={{ padding: 16 }}>
          <div className="mt-card" style={{ padding: 16, marginBottom: 12 }}>
            <div style={{ fontSize: 12, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>Thu nhập kỳ</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
              <span className="mt-money h2">{formatVND(INCOME_TOTAL, 'full')} đ</span>
              <button className="mt-iconbtn solid"><Icon name="edit" size={16} /></button>
            </div>
          </div>
          <div className="mt-card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
            {JAR_ORDER.map(k => {
              const j = JARS[k];
              return (
                <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className="mt-jar-icon-only" style={{ background: j.hex, width: 28, height: 28 }}><Icon name={j.icon} size={14} /></span>
                  <span style={{ width: 36, fontSize: 12, fontWeight: 600 }}>{j.key}</span>
                  <div style={{ flex: 1 }}>
                    <PercentSlider value={JARS[k].pct} onChange={() => {}} color={j.hex} />
                  </div>
                  <span className="mt-num" style={{ width: 64, textAlign: 'right', fontSize: 13, fontWeight: 600 }}>{j.pct}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {tab === 'lines' && (
        <div style={{ padding: '12px 16px 24px' }}>
          <button className="mt-btn secondary full" style={{ marginBottom: 12 }}><Icon name="plus" size={16} /> Thêm khoản dự kiến</button>
          {Object.entries(PLAN_LINES).map(([jk, lines]) => {
            const j = JARS[jk];
            const planned = lines.reduce((s, l) => s + l.planned, 0);
            const spent = lines.reduce((s, l) => s + l.spent, 0);
            return (
              <div key={jk} className="mt-card" style={{ marginBottom: 12, overflow: 'hidden' }}>
                <div style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid var(--color-border-light)' }}>
                  <span className="mt-jar-icon-only" style={{ background: j.hex, width: 28, height: 28 }}><Icon name={j.icon} size={14} /></span>
                  <span style={{ fontSize: 14, fontWeight: 600 }}>{j.label}</span>
                  <span style={{ flex: 1 }}></span>
                  <span className="mt-num" style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{formatVND(spent, 'compact')} / {formatVND(planned, 'compact')}</span>
                </div>
                {lines.map(line => {
                  const u = line.planned > 0 ? Math.round((line.spent / line.planned) * 100) : 0;
                  return (
                    <div key={line.id} style={{ padding: '12px 14px', borderBottom: '1px solid var(--color-border-light)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 500 }}>{line.label} {line.recurring && <span style={{ fontSize: 10, color: 'var(--color-primary-600)', marginLeft: 4 }}>↻ Định kỳ</span>}</span>
                        <span className="mt-num" style={{ fontSize: 13, fontWeight: 600 }}>{formatVND(line.planned, 'compact')}</span>
                      </div>
                      <Progress value={u} />
                      <div style={{ marginTop: 4, fontSize: 11, color: 'var(--color-text-muted)' }}>
                        {u > 100 ? `vượt ${formatVND(line.spent - line.planned, 'compact')}` : line.spent === 0 ? 'chưa có chi' : `đã chi ${formatVND(line.spent, 'compact')} · còn ${formatVND(line.planned - line.spent, 'compact')}`}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}

      {tab === 'summary' && (
        <div style={{ padding: '12px 16px 24px' }}>
          <div className="mt-card" style={{ padding: 16, marginBottom: 12 }}>
            <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 8 }}>Tháng 04/2026 · đang mở</div>
            {[
              ['Kế hoạch', totalPlanned, ''],
              ['Đã chi', totalSpent, `(${Math.round(totalSpent / totalPlanned * 100)}%)`],
              ['Cam kết', totalCommitted, ''],
            ].map(([l, v, suf]) => (
              <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 14 }}>
                <span style={{ color: 'var(--color-text-muted)' }}>{l}</span>
                <span className="mt-num" style={{ fontWeight: 600 }}>{formatVND(v, 'full')} đ <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>{suf}</span></span>
              </div>
            ))}
            <div style={{ borderTop: '1px solid var(--color-border)', marginTop: 8, paddingTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 14, fontWeight: 600 }}>Còn lại</span>
              <span className="mt-money h2 income">{formatVND(INCOME_TOTAL - totalSpent - totalCommitted, 'full')} đ</span>
            </div>
          </div>
          <div className="mt-card" style={{ padding: 0, overflow: 'hidden', marginBottom: 12 }}>
            {JAR_ORDER.map(k => {
              const j = JARS[k];
              const s = JAR_STATE[k];
              const u = Math.round((s.spent / s.planned) * 100);
              const status = s.spent > s.planned ? 'over' : u >= 80 ? 'warn' : 'ok';
              return (
                <div key={k} style={{ padding: '12px 14px', borderBottom: '1px solid var(--color-border-light)', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className="mt-jar-icon-only" style={{ background: j.hex, width: 28, height: 28 }}><Icon name={j.icon} size={14} /></span>
                  <span style={{ fontSize: 13, fontWeight: 600, width: 50 }}>{j.key}</span>
                  <span className="mt-num" style={{ fontSize: 12, color: 'var(--color-text-muted)', flex: 1 }}>{u}% chi</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: `var(--color-${status})` }}>
                    <span className={`mt-dot ${status}`}></span>
                    {status === 'ok' ? 'OK' : status === 'warn' ? 'Cảnh báo' : `Vượt ${formatVND(s.spent - s.planned, 'compact')}`}
                  </span>
                </div>
              );
            })}
          </div>
          <button className="mt-btn primary lg full">Đóng kỳ Th 04/2026</button>
        </div>
      )}
    </div>
  );
};

// ╭─────────────────────────────────────────╮
// │ Insights drawer                         │
// ╰─────────────────────────────────────────╯
const InsightsDrawer = ({ open, onClose }) => (
  <>
    <div className={`mt-overlay ${open ? 'open' : ''}`} onClick={onClose}></div>
    <div className={`mt-drawer ${open ? 'open' : ''}`} style={{ height: '88%' }}>
      <div className="mt-drawer-handle"></div>
      <div className="mt-drawer-header">
        <span style={{ width: 32 }}></span>
        <h2>Phân tích · Th 04</h2>
        <button className="mt-iconbtn" onClick={onClose} aria-label="Đóng"><Icon name="close" size={18} /></button>
      </div>
      <div className="mt-drawer-body">
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>Top 5 ăn tiền</div>
        <div className="mt-card" style={{ padding: '4px 16px', marginBottom: 16 }}>
          {TOP_CATEGORIES.map((c, i) => (
            <div key={c.label} style={{ padding: '12px 0', borderBottom: i < TOP_CATEGORIES.length - 1 ? '1px solid var(--color-border-light)' : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', width: 14 }}>{i + 1}.</span>
                <JarChip jarKey={c.jar} />
                <span style={{ fontSize: 13, fontWeight: 500, flex: 1 }}>{c.label}</span>
                <Money value={c.amount} flow="expense" sign size="body" />
              </div>
              <Progress value={c.pct} tone="warn" />
            </div>
          ))}
        </div>

        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>Xu hướng 4 tuần</div>
        <div className="mt-card" style={{ padding: 16, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 90, marginBottom: 8 }}>
            {[2.8, 2.4, 2.1, 3.5].map((h, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <div style={{ width: '100%', height: `${h * 22}px`, background: i === 3 ? 'var(--color-warn)' : 'var(--color-primary-300)', borderRadius: 6 }}></div>
                <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>W{i + 1}</span>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 12, color: 'var(--color-warn)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Icon name="flame" size={13} /> W4 cao hơn trung bình 18%
          </div>
        </div>

        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>Cảnh báo</div>
        <div className="mt-card" style={{ padding: 14, borderColor: 'var(--color-warn)', background: 'var(--color-warn-bg)' }}>
          <div style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
            <Icon name="info" size={18} stroke={2} />
            <div style={{ flex: 1, fontSize: 13, color: 'var(--color-text-primary)' }}>
              <strong>Hũ PLAY</strong> vượt mức 3 tháng liên tiếp:<br/>
              <span className="mt-num" style={{ color: 'var(--color-text-muted)' }}>Th2 +180k · Th3 +250k · Th4 +400k</span>
            </div>
          </div>
          <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 10 }}>
            Gợi ý: tăng PLAY thêm 5% từ NEC hoặc EDU.
          </div>
          <button className="mt-btn secondary" style={{ width: '100%' }}>Mở Phân bổ</button>
        </div>
      </div>
    </div>
  </>
);

Object.assign(window, { TxScreen, JarsScreen, BudgetScreen, InsightsDrawer });
