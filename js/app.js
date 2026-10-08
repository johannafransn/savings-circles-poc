import * as D from './data.js';
import { I, circlesArt } from './icons.js';

/* =========================================================================
   State: seeded from the static constants, persisted to localStorage so the
   demo survives reloads. Profile → "Reset demo" restores the constants.
   ========================================================================= */
const STORE_KEY = 'savings-circles-poc:v4';
const HOUR = 3600 * 1000;
const DAY = 24 * HOUR;
const MINT_CAP_HOURS = 14 * 24;
const WINDOW_DAYS = 30;
const clone = (x) => JSON.parse(JSON.stringify(x));
const isoDaysAgo = (n) => new Date(Date.now() - n * DAY).toISOString().slice(0, 10);

function seed() {
  const now = Date.now();
  const lastMint = {};
  for (const m of D.MEMBERS) lastMint[m.id] = now - (D.LAST_MINT_HOURS_AGO[m.id] ?? 12) * HOUR;
  const dated = (rows) => rows.map(({ daysAgo, ...r }) => ({ ...r, when: isoDaysAgo(daysAgo ?? 0) }));
  return {
    session: null, // { role: 'member' | 'organiser', memberId }
    community: clone(D.COMMUNITY),
    members: clone(D.MEMBERS),
    requests: dated(D.JOIN_REQUESTS),
    services: clone(D.SERVICES),
    jobs: clone(D.JOBS),
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
function save() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(S)); } catch { /* private mode */ }
}
let S = load() || seed();

/* ========================================================================= helpers */
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const kes = (n) => `KES ${Math.round(n).toLocaleString('en-KE')}`;
const tok = (n) => Number(n).toLocaleString('en-KE', { maximumFractionDigits: 2 });
const fmtDate = (iso) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
const monthShort = (iso) => new Date(iso).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
const initials = (name) => name.split(/\s+/).map((p) => p[0]).slice(0, 2).join('').toUpperCase();
const member = (id) => S.members.find((m) => m.id === id);
const me = () => member(S.session?.memberId);
const isOrganiser = () => S.session?.role === 'organiser';
const firstName = (m) => m.name.split(' ')[0];
const today = () => new Date().toISOString().slice(0, 10);
const uid = (p) => `${p}${Math.random().toString(36).slice(2, 8)}`;
const T = () => esc(S.community.token);

const mintable = (id) => {
  const hours = (Date.now() - (S.lastMint[id] ?? Date.now())) / HOUR;
  return Math.max(0, Math.min(hours, MINT_CAP_HOURS));
};
const recent = (a) => Date.now() - new Date(a.when).getTime() <= WINDOW_DAYS * DAY;
// Shillings a member kept in their pocket by paying in the community currency.
const keptBy = (id) => S.activity.filter((a) => a.kind === 'out' && a.memberId === id && recent(a)).reduce((s, a) => s + (a.kes || 0), 0);
const earnedBy = (id) => S.activity.filter((a) => a.kind === 'out' && a.to === id && recent(a)).reduce((s, a) => s + (a.amount || 0), 0);
const communityKept = () => S.activity.filter((a) => a.kind === 'out' && recent(a)).reduce((s, a) => s + (a.kes || 0), 0);
const tradesThisWeek = () => S.activity.filter((a) => (a.kind === 'out') && Date.now() - new Date(a.when).getTime() <= 7 * DAY).length;
const inCirculation = () => S.members.reduce((s, m) => s + m.balance, 0);

function log(memberId, text, kind, extra = {}) {
  S.activity.unshift({ memberId, text, when: today(), kind, ...extra });
}
function pay(from, to, amount, kesValue, what) {
  from.balance = Math.round((from.balance - amount) * 100) / 100;
  to.balance = Math.round((to.balance + amount) * 100) / 100;
  log(from.id, `paid ${firstName(to)} ${tok(amount)} ${S.community.token} for ${what}`, 'out', { to: to.id, kes: kesValue, amount });
}

/* ========================================================================= ui primitives */
const $app = document.getElementById('app');
const $tabbar = document.getElementById('tabbar');
const $sheet = document.getElementById('sheet-root');
const $toast = document.getElementById('toast');

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
  $sheet.querySelector('input,select,textarea')?.focus({ preventScroll: true });
}
const closeSheet = () => { $sheet.innerHTML = ''; };

