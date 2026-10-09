import * as D from './data.js';
import { I, CATEGORIES, cat, circlesArt } from './icons.js';
import {
  S, save, resetState, reloadState, STORE_KEY, esc, tok, fmtDate, member, firstName, today, uid,
  mintable, pay, waLink, avatarHtml, readImage,
} from './store.js';

/* ========================================================================= basics */
const $app = document.getElementById('app');
const $tabbar = document.getElementById('tabbar');
const $sheet = document.getElementById('sheet-root');
const $toast = document.getElementById('toast');
const T = () => esc(S.community.token);
const me = () => member(S.session?.memberId);
const coin = (cls = '') => `<span class="token coin ${cls}">A</span>`;

let toastTimer;
function toast(msg) {
  $toast.textContent = msg;
  $toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { $toast.hidden = true; }, 2600);
}
function openSheet(html) {
  $sheet.innerHTML = `<div class="sheet-backdrop" data-act="close-sheet"></div>
    <div class="sheet" role="dialog" aria-modal="true"><div class="grab"></div>${html}</div>`;
}
const closeSheet = () => { $sheet.innerHTML = ''; };
const go = (hash) => { location.hash = hash; };
const inviter = () => member(S.community.adminId);

/* ========================================================================= passkeys
   Real WebAuthn when the browser supports it, mocked otherwise. Always started
   from a tap and always with a timeout, so a stuck prompt can't hang the app. */
const b64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));
const unb64 = (str) => Uint8Array.from(atob(str), (c) => c.charCodeAt(0));
const hasWebAuthn = () => !!(window.PublicKeyCredential && navigator.credentials?.create);

async function withTimeout(fn) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 60000);
  try { return await fn(ctrl.signal); } finally { clearTimeout(t); }
}
async function createPasskey(name) {
  if (!hasWebAuthn()) return { mocked: true };
  try {
    const cred = await withTimeout((signal) => navigator.credentials.create({
      signal,
      publicKey: {
        challenge: crypto.getRandomValues(new Uint8Array(32)),
        rp: { name: 'Apwoche' },
        user: { id: crypto.getRandomValues(new Uint8Array(16)), name: name || 'member', displayName: name || 'Apwoche member' },
        pubKeyCredParams: [{ type: 'public-key', alg: -7 }, { type: 'public-key', alg: -257 }],
        authenticatorSelection: { residentKey: 'preferred', userVerification: 'preferred' },
        timeout: 60000,
      },
    }));
    return { credId: b64(cred.rawId) };
  } catch (e) {
    if (e.name === 'NotAllowedError' || e.name === 'AbortError') throw e;
    return { mocked: true }; // e.g. insecure origin: fall back to the demo
  }
}
async function getPasskey(credId) {
  if (!hasWebAuthn() || !credId) return { mocked: true };
  await withTimeout((signal) => navigator.credentials.get({
    signal,
    publicKey: {
      challenge: crypto.getRandomValues(new Uint8Array(32)),
      allowCredentials: [{ type: 'public-key', id: unb64(credId) }],
      userVerification: 'preferred',
      timeout: 60000,
    },
  }));
  return { ok: true };
}

/* ========================================================================= keypad (PIN, OTP, phone) */
let pad = { value: '', max: 4, kind: 'pin' };
const padDisplay = () => {
  if (pad.kind === 'phone') {
    const d = pad.value.padEnd(9, '·');
    return `<div class="phone-display"><span class="muted">+254</span> ${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}</div>`;
  }
  const box = pad.kind === 'otp' ? 'otp-box' : 'pin-dot';
  return `<div class="pin-row ${pad.kind}">${Array.from({ length: pad.max }, (_, i) => `<span class="${box} ${i < pad.value.length ? 'on' : ''}">${pad.kind === 'otp' ? esc(pad.value[i] || '') : ''}</span>`).join('')}</div>`;
};
const padValid = () => (pad.kind === 'phone' ? /^[71]\d{8}$/.test(pad.value) : pad.value.length === pad.max);
const keypad = () => `<div class="keypad">${['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'back'].map((k) => (k === '' ? '<span></span>'
  : `<button type="button" data-key="${k}" aria-label="${k === 'back' ? 'Delete' : k}">${k === 'back' ? I.backspace : k}</button>`)).join('')}</div>`;
function startPad(kind, max, value = '') { pad = { kind, max, value }; }
function refreshPad() {
  const el = $app.querySelector('[data-pad]');
  if (el) el.innerHTML = padDisplay();
  const next = $app.querySelector('[data-pad-next]');
  if (next) next.disabled = !padValid();
}

