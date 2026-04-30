// Jar identity — single source of truth
const { useMemo, useState, useEffect, useRef, useLayoutEffect } = React;

// Lucide-style inline SVG icons (small set)
const Icon = ({ name, size = 18, stroke = 2, ...rest }) => {
  const paths = {
    home: <><path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1V9.5Z"/></>,
    book: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"/></>,
    piggy: <><path d="M19 12.7c0-3.4-3.1-6.2-7-6.2-1.2 0-2.3.3-3.3.7L6 5v3.4C4.7 9.7 4 11.3 4 13c0 3.4 3.1 6.2 7 6.2h.5L13 21l1-2c2.9-.6 5-2.7 5-5.3"/><circle cx="14.5" cy="12.5" r="0.5" fill="currentColor"/></>,
    party: <><path d="M5.8 11.3 2 22l10.7-3.79"/><path d="M4 3h.01"/><path d="M22 8h.01"/><path d="M15 2h.01"/><path d="M22 20h.01"/><path d="M22 2 15 9l-2-2 7-7"/><path d="M11 13a4 4 0 0 0-4 4"/></>,
    trending: <><path d="M22 7 13.5 15.5 8.5 10.5 2 17"/><path d="M16 7h6v6"/></>,
    gift: <><path d="M20 12v10H4V12"/><path d="M2 7h20v5H2z"/><path d="M12 22V7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></>,
    plus: <><path d="M12 5v14M5 12h14"/></>,
    arrowLeft: <><path d="m15 18-6-6 6-6"/></>,
    arrowRight: <><path d="m9 18 6-6-6-6"/></>,
    chevronDown: <><path d="m6 9 6 6 6-6"/></>,
    chevronUp: <><path d="m18 15-6-6-6 6"/></>,
    chevronRight: <><path d="m9 18 6-6-6-6"/></>,
    search: <><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></>,
    filter: <><path d="M3 6h18"/><path d="M7 12h10"/><path d="M10 18h4"/></>,
    close: <><path d="M18 6 6 18M6 6l12 12"/></>,
    bell: <><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></>,
    info: <><circle cx="12" cy="12" r="9"/><path d="M12 16v-4"/><path d="M12 8h.01"/></>,
    home2: <><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/><polyline points="9 22 9 12 15 12 15 22"/></>,
    receipt: <><path d="M4 2v20l3-2 3 2 3-2 3 2 3-2 1 2V2H4Z"/><path d="M16 8H8"/><path d="M16 12H8"/><path d="M13 16H8"/></>,
    layers: <><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></>,
    moreH: <><circle cx="12" cy="12" r="1.5"/><circle cx="5" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/></>,
    edit: <><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></>,
    trash: <><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></>,
    arrowDown: <><path d="M12 5v14M5 12l7 7 7-7"/></>,
    arrowUp: <><path d="M12 19V5M5 12l7-7 7 7"/></>,
    swap: <><path d="m17 3 4 4-4 4"/><path d="M21 7H9"/><path d="m7 21-4-4 4-4"/><path d="M3 17h12"/></>,
    sun: <><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></>,
    moon: <><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z"/></>,
    sliders: <><path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/></>,
    sparkles: <><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/></>,
    flame: <><path d="M8.5 14.5A2.5 2.5 0 0 0 11 17c1.5 0 3-1 3-3s-2-3-2-5c0-2 1-3 1-3s.5 1 .5 2c0 2 2 4 2 6 0 3-2 5-5 5s-5-2-5-5c0-2 2-3 2-3s-1 4 1 4Z"/></>,
  };
  const path = paths[name];
  if (!path) return null;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" {...rest}>
      {path}
    </svg>
  );
};

const JARS = {
  NEC:  { key: 'NEC',  label: 'Thiết yếu',         desc: 'Nhà, ăn, đi lại',         pct: 55, hex: '#0284c7', bg: '#e0f2fe', icon: 'home'     },
  EDU:  { key: 'EDU',  label: 'Giáo dục',          desc: 'Khóa học, sách',           pct: 10, hex: '#7c3aed', bg: '#ede9fe', icon: 'book'     },
  LTSS: { key: 'LTSS', label: 'Tiết kiệm DH',      desc: 'Mua lớn, dự phòng',        pct: 10, hex: '#059669', bg: '#d1fae5', icon: 'piggy'    },
  PLAY: { key: 'PLAY', label: 'Hưởng thụ',         desc: 'Giải trí, nhà hàng',       pct: 10, hex: '#ea580c', bg: '#ffedd5', icon: 'party'    },
  FFA:  { key: 'FFA',  label: 'Tự do tài chính',   desc: 'Đầu tư',                   pct: 10, hex: '#d97706', bg: '#fef3c7', icon: 'trending' },
  GIVE: { key: 'GIVE', label: 'Cho đi',            desc: 'Quà tặng, từ thiện',       pct: 5,  hex: '#db2777', bg: '#fce7f3', icon: 'gift'     },
};
const JAR_ORDER = ['NEC', 'EDU', 'LTSS', 'PLAY', 'FFA', 'GIVE'];