const topbar = (title, { back, right = '' } = {}) => `
  <div class="topbar">
    ${back ? `<button class="icon-btn plain" data-go="${back}" aria-label="Back">${I.back}</button>` : ''}
    <div class="grow"><h3>${title}</h3></div>${right}
  </div>`;

const avatar = (m, cls = '', style = '') => `<div class="avatar ${cls}" style="${style}" aria-hidden="true">${initials(m.name)}</div>`;
const coin = '<span class="token coin">A</span>';
const amountField = (name, { value = '', suffix, kesField = false, step = 'any', attrs = '', required = true } = {}) => `
  <div class="field amount">
    <input name="${name}" type="number" inputmode="decimal" min="0" step="${step}" value="${value}" ${attrs} ${required ? 'required' : ''} />
    <span class="suffix">${kesField ? '<span class="token kes">KSh</span>KES' : `${coin}${suffix || T()}`}</span>
  </div>`;

/* ========================================================================= views: entry */
function vWelcome() {
  return `<div class="welcome">
    <div class="art">${circlesArt}</div>
    <h1 class="center">Your community's<br/>own money.</h1>
    <p class="center muted">When shillings run short, keep trading with your neighbours. Everyone mints 1 ${T()} every hour and spends it on each other's goods and services.</p>
    <div class="mt">
      <button class="choice accent" data-go="#/auth/member">
        <span class="ico">${I.user}</span>
        <span class="grow"><h3>Join my community</h3><span class="small muted">Mint, spend and earn with neighbours</span></span>
        ${I.chevron}
      </button>
      <button class="choice" data-go="#/auth/organiser">
        <span class="ico">${I.group}</span>
        <span class="grow"><h3>Start a community</h3><span class="small muted">Create a currency for your group</span></span>
        ${I.chevron}
      </button>
    </div>
    <p class="after-btn">Proof of concept · all data is fictional</p>
  </div>`;
}

function vAuth({ role }, q) {
  const mode = q.get('mode') === 'signup' ? 'signup' : 'login';
  const demo = member(D.DEMO_USERS[role]);
  const isO = role === 'organiser';
  const tabs = `<div class="segment">
    <button class="${mode === 'login' ? 'on' : ''}" data-go="#/auth/${role}">Log in</button>
    <button class="${mode === 'signup' ? 'on' : ''}" data-go="#/auth/${role}?mode=signup">${isO ? 'Start one' : 'Join'}</button>
  </div>`;
  const head = `${topbar('', { back: '#/' })}<h1>${isO ? 'Community organiser' : 'Member'}</h1>
    <p class="muted">${isO ? 'For whoever brings the group together.' : 'Spend and earn in your community currency.'}</p>${tabs}`;

  if (mode === 'login') {
    return `${head}
      <form data-form="login" data-role="${role}" class="stack">
        <label class="label">Phone number</label>
        <div class="field"><input name="phone" type="tel" value="${esc(demo.phone)}" autocomplete="tel" required /></div>
        <label class="label">PIN</label>
        <div class="field"><input name="pin" type="password" inputmode="numeric" maxlength="4" value="1234" required /></div>
        <div class="mt"><button class="btn" type="submit">${I.arrow} Log in</button></div>
        <p class="after-btn">Demo: logs in as ${esc(demo.name)}.</p>
      </form>`;
  }
  if (!isO) {
    return `${head}
      <form data-form="signup-member" class="stack">
        <label class="label">Invite code</label>
        <div class="field"><input name="code" value="${esc(S.community.inviteCode)}" autocapitalize="characters" required /></div>
        <label class="label">Full name</label>
        <div class="field"><input name="name" placeholder="e.g. Wanjiru Achola" required /></div>
        <label class="label">Phone number</label>
        <div class="field"><input name="phone" type="tel" placeholder="+254 7…" required /></div>
        <label class="label">What can you offer?</label>
        <div class="field"><input name="trade" placeholder="e.g. Tailoring, boda rides" /></div>
        <label class="label">Choose a 4-digit PIN</label>
        <div class="field"><input name="pin" type="password" inputmode="numeric" maxlength="4" required /></div>
        <div class="mt"><button class="btn" type="submit">${I.arrow} Join ${esc(S.community.name)}</button></div>
        <p class="after-btn">Once you join you mint 1 ${T()} every hour.</p>
      </form>`;
  }
  return `${head}
    <form data-form="signup-organiser" class="stack">
      <label class="label">Community name</label>
      <div class="field"><input name="name" value="${esc(S.community.name)}" required /></div>
      <label class="label">Name your currency</label>
      <div class="field"><input name="token" value="${esc(S.community.token)}" maxlength="12" required /><span class="suffix muted small">1 per hour</span></div>
      <label class="label">Where are you?</label>
      <div class="field"><input name="location" value="${esc(S.community.location)}" required /></div>
      <label class="label">Your phone</label>
      <div class="field"><input name="phone" type="tel" value="${esc(demo.phone)}" required /></div>
      <div class="mt"><button class="btn" type="submit">${I.arrow} Start community</button></div>
      <p class="after-btn">You'll get an invite code to share with neighbours.</p>
    </form>`;
}