/* ========================================================================= shared bits */
const stepBar = (n) => `<div class="steps" aria-label="Step ${n} of 3">${[1, 2, 3].map((i) => `<span class="${i <= n ? 'on' : ''}"></span>`).join('')}</div>`;
const flow = ({ back, step, icon, title, sub = '', body = '', foot = '' }) => `
  <div class="flow">
    <div class="flow-top">
      ${back ? `<button class="icon-btn plain" data-go="${back}" aria-label="Back">${I.back}</button>` : '<span style="width:40px"></span>'}
      ${step ? stepBar(step) : ''}
      <span style="width:40px"></span>
    </div>
    ${icon ? `<div class="flow-icon">${icon}</div>` : ''}
    <h1 class="flow-title">${title}</h1>
    ${sub ? `<p class="flow-sub">${sub}</p>` : ''}
    <div class="flow-body">${body}</div>
    <div class="flow-foot">${foot}</div>
  </div>`;

const catTile = (key, photo, cls = '') => (photo
  ? `<div class="tile ${cls}"><img src="${photo}" alt="" /></div>`
  : `<div class="tile ${cls}" style="background:${cat(key).tint}">${cat(key).icon}</div>`);

function categoryPicker(selected) {
  return `<div class="cat-grid">${CATEGORIES.map((c) => `
    <label class="cat-pick"><input type="radio" name="category" value="${c.key}" ${c.key === selected ? 'checked' : ''} required />
      <span class="cat-ico" style="background:${c.tint}">${c.icon}</span><span class="cat-lbl">${c.label}</span></label>`).join('')}</div>`;
}
const stepper = (name, value, step, min, max, suffix) => `
  <div class="stepper">
    <button type="button" class="icon-btn" data-step="${name}:-${step}" aria-label="Less">${I.minus}</button>
    <div class="stepper-val"><input name="${name}" type="number" inputmode="numeric" min="${min}" max="${max}" step="1" value="${value}" required />${suffix}</div>
    <button type="button" class="icon-btn" data-step="${name}:${step}" aria-label="More">${I.plus}</button>
  </div>`;

let pendingPhoto; // photo picked in the open form, as a data URL
function photoPicker(current, round = false) {
  return `<label class="photo-pick ${round ? 'round' : ''}">
    <input type="file" accept="image/*" capture="environment" data-photo hidden />
    <span class="photo-preview">${current ? `<img src="${current}" alt="" />` : `${I.camera}<span class="small">Add photo</span>`}</span></label>`;
}

function serviceFields(s = {}) {
  const days = s.days || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  return `
    <div class="field-row">${photoPicker(s.photo)}<div class="grow small muted">A photo helps people find you. No photo? We show the icon.</div></div>
    <label class="label">What kind of service?</label>${categoryPicker(s.category)}
    <label class="label">Name it</label>
    <div class="field"><input name="title" value="${esc(s.title || '')}" placeholder="e.g. Haircut" maxlength="32" required /></div>
    <label class="label">Short description</label>
    <div class="field"><input name="description" value="${esc(s.description || '')}" placeholder="e.g. Clean cut at my shop" maxlength="48" /></div>
    <label class="label">Price per session</label>
    ${stepper('price', s.price ?? 150, 50, 0, 100000, `${coin()}<span class="small">${T()}</span>`)}
    <p class="hint">1 ${T()} = 1 KES</p>
    <label class="label">Days you work</label>
    <div class="day-row">${D.DAYS.map((d) => `<label class="day"><input type="checkbox" name="days" value="${d}" ${days.includes(d) ? 'checked' : ''}/><span>${d.slice(0, 2)}</span></label>`).join('')}</div>
    <label class="label">Hours per day</label>
    ${stepper('hoursPerDay', s.hoursPerDay ?? 6, 1, 1, 16, `${I.clock}<span class="small">hours</span>`)}`;
}
function readService(form) {
  const fd = new FormData(form);
  return {
    category: fd.get('category'),
    title: String(fd.get('title') || '').trim(),
    description: String(fd.get('description') || '').trim(),
    price: Math.max(0, Number(fd.get('price')) || 0),
    days: fd.getAll('days'),
    hoursPerDay: Math.max(1, Number(fd.get('hoursPerDay')) || 1),
  };
}

/* ========================================================================= entry views */
function vNoLink(_, q) {
  const bad = q.get('bad');
  return flow({
    icon: `<span class="big-ico wa">${I.whatsapp}</span>`,
    title: bad ? 'This link doesn\'t work' : 'Ask your chama admin',
    sub: bad ? 'Ask your admin to send a new link on WhatsApp.' : `${T()} is invite only. Your admin sends you a link on WhatsApp.`,
    foot: `<button class="btn secondary" data-go="#/login">${I.lock} I already joined</button>
      <button class="btn ghost small" data-go="#/join?ref=${encodeURIComponent(S.community.inviteCode)}">Demo: open the invite link</button>`,
  });
}

function vJoin(_, q) {
  if ((q.get('ref') || '').toUpperCase() !== S.community.inviteCode) { go('#/no-link?bad=1'); return ''; }
  const g = inviter();
  return flow({
    icon: `<div class="invite-art">${circlesArt}${avatarHtml(g, 'lg invite-face')}</div>`,
    title: `${esc(firstName(g))} invited you`,
    sub: `Join ${T()}. Buy and sell with your neighbours.`,
    foot: `<button class="btn" data-act="start-join">${I.out} Join</button>`,
  });
}

