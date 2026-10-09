// Inline stroke icons (24px grid, 2px stroke).
const s = (d) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;

export const I = {
  home: s('<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/>'),
  market: s('<path d="M4 9l1-5h14l1 5"/><path d="M4 9h16v2a3 3 0 0 1-6 0 3 3 0 0 1-4 0 3 3 0 0 1-6 0z"/><path d="M5 13v7h14v-7"/>'),
  user: s('<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>'),
  users: s('<circle cx="9" cy="8" r="3.5"/><path d="M2 20a7 7 0 0 1 14 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 13.5a7 7 0 0 1 4 6.5"/>'),
  group: s('<circle cx="12" cy="12" r="8"/><circle cx="12" cy="4" r="2"/><circle cx="19" cy="16" r="2"/><circle cx="5" cy="16" r="2"/>'),
  back: s('<path d="M15 5l-7 7 7 7"/>'),
  close: s('<path d="M6 6l12 12M18 6L6 18"/>'),
  out: s('<path d="M7 17L17 7M8 7h9v9"/>'),
  in: s('<path d="M17 7L7 17M16 17H7V8"/>'),
  plus: s('<path d="M12 5v14M5 12h14"/>'),
  minus: s('<path d="M5 12h14"/>'),
  spark: s('<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6"/>'),
  check: s('<path d="M5 12l5 5 9-10"/>'),
  chevron: s('<path d="M9 6l6 6-6 6"/>'),
  fingerprint: s('<path d="M12 11v3a9 9 0 0 1-1.2 4.5"/><path d="M8.5 12.5a3.5 3.5 0 0 1 7 0v1.5a13 13 0 0 1-.8 4.5"/><path d="M5.5 15a7 7 0 0 1-.5-2.5 7 7 0 0 1 14 0v1"/><path d="M7.5 19.5a10 10 0 0 0 1-4.5v-2.5"/><path d="M6.2 6.5A8.9 8.9 0 0 1 12 4.5a9 9 0 0 1 6 2.3"/>'),
  phone: s('<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/>'),
  whatsapp: s('<path d="M3 21l1.7-4.7A8.5 8.5 0 1 1 7.9 19.6z"/><path d="M9 8.5c0 3.6 2.9 6.5 6.5 6.5l.8-1.6-2-1-.9.9a4 4 0 0 1-2.2-2.2l.9-.9-1-2z"/>'),
  camera: s('<path d="M22 18a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h3l2-3h6l2 3h3a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="3.5"/>'),
  pencil: s('<path d="M16.5 3.5l4 4L8 20H4v-4z"/>'),
  trash: s('<path d="M4 7h16M10 11v6M14 11v6M5 7l1 13h12l1-13M9 7V4h6v3"/>'),
  backspace: s('<path d="M21 5H8l-6 7 6 7h13a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1z"/><path d="M17 9l-6 6M11 9l6 6"/>'),
  lock: s('<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>'),
  calendar: s('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>'),
  clock: s('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
  copy: s('<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>'),
  link: s('<path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1"/><path d="M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/>'),
  eye: s('<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>'),
  eyeOff: s('<path d="M3 3l18 18"/><path d="M10.6 5.1A10 10 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.2 4.1M6.6 6.6A17 17 0 0 0 2 12s3.5 7 10 7a9.6 9.6 0 0 0 5.4-1.6"/>'),
  logout: s('<path d="M15 4h4v16h-4"/><path d="M10 8l-4 4 4 4M6 12h10"/>'),
  grid: s('<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>'),
  hand: s('<path d="M18 11V6a2 2 0 0 0-4 0v5M14 10V4a2 2 0 0 0-4 0v6M10 10.5V6a2 2 0 0 0-4 0v8"/><path d="M18 8a2 2 0 0 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.9-6-2.4l-3.6-3.6a2 2 0 0 1 2.8-2.8L7 15"/>'),
  // Category icons
  scissors: s('<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4L8.1 15.9M14.5 14.5L20 20M8.1 8.1L12 12"/>'),
  shirt: s('<path d="M20.4 6.6L16 4h-1.5a2.5 2.5 0 0 1-5 0H8L3.6 6.6l1.6 4.2L8 10v10h8V10l2.8.8z"/>'),
  motorbike: s('<circle cx="5" cy="17" r="3"/><circle cx="19" cy="17" r="3"/><path d="M5 17l4-6h6l4 6M15 11l-1.5-4H17M9 11l-2-3H5"/>'),
  broom: s('<path d="M20 3l-7.5 7.5"/><path d="M10 9l5 5-1.8 6.5C9.5 20 6 18 4 15z"/><path d="M7.5 17.5L6 19M10.5 19l-1 1.5"/>'),
  wrench: s('<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.8-3.8a6 6 0 0 1-7.9 7.9l-6.9 6.9a2.1 2.1 0 0 1-3-3l6.9-6.9a6 6 0 0 1 7.9-7.9z"/>'),
  book: s('<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>'),
  fish: s('<path d="M2 12c3.5-5.5 10-6.5 14.5-3L21 6v12l-4.5-3C12 18.5 5.5 17.5 2 12z"/><circle cx="7.5" cy="11" r="1"/>'),
  box: s('<path d="M21 8l-9-5-9 5v8l9 5 9-5z"/><path d="M3 8l9 5 9-5M12 13v8"/>'),
};

// Category → icon and tile tint. Order is the order shown in pickers.
export const CATEGORIES = [
  { key: 'grooming', label: 'Barber & hair', icon: I.scissors, tint: '#ffece2' },
  { key: 'tailoring', label: 'Tailor', icon: I.shirt, tint: '#efe8ff' },
  { key: 'transport', label: 'Transport', icon: I.motorbike, tint: '#e3f0ff' },
  { key: 'food', label: 'Food', icon: I.fish, tint: '#e3f6ea' },
  { key: 'cleaning', label: 'Cleaning', icon: I.broom, tint: '#fff3d1' },
  { key: 'repairs', label: 'Repairs', icon: I.wrench, tint: '#eceff3' },
  { key: 'teaching', label: 'Teaching', icon: I.book, tint: '#ffe6ef' },
  { key: 'labour', label: 'Labour', icon: I.box, tint: '#f3eadf' },
  { key: 'other', label: 'Other', icon: I.spark, tint: '#f1f1f1' },
];
export const cat = (key) => CATEGORIES.find((c) => c.key === key) || CATEGORIES[CATEGORIES.length - 1];

export const circlesArt = `<svg viewBox="0 0 132 132" fill="none" aria-hidden="true">
  <circle cx="66" cy="66" r="44" stroke="#111" stroke-width="3"/>
  <circle cx="66" cy="22" r="14" fill="#fe5511" stroke="#111" stroke-width="3"/>
  <circle cx="104" cy="88" r="14" fill="#ffece2" stroke="#111" stroke-width="3"/>
  <circle cx="28" cy="88" r="14" fill="#fff" stroke="#111" stroke-width="3"/>
  <circle cx="66" cy="66" r="10" fill="#111"/>
</svg>`;