/* ========================================================================= views: member */
function vHome() {
  const m = me();
  const kept = keptBy(m.id);
  const acts = S.activity.filter((a) => a.memberId === m.id || a.to === m.id).slice(0, 5);
  const nearby = S.services.filter((s) => s.memberId !== m.id).slice(0, 3);
  return `
    <div class="topbar">
      ${avatar(m)}
      <div class="grow"><div class="small muted">${esc(S.community.name)}</div><h3>Habari, ${esc(firstName(m))}</h3></div>
      <button class="icon-btn" data-go="#/market" aria-label="Market">${I.market}</button>
    </div>
    <div class="hero accent">
      <div class="k">Your balance</div>
      <div class="big">${tok(m.balance)} <span style="font-size:20px">${T()}</span></div>
      <div class="btn-row" style="margin-top:14px;align-items:center">
        <div class="small" style="flex:1"><strong data-mint>+${mintable(m.id).toFixed(2)}</strong> ready to mint<br/>1 every hour, for everyone</div>
        <button class="btn sm secondary" data-act="mint" style="flex:0">${I.spark} Mint</button>
      </div>
      <div class="split">
        <div><div class="k">Shillings kept</div><strong>${kes(kept)}</strong></div>
        <div><div class="k">Earned · 30 days</div><strong>${tok(earnedBy(m.id))} ${T()}</strong></div>
      </div>
    </div>
    <div class="reminder"><div class="ico">${I.spark}</div><div class="grow">
      <h3>${kept ? `${kes(kept)} stayed in your pocket` : 'Make your shillings go further'}</h3>
      <div class="small">${kept ? `You paid neighbours in ${T()} instead of shillings over the last ${WINDOW_DAYS} days.` : `Pay neighbours in ${T()} and keep your shillings for rent, school fees and things only shillings can buy.`}</div>
    </div></div>
    <div class="topbar" style="margin-top:22px"><div class="grow"><h3>Spend it nearby</h3></div><a class="small" href="#/market"><strong>See all</strong></a></div>
    <div class="box tight">
      ${nearby.map((s) => { const o = member(s.memberId); return `<div class="row link" data-act="pay-service" data-id="${s.id}">${avatar(o)}<div class="grow"><div class="ellipsis"><strong>${esc(s.title)}</strong></div><div class="sub">${esc(firstName(o))} · keeps ${kes(s.kes)} in your pocket</div></div><div class="price r" style="display:flex;gap:6px;align-items:center">${coin}${tok(s.price)}</div></div>`; }).join('')}
    </div>
    <h2>Recent</h2>
    <div class="box">
      ${acts.length ? acts.map((a) => `<div class="row"><div class="grow"><div>${a.memberId === m.id ? 'You' : esc(member(a.memberId)?.name)} ${esc(a.memberId === m.id ? a.text : a.text.replace(`paid ${firstName(m)}`, 'paid you'))}</div><div class="sub">${fmtDate(a.when)}${a.kind === 'out' && a.memberId === m.id && a.kes ? ` · kept ${kes(a.kes)}` : ''}</div></div></div>`).join('') : '<div class="empty">Nothing yet. Mint your first coins above.</div>'}
    </div>`;
}