function vOnboardSecure() {
  return flow({
    back: `#/join?ref=${encodeURIComponent(S.community.inviteCode)}`, step: 1,
    icon: `<span class="big-ico">${I.fingerprint}</span>`,
    title: 'Secure your account',
    sub: 'Use your fingerprint or face. No password to remember.',
    foot: `<button class="btn" data-act="create-passkey">${I.fingerprint} Use fingerprint or face</button>
      <button class="btn ghost" data-go="#/onboard/phone">${I.phone} Use phone number instead</button>`,
  });
}

function vPhone(next, back, step) {
  if (pad.kind !== 'phone') startPad('phone', 9, (S.draft?.phone || '').replace(/^\+?254/, ''));
  return flow({
    back, step, title: 'Your phone number', sub: 'We send you a code by SMS.',
    body: `<div data-pad>${padDisplay()}</div>${keypad()}`,
    foot: `<button class="btn" data-pad-next data-act="${next}" ${padValid() ? '' : 'disabled'}>Continue</button>`,
  });
}
const vOnboardPhone = () => vPhone('phone-next', '#/onboard/secure', 1);
const vLoginPhone = () => vPhone('login-phone-next', '#/login', 0);

function vOnboardOtp() {
  if (pad.kind !== 'otp') {
    startPad('otp', 6);
    setTimeout(() => { if (pad.kind === 'otp' && !pad.value) { pad.value = '482913'; refreshPad(); toast('Code filled from SMS'); } }, 900);
  }
  return flow({
    back: '#/onboard/phone', step: 1, title: 'Enter the code',
    sub: `Sent to +254 ${esc((S.draft?.phone || '').replace(/^254/, ''))}`,
    body: `<div data-pad>${padDisplay()}</div>${keypad()}`,
    foot: `<button class="btn" data-pad-next data-act="otp-next" ${padValid() ? '' : 'disabled'}>Continue</button>`,
  });
}

function vPin(next, back, step, title, sub) {
  if (pad.kind !== 'pin') startPad('pin', 4);
  return flow({
    back, step, icon: `<span class="big-ico">${I.lock}</span>`, title, sub,
    body: `<div data-pad>${padDisplay()}</div>${keypad()}`,
    foot: `<button class="btn" data-pad-next data-act="${next}" ${padValid() ? '' : 'disabled'}>Continue</button>`,
  });
}
const vOnboardPin = () => vPin('pin-next', '#/onboard/otp', 1, 'Create a PIN', '4 numbers. Keep it secret.');
const vLoginPin = () => vPin('login-pin-next', '#/login/phone', 0, 'Enter your PIN', '');

function vOnboardProfile() {
  const d = S.draft;
  return flow({
    back: '#/onboard/secure', step: 2, title: 'About you',
    body: `<form data-form="profile" id="profile-form" class="stack">
      <div class="center">${photoPicker(d.photo, true)}</div>
      <label class="label">Your name</label>
      <div class="field"><span class="field-ico">${I.user}</span><input name="name" value="${esc(d.name || '')}" placeholder="e.g. Wanjiru Achola" autocomplete="name" required /></div>
      <label class="label">Phone number</label>
      <div class="field"><span class="field-ico">${I.phone}</span><input name="phone" type="tel" value="${d.phone ? `+${esc(d.phone)}` : ''}" placeholder="+254 7…" autocomplete="tel" required /></div>
    </form>`,
    foot: '<button class="btn" type="submit" form="profile-form">Continue</button>',
  });
}

function vOnboardService() {
  const n = S.draft.services.length;
  return flow({
    back: '#/onboard/profile', step: 3, title: n ? 'Add another service?' : 'What can you do?',
    sub: n ? `${n} added: ${S.draft.services.map((s) => esc(s.title)).join(', ')}` : 'Neighbours pay you in Apwoche for it.',
    body: `<form data-form="onboard-service" id="svc-form" class="stack">${serviceFields()}</form>`,
    foot: `<div class="btn-row"><button class="btn secondary" type="submit" form="svc-form" data-then="more">${I.plus} Add more</button>
      <button class="btn" type="submit" form="svc-form" data-then="done">${I.check} Done</button></div>
      <button class="btn ghost" data-act="finish-onboarding">${n ? 'Finish' : 'Skip for now'}</button>`,
  });
}

function vLogin() {
  const acc = S.account && member(S.account.memberId);
  const who = acc || member(D.DEMO_MEMBER);
  return flow({
    back: '#/no-link',
    icon: `<div class="invite-art solo">${avatarHtml(who, 'lg')}</div>`,
    title: `Welcome back${acc ? `, ${esc(firstName(acc))}` : ''}`,
    sub: acc ? '' : `Demo: logs in as ${esc(who.name)}.`,
    foot: `<button class="btn" data-act="login-passkey">${I.fingerprint} Use fingerprint or face</button>
      <button class="btn ghost" data-go="#/login/phone">${I.phone} Use phone number</button>`,
  });
}

