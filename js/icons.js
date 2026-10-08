// Inline stroke icons (24px grid, 2px stroke).
const s = (d) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;

export const I = {
  home: s('<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/>'),
  market: s('<path d="M4 9l1-5h14l1 5"/><path d="M4 9h16v2a3 3 0 0 1-6 0 3 3 0 0 1-4 0 3 3 0 0 1-6 0z"/><path d="M5 13v7h14v-7"/>'),
  user: s('<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>'),
  users: s('<circle cx="9" cy="8" r="3.5"/><path d="M2 20a7 7 0 0 1 14 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 13.5a7 7 0 0 1 4 6.5"/>'),
  group: s('<circle cx="12" cy="12" r="8"/><circle cx="12" cy="4" r="2"/><circle cx="19" cy="16" r="2"/><circle cx="5" cy="16" r="2"/>'),
  back: s('<path d="M15 5l-7 7 7 7"/>'),
  arrow: s('<path d="M7 17L17 7M8 7h9v9"/>'),
  plus: s('<path d="M12 5v14M5 12h14"/>'),
  spark: s('<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6"/>'),
  check: s('<path d="M5 12l5 5 9-10"/>'),
  chevron: s('<path d="M9 6l6 6-6 6"/>'),
  down: s('<path d="M6 9l6 6 6-6"/>'),
  swap: s('<path d="M7 4v16M7 4L4 7M7 4l3 3"/><path d="M17 20V4M17 20l-3-3M17 20l3-3"/>'),
};

export const circlesArt = `<svg viewBox="0 0 132 132" fill="none" aria-hidden="true">
  <circle cx="66" cy="66" r="44" stroke="#111" stroke-width="3"/>
  <circle cx="66" cy="22" r="14" fill="#fe5511" stroke="#111" stroke-width="3"/>
  <circle cx="104" cy="88" r="14" fill="#ffece2" stroke="#111" stroke-width="3"/>
  <circle cx="28" cy="88" r="14" fill="#fff" stroke="#111" stroke-width="3"/>
  <circle cx="66" cy="66" r="10" fill="#111"/>
</svg>`;