/* ========================================================================= views: market */
function vMarket(_, q) {
  const m = me();
  const tab = q.get('tab') === 'jobs' ? 'jobs' : 'services';
  const services = S.services.map((s) => {
    const o = member(s.memberId);
    const own = s.memberId === m.id;
    return `<div class="card"><div class="top">${avatar(o)}<div class="grow"><h3>${esc(s.title)}</h3>
      <div class="meta">${esc(o.name)} · ${esc(s.category)}</div></div>
      <div class="price">${coin}${tok(s.price)}</div></div>
      ${s.note ? `<p class="small muted" style="margin:10px 0 0">${esc(s.note)}</p>` : ''}
      <div class="actions"><span class="small muted">per ${esc(s.unit)}${s.kes ? ` · usually ${kes(s.kes)}` : ''}</span>
      ${own ? `<button class="btn sm secondary" data-act="remove-service" data-id="${s.id}">Remove</button>` : `<button class="btn sm" data-act="pay-service" data-id="${s.id}">Pay in ${T()}</button>`}</div></div>`;
  }).join('');
  const jobs = S.jobs.filter((j) => j.status !== 'closed').map((j) => {
    const o = member(j.memberId);
    const own = j.memberId === m.id;
    let action;
    if (j.status === 'open') action = own ? `<button class="btn sm secondary" data-act="close-job" data-id="${j.id}">Close</button>` : `<button class="btn sm" data-act="take-job" data-id="${j.id}">I'll do it</button>`;
    else if (j.status === 'taken' && own) action = `<button class="btn sm" data-act="pay-job" data-id="${j.id}">Done · pay</button>`;
    else action = j.status === 'paid' ? '<span class="badge ok">Paid</span>' : '<span class="badge">Taken</span>';
    return `<div class="card"><div class="top">${avatar(o)}<div class="grow"><h3>${esc(j.title)}</h3>
      <div class="meta">${esc(o.name)} · ${esc(j.when)}</div></div>
      <div class="price">${coin}${tok(j.reward)}</div></div>
      <div class="actions"><span class="small muted">${esc(j.category)}${j.takenBy ? ` · ${j.takenBy === m.id ? 'you took it' : `${esc(firstName(member(j.takenBy)))} took it`}` : ''}</span>${action}</div></div>`;
  }).join('');
  return `${topbar('Market', { right: `<button class="btn sm" data-go="#/market/new?type=${tab === 'jobs' ? 'job' : 'service'}">${I.plus} Post</button>` })}
    <p class="muted small">Buy from neighbours in ${T()} and keep your shillings. One ${T()} is about one hour of someone's time.</p>
    <div class="box tight">
      <div class="row">${coin}<div class="grow">Your ${T()}<div class="sub">You mint 1 every hour</div></div><strong>${tok(m.balance)}</strong></div>
    </div>
    <div class="segment mt">
      <button class="${tab === 'services' ? 'on' : ''}" data-go="#/market">Offered (${S.services.length})</button>
      <button class="${tab === 'jobs' ? 'on' : ''}" data-go="#/market?tab=jobs">Wanted (${S.jobs.filter((j) => j.status === 'open').length})</button>
    </div>
    ${tab === 'services' ? services || '<div class="empty">Nothing offered yet</div>' : jobs || '<div class="empty">Nothing wanted yet</div>'}`;
}