/* ========================================================================= member views */
function txRow(a, m) {
  if (a.kind === 'mint') {
    return `<div class="tx"><span class="tx-ico mint">${I.spark}</span><div class="grow"><strong>Minted</strong><div class="sub">${fmtDate(a.when)}</div></div><span class="tx-amt in">+${tok(a.amount)}</span></div>`;
  }
  const out = a.from === m.id;
  const other = member(out ? a.to : a.from);
  return `<div class="tx">${avatarHtml(other, 'tx-av')}<span class="tx-dir ${out ? 'out' : 'in'}">${out ? I.out : I.in}</span>
    <div class="grow"><strong class="ellipsis">${esc(other?.name || 'Member')}</strong><div class="sub ellipsis">${esc(a.what || '')} · ${fmtDate(a.when)}</div></div>
    <span class="tx-amt ${out ? 'out' : 'in'}">${out ? '−' : '+'}${tok(a.amount)}</span></div>`;
}

function vHome() {
  const m = me();
  const txs = S.activity.filter((a) => a.from === m.id || a.to === m.id);
  return `
    <div class="topbar">${avatarHtml(m)}<div class="grow"><h3>${esc(firstName(m))}</h3></div></div>
    <div class="hero accent balance">
      <div class="big">${coin('lg')} <span>${tok(m.balance)}</span></div>
      <button class="btn secondary mint-btn" data-act="mint">${I.spark} Mint <strong data-mint>+${mintable(m.id).toFixed(2)}</strong></button>
    </div>
    <div class="box tx-list">${txs.length ? txs.map((a) => txRow(a, m)).join('') : `<div class="empty">${I.spark}<div>Tap Mint to get your first ${T()}</div></div>`}</div>`;
}

function serviceCard(s, m) {
  const o = member(s.memberId);
  const own = s.memberId === m.id;
  const wa = waLink(o.phone, `Hi ${firstName(o)}, I saw "${s.title}" on ${S.community.token}. Are you free?`);
  return `<article class="mcard">
    ${catTile(s.category, s.photo)}
    <div class="mbody">
      <h3 class="clamp1">${esc(s.title)}</h3>
      ${s.description ? `<p class="clamp2">${esc(s.description)}</p>` : ''}
      <div class="mprice">${coin()}${tok(s.price)}<span>/ session</span></div>
      <div class="mwho">${avatarHtml(o, 'xs')}<span class="ellipsis">${own ? 'You' : esc(firstName(o))}</span></div>
      <div class="mactions">${own
        ? `<button class="btn sm secondary" data-go="#/offer/${s.id}">${I.pencil} Edit</button>`
        : `<a class="icon-btn wa" href="${wa}" target="_blank" rel="noopener" aria-label="Chat on WhatsApp">${I.whatsapp}</a><button class="btn sm" data-act="pay-service" data-id="${s.id}">Pay</button>`}</div>
    </div></article>`;
}

function requestCard(r, m) {
  const o = member(r.memberId);
  const own = r.memberId === m.id;
  const wa = waLink(o.phone, `Hi ${firstName(o)}, I can help with "${r.title}". When do you need it?`);
  let actions;
  if (own) actions = r.status === 'open' ? `<button class="btn sm secondary" data-act="close-request" data-id="${r.id}">${I.close} Close</button>` : '<span class="badge">Someone is on it</span>';
  else if (r.status === 'open') actions = `<a class="icon-btn wa" href="${wa}" target="_blank" rel="noopener" aria-label="Chat on WhatsApp">${I.whatsapp}</a><button class="btn sm" data-act="take-request" data-id="${r.id}">${I.hand} I can do this</button>`;
  else actions = `<span class="badge">${r.takenBy === m.id ? 'You took it' : 'Taken'}</span>`;
  return `<article class="rcard">
    ${catTile(r.category, null, 'sm')}
    <div class="grow">
      <h3>${esc(r.title)}</h3>
      ${r.description ? `<p class="clamp2">${esc(r.description)}</p>` : ''}
      <div class="rmeta"><span class="mprice">${coin()}${tok(r.budget)}</span><span class="mwho">${avatarHtml(o, 'xs')}${own ? 'You' : esc(firstName(o))}</span></div>
      <div class="mactions">${actions}</div>
    </div></article>`;
}

