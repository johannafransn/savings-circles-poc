// Shared state for the member app and the admin site. Both read and write the
// same localStorage key, so a member who joins in one tab shows up for the
// admin in another.
import * as D from './data.js';

export const STORE_KEY = 'savings-circles-poc:v5';
export const HOUR = 3600 * 1000;
export const DAY = 24 * HOUR;
const MINT_CAP_HOURS = 14 * 24;

const clone = (x) => JSON.parse(JSON.stringify(x));
export const isoDaysAgo = (n) => new Date(Date.now() - n * DAY).toISOString().slice(0, 10);

export function seed() {
  const now = Date.now();
  const lastMint = {};
  for (const m of D.MEMBERS) lastMint[m.id] = now - (D.LAST_MINT_HOURS_AGO[m.id] ?? 12) * HOUR;
  const dated = (rows, key = 'when') => rows.map(({ daysAgo, ...r }) => ({ ...r, [key]: isoDaysAgo(daysAgo ?? 0) }));
  return {
    session: null, // { memberId }
    adminSession: null, // { memberId }
    account: null, // member created on this device through the join link
    draft: null, // onboarding in progress
    community: clone(D.COMMUNITY),
    members: D.MEMBERS.map(({ joinedDaysAgo, ...m }) => ({ ...m, joined: m.joined || isoDaysAgo(joinedDaysAgo) })),
    services: clone(D.SERVICES).map((s) => ({ photo: null, hidden: false, ...s })),
    requests: dated(D.REQUESTS).map((r) => ({ hidden: false, ...r })),
    activity: dated(D.ACTIVITY),
    lastMint,
  };
}

function load() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

// Live binding: importers always see the current state object.
export let S = load() || seed();

export function save() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(S)); } catch { /* private mode or quota */ }
}
export function resetState(keep = {}) { S = { ...seed(), ...keep }; save(); }
export function reloadState() { S = load() || seed(); }

/* ---------------------------------------------------------------- helpers */
export const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const tok = (n) => Number(n).toLocaleString('en-KE', { maximumFractionDigits: 2 });
export const fmtDate = (iso) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
export const initials = (name) => (name || '?').split(/\s+/).map((p) => p[0]).slice(0, 2).join('').toUpperCase();
export const member = (id) => S.members.find((m) => m.id === id);
export const firstName = (m) => (m?.name || '').split(' ')[0];
export const today = () => new Date().toISOString().slice(0, 10);
export const uid = (p) => `${p}${Math.random().toString(36).slice(2, 8)}`;

export const mintable = (id) => {
  const hours = (Date.now() - (S.lastMint[id] ?? Date.now())) / HOUR;
  return Math.max(0, Math.min(hours, MINT_CAP_HOURS));
};

export function pay(from, to, amount, what) {
  from.balance = Math.round((from.balance - amount) * 100) / 100;
  to.balance = Math.round((to.balance + amount) * 100) / 100;
  S.activity.unshift({ kind: 'pay', from: from.id, to: to.id, amount, what, when: today() });
}

// WhatsApp deep link. Phone numbers in the demo are placeholders.
export const waLink = (phone, text) => `https://wa.me/${String(phone || '').replace(/\D/g, '')}?text=${encodeURIComponent(text)}`;
export const waShare = (text) => `https://wa.me/?text=${encodeURIComponent(text)}`;

// Absolute join link for the member app, relative to wherever the site is hosted.
export function joinLink(base = location.href) {
  const page = base.split('#')[0].split('?')[0].replace(/admin\/(index\.html)?$/, '');
  const url = new URL('./', page);
  return `${url.href}#/join?ref=${encodeURIComponent(S.community.inviteCode)}`;
}

export const avatarHtml = (m, cls = '', style = '') => (m?.photo
  ? `<img class="avatar ${cls}" style="${style}" src="${m.photo}" alt="" />`
  : `<div class="avatar ${cls}" style="${style}" aria-hidden="true">${initials(m?.name)}</div>`);

// Downscale a picked image to a small JPEG data URL so it fits in localStorage.
export function readImage(file, max = 480) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * scale);
      c.height = Math.round(img.height * scale);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL('image/jpeg', 0.72));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not read that image')); };
    img.src = url;
  });
}