function vMarketNew(_, q) {
  const type = q.get('type') === 'job' ? 'job' : 'service';
  return `${topbar(type === 'job' ? 'Ask for help' : 'Offer something', { back: `#/market${type === 'job' ? '?tab=jobs' : ''}` })}
    <div class="segment">
      <button class="${type === 'service' ? 'on' : ''}" data-go="#/market/new?type=service">I offer</button>
      <button class="${type === 'job' ? 'on' : ''}" data-go="#/market/new?type=job">I need</button>
    </div>
    <form data-form="post" data-type="${type}" class="stack">
      <label class="label">${type === 'job' ? 'What needs doing?' : 'What do you offer?'}</label>
      <div class="field"><input name="title" placeholder="${type === 'job' ? 'e.g. Clean my shop' : 'e.g. Haircut'}" required /></div>
      <label class="label">Category</label>
      <div class="field"><select name="category">${['Grooming', 'Tailoring', 'Cleaning', 'Transport', 'Repairs', 'Teaching', 'Labour', 'Food', 'Other'].map((c) => `<option>${c}</option>`).join('')}</select><span class="suffix">${I.down.replace('<svg', '<svg width="20" height="20"')}</span></div>
      <label class="label">${type === 'job' ? 'You pay' : 'Price'}</label>
      ${amountField('price', { value: 1, step: '0.5' })}
      <label class="label">Usual price in shillings</label>
      ${amountField('kes', { value: 150, kesField: true, step: '10', required: false })}
      <label class="label">Per</label>
      <div class="radio-row">${(type === 'job' ? ['hours', 'job'] : ['hour', 'cut', 'ride', 'session', 'item']).map((u, i) => `<label><input type="radio" name="unit" value="${u}" ${i === 0 ? 'checked' : ''}/><span>${u}</span></label>`).join('')}</div>
      <label class="label">${type === 'job' ? 'When' : 'Details'}</label>
      <div class="field"><input name="note" placeholder="${type === 'job' ? 'e.g. Saturday morning' : 'Where to find you, hours'}" /></div>
      <div class="mt"><button class="btn" type="submit">${I.arrow} Post to market</button></div>
      <p class="after-btn">Everyone in ${esc(S.community.name)} can see it.</p>
    </form>`;
}

/* ========================================================================= views: profile */
function vProfile() {
  const m = me();
  const c = S.community;
  const mine = S.services.filter((s) => s.memberId === m.id);
  return `${topbar('Profile')}
    <div class="center" style="margin:10px 0 18px">${avatar(m, 'lg', 'margin:0 auto 10px')}
      <h3>${esc(m.name)}</h3><div class="small muted">${esc(m.trade || 'Member')} · ${esc(m.phone)}</div>
      <div style="margin-top:8px"><span class="badge accent">${isOrganiser() ? 'Organiser' : 'Member'}</span></div></div>
    <div class="box">
      <div class="row"><span>Community</span><span class="r">${esc(c.name)}</span></div>
      <div class="row"><span>Currency</span><span class="r">${T()}</span></div>
      <div class="row"><span>Member since</span><span class="r">${monthShort(m.joined)}</span></div>
      <div class="row"><span>Shillings kept · 30 days</span><span class="r">${kes(keptBy(m.id))}</span></div>
    </div>
    <h2>What I offer</h2>
    ${mine.length ? `<div class="box">${mine.map((s) => `<div class="row"><div class="grow">${esc(s.title)}<div class="sub">${tok(s.price)} ${T()} per ${esc(s.unit)}</div></div><button class="btn sm secondary" data-act="remove-service" data-id="${s.id}">Remove</button></div>`).join('')}</div>` : '<p class="muted small">Nothing yet. Offer a skill so neighbours can pay you.</p>'}
    <div class="mt"><button class="btn secondary" data-go="#/market/new?type=service">${I.plus} Offer something</button></div>
    <h2>Invite a neighbour</h2>
    <div class="box"><div class="row"><div class="grow">Invite code<div class="sub">More people offering means more to spend on</div></div><strong>${esc(c.inviteCode)}</strong></div></div>
    <h2>Demo</h2>
    <div class="stack">
      <button class="btn secondary" data-act="switch-role">${I.swap} Switch to ${isOrganiser() ? 'member' : 'organiser'} view</button>
      <button class="btn secondary" data-act="reset">Reset demo data</button>
      <button class="btn ghost" data-act="logout">Log out</button>
    </div>`;
}

/* ========================================================================= views: organiser */
function vCommunity() {
  const c = S.community;
  const n = S.members.length;
  return `
    <div class="topbar">
      <div class="avatar" style="background:var(--accent)">${initials(c.name)}</div>
      <div class="grow"><div class="small muted">${esc(c.location)}</div><h3>${esc(c.name)}</h3></div>
      <span class="badge accent">Organiser</span>
    </div>
    <div class="hero accent">
      <div class="k">${T()} in circulation</div>
      <div class="big">${tok(Math.round(inCirculation()))}</div>
      <div class="split">
        <div><div class="k">Members</div><strong>${n}</strong></div>
        <div><div class="k">New ${T()} per day</div><strong>${n * 24}</strong></div>
      </div>
    </div>
    ${S.requests.length ? `<div class="reminder"><div class="ico">${I.users}</div><div class="grow">
      <h3>${S.requests.length} ${S.requests.length === 1 ? 'person wants' : 'people want'} to join</h3>
      <div class="small">${S.requests.map((r) => esc(r.name.split(' ')[0])).join(', ')} · invited by members</div>
      <div style="margin-top:10px"><button class="btn sm" data-go="#/members">Review</button></div>
    </div></div>` : ''}
    <div class="stats">
      <div class="stat"><div class="v">${kes(communityKept())}</div><div class="k">shillings kept · 30 days</div></div>
      <div class="stat"><div class="v">${tradesThisWeek()}</div><div class="k">trades this week</div></div>
      <a class="stat" href="#/market" style="text-decoration:none"><div class="v">${S.services.length}</div><div class="k">things offered</div></a>
      <a class="stat" href="#/market?tab=jobs" style="text-decoration:none"><div class="v">${S.jobs.filter((j) => j.status === 'open').length}</div><div class="k">things wanted</div></a>
    </div>
    <h2>Invite neighbours</h2>
    <div class="box"><div class="row"><div class="grow">Invite code<div class="sub">Share it at your next meeting</div></div><strong>${esc(c.inviteCode)}</strong></div></div>
    <h2>Recent trades</h2>
    <div class="box">
      ${S.activity.filter((a) => a.kind === 'out').slice(0, 5).map((a) => `<div class="row"><div class="grow"><div>${esc(member(a.memberId)?.name)} ${esc(a.text)}</div><div class="sub">${fmtDate(a.when)}${a.kes ? ` · kept ${kes(a.kes)}` : ''}</div></div></div>`).join('') || '<div class="empty">No trades yet</div>'}
    </div>`;
}

function vMembers() {
  const offers = (id) => S.services.filter((s) => s.memberId === id).length;
  return `${topbar('Members')}
    ${S.requests.length ? `<h2 style="margin-top:6px">Waiting to join</h2>
      <p class="muted small">Trusting someone lets them mint ${T()} and trade with everyone.</p>
      ${S.requests.map((r) => `<div class="card"><div class="top">${avatar(r)}<div class="grow"><h3>${esc(r.name)}</h3><div class="meta">${esc(r.trade)} · invited by ${esc(firstName(member(r.invitedBy)))}</div></div></div>
        <div class="btn-row mt"><button class="btn sm secondary" data-act="decline-request" data-id="${r.id}">Decline</button><button class="btn sm" data-act="trust-request" data-id="${r.id}">${I.check} Trust</button></div></div>`).join('')}
      <h2>Members</h2>` : ''}
    <p class="muted small">${S.members.length} members · tap someone to see what they offer.</p>
    <div class="box">
      ${S.members.map((m) => `<div class="row link" data-act="member-detail" data-id="${m.id}">${avatar(m)}
        <div class="grow"><div class="ellipsis"><strong>${esc(m.name)}</strong></div><div class="sub ellipsis">${esc(m.trade)} · since ${monthShort(m.joined)}</div></div>
        <div class="r"><span class="badge">${offers(m.id)} offered</span></div></div>`).join('')}
    </div>`;
}

/* ========================================================================= sheets */
function sheetPayService(s, m) {
  const o = member(s.memberId);
  openSheet(`<h1 style="font-size:22px">Pay ${esc(firstName(o))}</h1>
    <p class="muted small">${esc(s.title)} · ${tok(s.price)} ${T()} per ${esc(s.unit)}</p>
    <form data-form="pay-service" data-id="${s.id}" class="stack">
      <label class="label">You send</label>${amountField('amount', { value: s.price, step: '0.5' })}
      <div class="box mt">
        <div class="row"><span>Shillings you keep</span><span class="r" data-out="kept">${kes(s.kes || 0)}</span></div>
        <div class="row"><span>Fee</span><span class="r">Free!</span></div>
      </div>
      <div class="mt"><button class="btn" type="submit">${I.arrow} Send ${T()}</button></div>
      <p class="after-btn">You have ${tok(m.balance)} ${T()}.</p>
    </form>`);
}

function sheetMember(m) {
  const offers = S.services.filter((s) => s.memberId === m.id);
  openSheet(`<div class="center">${avatar(m, 'lg', 'margin:0 auto 10px')}<h3>${esc(m.name)}</h3><div class="small muted">${esc(m.trade)} · since ${monthShort(m.joined)}</div></div>
    <h2>Offers</h2>
    ${offers.length ? `<div class="box">${offers.map((s) => `<div class="row"><div class="grow">${esc(s.title)}<div class="sub">per ${esc(s.unit)}</div></div><span class="r" style="display:flex;gap:6px;align-items:center">${coin}${tok(s.price)}</span></div>`).join('')}</div>` : '<p class="muted small">Nothing offered yet.</p>'}
    <div class="box mt"><div class="row"><span>Shillings kept · 30 days</span><span class="r">${kes(keptBy(m.id))}</span></div></div>`);
}

/* ========================================================================= actions */
const actions = {
  'close-sheet': closeSheet,
  mint: () => {
    const m = me();
    const amt = mintable(m.id);
    if (amt < 0.01) return toast('Nothing to mint yet');
    m.balance = Math.round((m.balance + amt) * 100) / 100;
    S.lastMint[m.id] = Date.now();
    log(m.id, `minted ${tok(amt)} ${S.community.token}`, 'mint');
    toast(`Minted ${tok(amt)} ${S.community.token}`);
  },
  'pay-service': (el) => sheetPayService(S.services.find((s) => s.id === el.dataset.id), me()),
  'remove-service': (el) => { S.services = S.services.filter((s) => s.id !== el.dataset.id); toast('Removed from the market'); },
  'take-job': (el) => {
    const j = S.jobs.find((x) => x.id === el.dataset.id);
    Object.assign(j, { status: 'taken', takenBy: me().id });
    toast(`${firstName(member(j.memberId))} has been told you'll do it`);
  },
  'close-job': (el) => { S.jobs.find((x) => x.id === el.dataset.id).status = 'closed'; toast('Removed from the market'); },
  'pay-job': (el) => {
    const j = S.jobs.find((x) => x.id === el.dataset.id);
    const m = me();
    if (m.balance < j.reward) return toast(`Not enough ${S.community.token}. Mint more on Home.`);
    pay(m, member(j.takenBy), j.reward, j.kes || 0, j.title.toLowerCase());
    j.status = 'paid';
    toast(`Paid ${tok(j.reward)} ${S.community.token}`);
  },
  'trust-request': (el) => {
    const r = S.requests.find((x) => x.id === el.dataset.id);
    const m = { id: uid('m'), name: r.name, phone: '+254 700 000 000', trade: r.trade, role: 'member', joined: today(), balance: 0 };
    S.members.push(m);
    S.lastMint[m.id] = Date.now();
    S.requests = S.requests.filter((x) => x.id !== r.id);
    toast(`${firstName(m)} can now mint ${S.community.token}`);
  },
  'decline-request': (el) => { S.requests = S.requests.filter((x) => x.id !== el.dataset.id); toast('Request declined'); },
  'member-detail': (el) => sheetMember(member(el.dataset.id)),
  'switch-role': () => {
    const role = isOrganiser() ? 'member' : 'organiser';
    S.session = { role, memberId: D.DEMO_USERS[role] };
    location.hash = role === 'organiser' ? '#/community' : '#/home';
  },
  reset: () => { const session = S.session; S = seed(); S.session = session && { role: session.role, memberId: D.DEMO_USERS[session.role] }; toast('Demo data reset'); },
  logout: () => { S.session = null; location.hash = '#/'; },
};
const SHEET_OPENERS = ['pay-service', 'member-detail'];