function vMarket(_, q) {
  const m = me();
  const tab = q.get('tab') === 'requests' ? 'requests' : 'services';
  const c = q.get('cat');
  const qs = (o) => { const p = new URLSearchParams({ ...(tab === 'requests' ? { tab } : {}), ...(c ? { cat: c } : {}), ...o }); [...p].forEach(([k, v]) => !v && p.delete(k)); const s = p.toString(); return `#/market${s ? `?${s}` : ''}`; };
  const services = S.services.filter((s) => !s.hidden && (!c || s.category === c));
  const requests = S.requests.filter((r) => !r.hidden && r.status !== 'closed' && (!c || r.category === c));
  const chips = `<div class="chips">
    <a class="chip-cat ${!c ? 'on' : ''}" href="${qs({ cat: '' })}"><span class="cat-ico">${I.grid}</span><span>All</span></a>
    ${CATEGORIES.map((x) => `<a class="chip-cat ${c === x.key ? 'on' : ''}" href="${qs({ cat: x.key })}"><span class="cat-ico" style="background:${x.tint}">${x.icon}</span><span>${x.label.split(' ')[0]}</span></a>`).join('')}
  </div>`;
  const emptyServices = `<div class="empty">${c ? cat(c).icon : I.market}<div>Nobody offers this yet</div>
    <button class="btn sm" data-go="#/request/new${c ? `?cat=${c}` : ''}">${I.plus} Ask for it</button></div>`;
  return `<div class="topbar"><div class="grow"><h1 style="margin:0">Market</h1></div></div>
    <div class="segment">
      <button class="${tab === 'services' ? 'on' : ''}" data-go="${qs({ tab: '' })}">Services</button>
      <button class="${tab === 'requests' ? 'on' : ''}" data-go="${qs({ tab: 'requests' })}">Requests</button>
    </div>
    ${chips}
    ${tab === 'services'
      ? (services.length ? `<div class="mgrid">${services.map((s) => serviceCard(s, m)).join('')}</div>` : emptyServices)
      : `<button class="ask-banner" data-go="#/request/new${c ? `?cat=${c}` : ''}">${I.plus}<span><strong>Need something?</strong><br/><span class="small muted">Ask and neighbours will offer</span></span></button>
         ${requests.length ? requests.map((r) => requestCard(r, m)).join('') : '<div class="empty">No requests yet</div>'}`}
    <button class="fab" data-act="new-post" aria-label="Post">${I.plus}</button>`;
}

function vOffer({ id }) {
  const s = id && id !== 'new' ? S.services.find((x) => x.id === id && x.memberId === me().id) : null;
  if (id && id !== 'new' && !s) { go('#/me'); return ''; }
  return `${topbarBack(s ? 'Edit service' : 'Offer a service', s ? '#/me' : '#/market')}
    <form data-form="offer" data-id="${s?.id || ''}" class="stack">${serviceFields(s || {})}
      <div class="mt"><button class="btn" type="submit">${I.check} ${s ? 'Save' : 'Post'}</button></div>
      ${s ? `<button class="btn ghost danger" type="button" data-act="delete-service" data-id="${s.id}">${I.trash} Delete</button>` : ''}
    </form>`;
}

function vRequestNew(_, q) {
  return `${topbarBack('Ask for a service', '#/market?tab=requests')}
    <form data-form="request" class="stack">
      <label class="label">What kind?</label>${categoryPicker(q.get('cat') || '')}
      <label class="label">What do you need?</label>
      <div class="field"><input name="title" placeholder="e.g. Fix my roof" maxlength="32" required /></div>
      <label class="label">Short description</label>
      <div class="field"><input name="description" placeholder="e.g. Saturday, about 2 hours" maxlength="48" /></div>
      <label class="label">You pay</label>
      ${stepper('budget', 200, 50, 0, 100000, `${coin()}<span class="small">${T()}</span>`)}
      <p class="hint">1 ${T()} = 1 KES</p>
      <div class="mt"><button class="btn" type="submit">${I.check} Post request</button></div>
    </form>`;
}

function vMe() {
  const m = me();
  const mine = S.services.filter((s) => s.memberId === m.id);
  const reqs = S.requests.filter((r) => r.memberId === m.id && r.status !== 'closed');
  return `
    <div class="center" style="margin:6px 0 18px">${photoPicker(m.photo, true)}
      <h2 style="margin:10px 0 2px">${esc(m.name)}</h2><div class="muted small">${esc(m.phone)}</div></div>
    <div class="topbar"><div class="grow"><h3>${I.market.replace('<svg', '<svg width="18" height="18" style="vertical-align:-3px;margin-right:6px"')}My services</h3></div>
      <button class="btn sm" data-go="#/offer/new">${I.plus} Add</button></div>
    ${mine.length ? mine.map((s) => `<a class="mini-card" href="#/offer/${s.id}">${catTile(s.category, s.photo, 'sm')}<div class="grow"><strong class="ellipsis">${esc(s.title)}</strong>
        <div class="sub">${coin()} ${tok(s.price)} · ${s.days.map((d) => d.slice(0, 2)).join(' ')}</div></div><span class="icon-btn plain">${I.pencil}</span></a>`).join('')
      : `<button class="ask-banner" data-go="#/offer/new">${I.plus}<span><strong>Add what you can do</strong></span></button>`}
    ${reqs.length ? `<div class="topbar mt"><div class="grow"><h3>My requests</h3></div></div>
      ${reqs.map((r) => `<div class="mini-card">${catTile(r.category, null, 'sm')}<div class="grow"><strong class="ellipsis">${esc(r.title)}</strong><div class="sub">${coin()} ${tok(r.budget)} · ${r.status === 'open' ? 'Open' : 'Someone is on it'}</div></div>
        ${r.status === 'open' ? `<button class="icon-btn" data-act="close-request" data-id="${r.id}" aria-label="Close request">${I.close}</button>` : ''}</div>`).join('')}` : ''}
    <div class="mt stack">
      <button class="btn secondary" data-act="logout">${I.logout} Log out</button>
      <button class="btn ghost small" data-act="reset">Reset demo</button>
    </div>`;
}

