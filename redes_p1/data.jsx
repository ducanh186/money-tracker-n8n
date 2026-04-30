// Mock data for Money Tracker prototype
const SAMPLE_TX = [
  // Today
  { id: 't1',  date: '18/04', day: 'today',     time: '09:30', desc: 'Cà phê sáng',         jar: 'NEC',  flow: 'expense', amount: 50000  },
  { id: 't2',  date: '18/04', day: 'today',     time: '08:15', desc: 'Grab đi làm',         jar: 'NEC',  flow: 'expense', amount: 45000  },
  { id: 't3',  date: '18/04', day: 'today',     time: '12:45', desc: 'Trà sữa',             jar: 'PLAY', flow: 'expense', amount: 65000  },
  // Yesterday
  { id: 't4',  date: '17/04', day: 'yesterday', time: '09:00', desc: 'Lương tháng 4',       jar: 'INC',  flow: 'income',  amount: 18000000 },
  { id: 't5',  date: '17/04', day: 'yesterday', time: '18:30', desc: 'Đi chợ Bà Chiểu',     jar: 'NEC',  flow: 'expense', amount: 180000 },
  { id: 't6',  date: '17/04', day: 'yesterday', time: '20:00', desc: 'Netflix',              jar: 'PLAY', flow: 'expense', amount: 260000 },
  // 16/04
  { id: 't7',  date: '16/04', day: 'sat',       time: '20:00', desc: 'Xem phim CGV',        jar: 'PLAY', flow: 'expense', amount: 230000 },
  { id: 't8',  date: '16/04', day: 'sat',       time: '14:00', desc: 'Sách Atomic Habits',  jar: 'EDU',  flow: 'expense', amount: 200000 },
  // 15/04
  { id: 't9',  date: '15/04', day: 'fri',       time: '17:00', desc: 'Xăng xe',              jar: 'NEC',  flow: 'expense', amount: 280000 },
  { id: 't10', date: '15/04', day: 'fri',       time: '12:00', desc: 'Cơm trưa văn phòng', jar: 'NEC',  flow: 'expense', amount: 55000  },
  { id: 't11', date: '15/04', day: 'fri',       time: '09:00', desc: 'Khoá học UX Figma',  jar: 'EDU',  flow: 'expense', amount: 1500000 },
];

// Jar status this month
const JAR_STATE = {
  NEC:  { planned: 9900000,  spent: 1800000,  committed: 500000 },
  EDU:  { planned: 1800000,  spent: 1700000,  committed: 0 },
  LTSS: { planned: 1800000,  spent: 1800000,  committed: 0 },
  PLAY: { planned: 1800000,  spent: 2200000,  committed: 0 },
  FFA:  { planned: 1800000,  spent: 540000,   committed: 0 },
  GIVE: { planned: 900000,   spent: 0,        committed: 0 },
};
const INCOME_TOTAL = 18000000;

// Top categories (insights)
const TOP_CATEGORIES = [
  { label: 'Ăn ngoài',  jar: 'PLAY', amount: 1240000, pct: 35 },
  { label: 'Đi chợ',    jar: 'NEC',  amount: 980000,  pct: 28 },
  { label: 'Xăng xe',   jar: 'NEC',  amount: 560000,  pct: 16 },
  { label: 'Cà phê',    jar: 'PLAY', amount: 340000,  pct: 10 },
  { label: 'Khóa học',  jar: 'EDU',  amount: 200000,  pct: 6 },
];

// Planned items per jar
const PLAN_LINES = {
  NEC: [
    { id: 'p1', label: 'Tiền nhà',     planned: 5000000, spent: 5000000, recurring: true },
    { id: 'p2', label: 'Đi chợ',       planned: 2500000, spent: 1200000 },
    { id: 'p3', label: 'Hóa đơn điện', planned: 500000,  spent: 0, recurring: true },
    { id: 'p4', label: 'Xăng xe',      planned: 800000,  spent: 280000 },
    { id: 'p5', label: 'Internet',     planned: 300000,  spent: 300000, recurring: true },
  ],
  EDU: [
    { id: 'p6', label: 'Khóa học UX',   planned: 1500000, spent: 1500000 },
    { id: 'p7', label: 'Sách',          planned: 200000,  spent: 200000 },
  ],
  PLAY: [
    { id: 'p8', label: 'Ăn ngoài',     planned: 1000000, spent: 1240000 },
    { id: 'p9', label: 'Giải trí',     planned: 800000,  spent: 960000 },
  ],
};

Object.assign(window, { SAMPLE_TX, JAR_STATE, INCOME_TOTAL, TOP_CATEGORIES, PLAN_LINES });