const forms = {
  login: (f, data) => {
    const role = f.dataset.role;
    const found = S.members.find((m) => m.phone.replace(/\s/g, '') === data.phone.replace(/\s/g, '') && (role === 'member' || m.role === 'organiser'));
    S.session = { role, memberId: found?.id || D.DEMO_USERS[role] };
    location.hash = role === 'organiser' ? '#/community' : '#/home';
  },
  'signup-member': (f, data) => {
    if (data.code.trim().toUpperCase() !== S.community.inviteCode) return toast('That invite code is not valid');
    const m = { id: uid('m'), name: data.name.trim(), phone: data.phone.trim(), trade: data.trade.trim() || 'Member', role: 'member', joined: today(), balance: 0 };
    S.members.push(m);
    S.lastMint[m.id] = Date.now() - 3 * HOUR;
    S.session = { role: 'member', memberId: m.id };
    location.hash = '#/home';
    toast(`Karibu, ${firstName(m)}! Mint your first ${S.community.token}.`);
  },
  'signup-organiser': (f, data) => {
    const token = data.token.trim();
    Object.assign(S.community, {
      name: data.name.trim(),
      token,
      location: data.location.trim(),
      inviteCode: `${token.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8)}-${Math.floor(1000 + Math.random() * 9000)}`,
    });
    S.session = { role: 'organiser', memberId: D.DEMO_USERS.organiser };
    location.hash = '#/community';
    toast(`Community ready. Invite code ${S.community.inviteCode}`);
  },
  'pay-service': (f, data) => {
    const s = S.services.find((x) => x.id === f.dataset.id);
    const m = me();
    const amt = +data.amount;
    if (!(amt > 0)) return toast('Enter an amount');
    if (amt > m.balance) return toast(`Not enough ${S.community.token}. Mint more on Home.`);
    pay(m, member(s.memberId), amt, s.price ? (s.kes || 0) * (amt / s.price) : 0, s.title.toLowerCase());
    closeSheet();
    toast(`Sent ${tok(amt)} ${S.community.token} to ${firstName(member(s.memberId))}`);
  },
  post: (f, data) => {
    const m = me();
    const base = { memberId: m.id, title: data.title.trim(), unit: data.unit, category: data.category, kes: +data.kes || 0 };
    if (f.dataset.type === 'job') {
      S.jobs.unshift({ id: uid('j'), ...base, reward: +data.price, when: data.note.trim() || 'Flexible', status: 'open' });
      location.hash = '#/market?tab=jobs';
    } else {
      S.services.unshift({ id: uid('s'), ...base, price: +data.price, note: data.note.trim() });
      location.hash = '#/market';
    }
    toast('Posted to the market');
  },
};