const topbarBack = (title, back) => `<div class="topbar"><button class="icon-btn plain" data-go="${back}" aria-label="Back">${I.back}</button><div class="grow"><h3>${title}</h3></div></div>`;

/* ========================================================================= sheets */
function sheetPay(s) {
  const o = member(s.memberId);
  const m = me();
  openSheet(`<div class="center">${avatarHtml(o, 'lg', 'margin:0 auto 8px')}<h2 style="margin:0">${esc(firstName(o))}</h2><div class="muted small">${esc(s.title)}</div></div>
    <form data-form="pay" data-id="${s.id}" class="stack mt">
      ${stepper('amount', s.price, 50, 1, 100000, `${coin()}<span class="small">${T()}</span>`)}
      <p class="hint">You have ${tok(m.balance)}</p>
      <button class="btn" type="submit">${I.out} Send</button>
    </form>`);
}
function sheetNewPost() {
  openSheet(`<div class="post-choice">
    <button class="choice accent" data-go="#/offer/new"><span class="ico">${I.market}</span><span class="grow"><h3>Offer a service</h3><span class="small muted">Something you can do</span></span>${I.chevron}</button>
    <button class="choice" data-go="#/request/new"><span class="ico">${I.hand}</span><span class="grow"><h3>Ask for a service</h3><span class="small muted">Something you need</span></span>${I.chevron}</button>
  </div>`);
}

/* ========================================================================= actions */
function finishOnboarding() {
  const d = S.draft;
  const m = { id: uid('m'), name: d.name, phone: d.phone ? `+${d.phone}` : d.phoneText || '', joined: today(), via: 'link', balance: 0, photo: d.photo || null };
  S.members.push(m);
  for (const s of d.services) S.services.unshift({ id: uid('s'), memberId: m.id, photo: null, hidden: false, ...s });
  S.lastMint[m.id] = Date.now();
  S.account = { memberId: m.id, credId: d.credId || null, pin: d.pin || null };
  S.session = { memberId: m.id };
  S.draft = null;
  go('#/home');
  toast(`Karibu, ${firstName(m)}!`);
}