// JarChip — solid filled style (option 2 from svg-options)
const JarChip = ({ jarKey, size = 'md', label = true, onClick, selected }) => {
  const j = JARS[jarKey];
  if (!j) return null;
  const style = { '--jar-color': j.hex, '--jar-bg': selected ? j.hex : j.bg, '--jar-fg': selected ? '#fff' : j.hex };
  return (
    <button
      type="button"
      onClick={onClick}
      className={`mt-jarchip ${size === 'lg' ? 'lg' : ''}`}
      style={{ ...style, border: 'none', cursor: onClick ? 'pointer' : 'default', outline: selected ? `2px solid ${j.hex}` : 'none', outlineOffset: 2 }}
    >
      <span className="mt-jar-icon" style={{ background: selected ? 'rgba(255,255,255,0.25)' : j.hex, color: selected ? '#fff' : '#fff' }}>
        <Icon name={j.icon} size={size === 'lg' ? 17 : 13} />
      </span>
      {label && <span>{j.key}</span>}
    </button>
  );
};

const JarIconCircle = ({ jarKey, size = 36 }) => {
  const j = JARS[jarKey];
  if (!j) return null;
  return (
    <span className="mt-jar-icon-only" style={{ background: j.hex, width: size, height: size }}>
      <Icon name={j.icon} size={size * 0.5} />
    </span>
  );
};

// ─── Money utils ───
function formatVND(n, mode = 'compact') {
  if (n == null || isNaN(n)) return '0';
  const abs = Math.abs(n);
  if (mode === 'compact') {
    if (abs >= 1_000_000) return (n / 1_000_000).toFixed(abs >= 10_000_000 ? 0 : 1).replace('.0', '') + 'M';
    if (abs >= 1_000) return Math.round(n / 1_000) + 'k';
    return String(Math.round(n));
  }
  return n.toLocaleString('vi-VN');
}
function signedVND(n, flow) {
  const sign = flow === 'income' ? '+' : flow === 'expense' ? '−' : '';
  return sign + formatVND(Math.abs(n), 'full') + ' đ';
}

const Money = ({ value, flow, size = 'body', format = 'full', sign = false, className = '' }) => {
  const s = sign ? (flow === 'income' ? '+' : flow === 'expense' ? '−' : '') : '';
  return <span className={`mt-money ${size} ${flow || ''} ${className}`}>{s}{formatVND(Math.abs(value), format)}{format === 'full' ? ' đ' : ''}</span>;
};

const Progress = ({ value, tone, size = 'sm' }) => {
  const v = Math.min(100, Math.max(0, value));
  let t = tone;
  if (!t) {
    if (value > 100) t = 'over';
    else if (value >= 80) t = 'warn';
    else t = 'ok';
  }
  return (
    <div className={`mt-progress ${size}`}>
      <div className={`mt-progress-fill ${t}`} style={{ width: `${v}%` }} />
    </div>
  );
};

// Status bar (iOS-ish)
const StatusBar = () => (
  <div className="mt-statusbar">
    <span>9:41</span>
    <span className="mt-statusbar-icons">
      <svg width="17" height="11" viewBox="0 0 17 11" fill="none"><rect x="0.5" y="6.5" width="3" height="4" rx="0.5" fill="currentColor"/><rect x="4.5" y="4.5" width="3" height="6" rx="0.5" fill="currentColor"/><rect x="8.5" y="2.5" width="3" height="8" rx="0.5" fill="currentColor"/><rect x="12.5" y="0.5" width="3" height="10" rx="0.5" fill="currentColor"/></svg>
      <svg width="16" height="11" viewBox="0 0 16 11" fill="none"><path d="M8 3a6 6 0 0 1 4.2 1.7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M8 6a3 3 0 0 1 2.1.9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><circle cx="8" cy="9" r="1" fill="currentColor"/></svg>
      <svg width="25" height="11" viewBox="0 0 25 11" fill="none"><rect x="0.5" y="0.8" width="21" height="9.5" rx="2.5" stroke="currentColor" opacity="0.4"/><rect x="2" y="2.3" width="14" height="6.5" rx="1" fill="currentColor"/><rect x="22.5" y="3.5" width="1.5" height="4" rx="0.5" fill="currentColor" opacity="0.4"/></svg>
    </span>
  </div>
);

Object.assign(window, { Icon, JARS, JAR_ORDER, JarChip, JarIconCircle, formatVND, signedVND, Money, Progress, StatusBar });