/* ========================================================================= router */
const MEMBER_TABS = [['#/home', 'Home', I.home], ['#/market', 'Market', I.market], ['#/profile', 'Profile', I.user]];
const ORGANISER_TABS = [['#/community', 'Community', I.group], ['#/home', 'Wallet', I.home], ['#/market', 'Market', I.market], ['#/members', 'Members', I.users], ['#/profile', 'Profile', I.user]];

const routes = [
  { re: /^\/$/, view: vWelcome, guest: true },
  { re: /^\/auth\/(?<role>member|organiser)$/, view: vAuth, guest: true },
  { re: /^\/home$/, view: vHome },
  { re: /^\/market$/, view: vMarket },
  { re: /^\/market\/new$/, view: vMarketNew },
  { re: /^\/profile$/, view: vProfile },
  { re: /^\/community$/, view: vCommunity, role: 'organiser' },
  { re: /^\/members$/, view: vMembers, role: 'organiser' },
];

let lastPath = null;
function render() {
  const [path, qs = ''] = (location.hash.slice(1) || '/').split('?');
  const q = new URLSearchParams(qs);
  const home = isOrganiser() ? '#/community' : '#/home';
  const route = routes.find((r) => r.re.test(path));
  if (!route) { location.replace(S.session ? home : '#/'); return; }
  if (route.guest && S.session) { location.replace(home); return; }
  if (!route.guest && !S.session) { location.replace('#/'); return; }
  if (!route.guest && !me()) { S.session = null; location.replace('#/'); return; }
  if (route.role && route.role !== S.session.role) { location.replace(home); return; }

  const keepScroll = path === lastPath;
  const scroll = $app.scrollTop;
  $app.innerHTML = route.view(path.match(route.re).groups || {}, q);
  $app.scrollTop = keepScroll ? scroll : 0;
  lastPath = path;

  if (S.session && !route.guest) {
    const tabs = isOrganiser() ? ORGANISER_TABS : MEMBER_TABS;
    const current = `#${path}`;
    $tabbar.innerHTML = tabs.map(([href, label, icon]) => {
      const on = current === href || current.startsWith(`${href}/`);
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
  const go = e.target.closest('[data-go]');
  if (go) { e.preventDefault(); closeSheet(); location.hash = go.dataset.go; return; }
  const act = e.target.closest('[data-act]');
  if (act && actions[act.dataset.act]) {
    e.preventDefault();
    actions[act.dataset.act](act);
    if (!SHEET_OPENERS.includes(act.dataset.act)) save();
    render();
  }
});

document.addEventListener('submit', (e) => {
  const f = e.target.closest('form[data-form]');
  if (!f || !forms[f.dataset.form]) return;
  e.preventDefault();
  forms[f.dataset.form](f, Object.fromEntries(new FormData(f)));
  save();
  render();
});

// Live "shillings you keep" in the pay sheet.
document.addEventListener('input', (e) => {
  const f = e.target.closest('form[data-form=pay-service]');
  if (!f) return;
  const s = S.services.find((x) => x.id === f.dataset.id);
  const amt = Math.max(0, Number(f.amount.value) || 0);
  f.querySelector('[data-out=kept]').textContent = kes(s.price ? (s.kes || 0) * (amt / s.price) : 0);
});

// Tick the "ready to mint" counter on Home.
setInterval(() => {
  const el = $app.querySelector('[data-mint]');
  if (el && me()) el.textContent = `+${mintable(me().id).toFixed(2)}`;
}, 1000);

window.addEventListener('hashchange', render);
render();

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' }).catch(() => {});
}