const actions = {
  'close-sheet': closeSheet,
  'start-join': () => { S.draft = { services: [] }; go('#/onboard/secure'); },
  'create-passkey': async (el) => {
    el.disabled = true; el.innerHTML = `${I.fingerprint} Waiting…`;
    try {
      const r = await createPasskey(S.draft?.name);
      S.draft.method = 'passkey';
      S.draft.credId = r.credId || null;
      save();
      go('#/onboard/profile');
      if (r.mocked) toast('Passkey saved (demo)');
    } catch {
      el.disabled = false; el.innerHTML = `${I.fingerprint} Use fingerprint or face`;
      toast('Not saved. Try again or use your phone number.');
    }
  },
  'phone-next': () => { S.draft.phone = `254${pad.value}`; S.draft.method = 'phone'; pad.kind = ''; go('#/onboard/otp'); },
  'otp-next': () => { pad.kind = ''; go('#/onboard/pin'); },
  'pin-next': () => { S.draft.pin = pad.value; pad.kind = ''; go('#/onboard/profile'); },
  'finish-onboarding': finishOnboarding,
  'login-passkey': async (el) => {
    el.disabled = true; el.innerHTML = `${I.fingerprint} Waiting…`;
    try {
      await getPasskey(S.account?.credId);
      S.session = { memberId: (S.account && member(S.account.memberId)) ? S.account.memberId : D.DEMO_MEMBER };
      save(); go('#/home');
    } catch {
      el.disabled = false; el.innerHTML = `${I.fingerprint} Use fingerprint or face`;
      toast('Not recognised. Try again or use your phone number.');
    }
  },
  'login-phone-next': () => {
    const digits = `254${pad.value}`;
    const found = S.members.find((m) => m.phone.replace(/\D/g, '') === digits);
    if (!found) return toast('No account with that number');
    S.loginPhone = found.id; pad.kind = ''; go('#/login/pin');
  },
  'login-pin-next': () => {
    const id = S.loginPhone || D.DEMO_MEMBER;
    if (S.account?.memberId === id && S.account.pin && S.account.pin !== pad.value) { pad.value = ''; refreshPad(); return toast('Wrong PIN'); }
    S.session = { memberId: id }; delete S.loginPhone; pad.kind = ''; go('#/home');
  },
  mint: () => {
    const m = me();
    const amt = mintable(m.id);
    if (amt < 0.01) return toast('Nothing to mint yet');
    m.balance = Math.round((m.balance + amt) * 100) / 100;
    S.lastMint[m.id] = Date.now();
    S.activity.unshift({ kind: 'mint', from: m.id, amount: Math.round(amt * 100) / 100, when: today() });
    toast(`+${tok(amt)} ${S.community.token}`);
  },
  'pay-service': (el) => sheetPay(S.services.find((s) => s.id === el.dataset.id)),
  'new-post': sheetNewPost,
  'take-request': (el) => {
    const r = S.requests.find((x) => x.id === el.dataset.id);
    Object.assign(r, { status: 'taken', takenBy: me().id });
    toast(`${firstName(member(r.memberId))} will see you can help`);
  },
  'close-request': (el) => { S.requests.find((x) => x.id === el.dataset.id).status = 'closed'; toast('Request closed'); },
  'delete-service': (el) => {
    if (!confirm('Delete this service?')) return;
    S.services = S.services.filter((s) => s.id !== el.dataset.id); go('#/me'); toast('Deleted');
  },
  reset: () => { const keep = { session: S.session && member(S.session.memberId) && D.MEMBERS.some((m) => m.id === S.session.memberId) ? S.session : null }; resetState(keep); go(keep.session ? '#/home' : '#/'); toast('Demo reset'); },
  logout: () => { S.session = null; go('#/login'); },
};
const NO_RENDER = new Set(['create-passkey', 'login-passkey']);

const forms = {
  profile: (f) => {
    const fd = new FormData(f);
    S.draft.name = String(fd.get('name')).trim();
    const phone = String(fd.get('phone')).replace(/\D/g, '');
    S.draft.phone = phone.startsWith('0') ? `254${phone.slice(1)}` : phone;
    if (pendingPhoto) S.draft.photo = pendingPhoto;
    go('#/onboard/service');
  },
  'onboard-service': (f, submitter) => {
    const s = readService(f);
    if (!s.category) return toast('Pick a kind of service');
    s.photo = pendingPhoto || null;
    pendingPhoto = undefined;
    S.draft.services.push(s);
    if (submitter?.dataset.then === 'done') return finishOnboarding();
    toast('Added. Add another or tap Finish.');
    $app.scrollTop = 0;
  },
  offer: (f) => {
    const data = readService(f);
    const existing = S.services.find((s) => s.id === f.dataset.id);
    if (existing) {
      Object.assign(existing, data, pendingPhoto ? { photo: pendingPhoto } : {});
      toast('Saved'); go('#/me');
    } else {
      S.services.unshift({ id: uid('s'), memberId: me().id, hidden: false, ...data, photo: pendingPhoto || null });
      toast('Posted'); go('#/market');
    }
  },
  request: (f) => {
    const fd = new FormData(f);
    S.requests.unshift({
      id: uid('q'), memberId: me().id, category: fd.get('category'), title: String(fd.get('title')).trim(),
      description: String(fd.get('description') || '').trim(), budget: Math.max(0, Number(fd.get('budget')) || 0), status: 'open', hidden: false, when: today(),
    });
    toast('Posted to Requests'); go('#/market?tab=requests');
  },
  pay: (f) => {
    const s = S.services.find((x) => x.id === f.dataset.id);
    const m = me();
    const amt = Number(new FormData(f).get('amount'));
    if (!(amt > 0)) return toast('Enter an amount');
    if (amt > m.balance) return toast('Not enough. Mint more on Home.');
    pay(m, member(s.memberId), amt, s.title);
    closeSheet();
    toast(`Sent ${tok(amt)} to ${firstName(member(s.memberId))}`);
  },
};

/* ========================================================================= router */
const TABS = [['#/home', 'Home', I.home], ['#/market', 'Market', I.market], ['#/me', 'Me', I.user]];
const routes = [
  { re: /^\/$/, view: () => { go(S.session ? '#/home' : S.account ? '#/login' : '#/no-link'); return ''; }, open: true },
  { re: /^\/no-link$/, view: vNoLink, guest: true },
  { re: /^\/join$/, view: vJoin, guest: true },
  { re: /^\/login$/, view: vLogin, guest: true },
  { re: /^\/login\/phone$/, view: vLoginPhone, guest: true },
  { re: /^\/login\/pin$/, view: vLoginPin, guest: true },
  { re: /^\/onboard\/secure$/, view: vOnboardSecure, onboarding: true },
  { re: /^\/onboard\/phone$/, view: vOnboardPhone, onboarding: true },
  { re: /^\/onboard\/otp$/, view: vOnboardOtp, onboarding: true },
  { re: /^\/onboard\/pin$/, view: vOnboardPin, onboarding: true },
  { re: /^\/onboard\/profile$/, view: vOnboardProfile, onboarding: true },
  { re: /^\/onboard\/service$/, view: vOnboardService, onboarding: true },
  { re: /^\/home$/, view: vHome, tab: true },
  { re: /^\/market$/, view: vMarket, tab: true },
  { re: /^\/me$/, view: vMe, tab: true },
  { re: /^\/offer\/(?<id>[\w-]+)$/, view: vOffer, tab: true },
  { re: /^\/request\/new$/, view: vRequestNew, tab: true },
];

let lastPath = null;
function render() {
  const [path, qs = ''] = (location.hash.slice(1) || '/').split('?');
  const q = new URLSearchParams(qs);
  const route = routes.find((r) => r.re.test(path));
  if (S.session && !me()) S.session = null;
  if (!route) { go('#/'); return; }
  if (!route.open) {
    if ((route.guest || route.onboarding) && S.session) { location.replace('#/home'); return; }
    if (route.onboarding && !S.draft) { location.replace('#/no-link'); return; }
    if (route.tab && !S.session) { location.replace('#/'); return; }
  }
  if (path !== lastPath) pendingPhoto = undefined;
  const keepScroll = path === lastPath;
  const scroll = $app.scrollTop;
  const html = route.view(path.match(route.re).groups || {}, q);
  if (!html) return; // view redirected
  $app.innerHTML = html;
  $app.scrollTop = keepScroll ? scroll : 0;
  lastPath = path;
  document.body.classList.toggle('in-flow', !route.tab);

  if (route.tab) {
    const current = `#${path}`;
    $tabbar.innerHTML = TABS.map(([href, label, icon]) => {
      const editing = /^#\/offer\/(?!new$)/.test(current);
      const on = current === href
        || (href === '#/market' && (current === '#/offer/new' || current === '#/request/new'))
        || (href === '#/me' && editing);
      return `<a href="${href}" class="${on ? 'on' : ''}" ${on ? 'aria-current="page"' : ''}><span class="pip">${icon}</span>${label}</a>`;
    }).join('');
    $tabbar.hidden = false;
  } else {
    $tabbar.hidden = true;
  }
  save();
}

/* ========================================================================= events */
document.addEventListener('click', (e) => {
  const key = e.target.closest('[data-key]');
  if (key) {
    const k = key.dataset.key;
    if (k === 'back') pad.value = pad.value.slice(0, -1);
    else if (pad.value.length < pad.max) pad.value += k;
    refreshPad();
    return;
  }
  const step = e.target.closest('[data-step]');
  if (step) {
    const [name, delta] = step.dataset.step.split(':');
    const input = step.closest('form').querySelector(`[name="${name}"]`);
    const next = Math.max(Number(input.min || 0), Math.min(Number(input.max || 1e9), (Number(input.value) || 0) + Number(delta)));
    input.value = next;
    return;
  }
  const nav = e.target.closest('[data-go]');
  if (nav) { e.preventDefault(); closeSheet(); go(nav.dataset.go); return; }
  const act = e.target.closest('[data-act]');
  if (act && actions[act.dataset.act]) {
    e.preventDefault();
    const r = actions[act.dataset.act](act);
    if (NO_RENDER.has(act.dataset.act)) return;
    if (act.dataset.act !== 'pay-service' && act.dataset.act !== 'new-post') save();
    if (!(r instanceof Promise)) render();
  }
});

document.addEventListener('submit', (e) => {
  const f = e.target.closest('form[data-form]');
  if (!f || !forms[f.dataset.form]) return;
  e.preventDefault();
  forms[f.dataset.form](f, e.submitter);
  save();
  render();
});

document.addEventListener('change', async (e) => {
  const input = e.target.closest('[data-photo]');
  if (!input || !input.files?.[0]) return;
  try {
    pendingPhoto = await readImage(input.files[0]);
    input.closest('.photo-pick').querySelector('.photo-preview').innerHTML = `<img src="${pendingPhoto}" alt="" />`;
    if (location.hash === '#/me') { me().photo = pendingPhoto; save(); toast('Photo saved'); }
  } catch (err) { toast(err.message); }
});

// Tick the "ready to mint" counter on Home.
setInterval(() => {
  const el = $app.querySelector('[data-mint]');
  if (el && me()) el.textContent = `+${mintable(me().id).toFixed(2)}`;
}, 1000);

// Keep in sync with the admin site open in another tab.
window.addEventListener('storage', (e) => { if (e.key === STORE_KEY) { reloadState(); render(); } });
window.addEventListener('hashchange', render);
render();

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' }).catch(() => {});
}
