import * as D from './data.js';
import { I, circlesArt } from './icons.js';

/* =========================================================================
   State: seeded from the static constants, persisted to localStorage so the
   demo survives reloads. Profile → "Reset demo" restores the constants.
   ========================================================================= */
const STORE_KEY = 'savings-circles-poc:v3';
const HOUR = 3600 * 1000;
const MINT_CAP_HOURS = 14 * 24;
const clone = (x) => JSON.parse(JSON.stringify(x));

function seed() {
  const now = Date.now();
  const lastMint = {};
  for (const m of D.MEMBERS) lastMint[m.id] = now - (D.LAST_MINT_HOURS_AGO[m.id] ?? 12) * HOUR;
  return {
    session: null, // { role: 'member' | 'admin', memberId }
    group: clone(D.GROUP),
    members: clone(D.MEMBERS),
    ledger: { m1: clone(D.CONTRIBUTIONS) },
    split: { m1: clone(D.LIFETIME_SPLIT) },
    loans: clone(D.LOAN_APPLICATIONS),
    claims: clone(D.WELFARE_CLAIMS),
    services: clone(D.SERVICES),
    jobs: clone(D.JOBS),
    activity: clone(D.ACTIVITY),
    lastMint,
    remindedAt: null,
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
const fmtMonth = (ym) => new Date(`${ym}-01`).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
const monthShort = (iso) => new Date(iso).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
const initials = (name) => name.split(/\s+/).map((p) => p[0]).slice(0, 2).join('').toUpperCase();
const member = (id) => S.members.find((m) => m.id === id);
const me = () => member(S.session?.memberId);
const isAdmin = () => S.session?.role === 'admin';
const cycleTotal = () => Object.values(S.group.contribution).reduce((a, b) => a + b, 0);
const firstName = (m) => m.name.split(' ')[0];
const today = () => new Date().toISOString().slice(0, 10);
const uid = (p) => `${p}${Math.random().toString(36).slice(2, 8)}`;

const mintable = (id) => {
  const hours = (Date.now() - (S.lastMint[id] ?? Date.now())) / HOUR;
  return Math.max(0, Math.min(hours, MINT_CAP_HOURS));
};
const outstanding = (m) => (m.loan ? Math.max(0, m.loan.amount - m.loan.repaid) : 0);
const pendingLoan = (m) => S.loans.find((l) => l.memberId === m.id && l.status === 'pending');
const loanLimit = (m) => Math.max(0, Math.floor((m.lifetime * S.group.loanRules.limitRatio) / 100) * 100);
const loanChecks = (m) => {
  const r = S.group.loanRules;
  return [
    { ok: m.months >= r.minMonths, text: `${r.minMonths}+ months of contributions`, sub: `You have ${m.months}` },
    { ok: outstanding(m) === 0, text: 'No active loan', sub: outstanding(m) ? `${kes(outstanding(m))} still to repay` : 'All clear' },
    { ok: !pendingLoan(m), text: 'No application waiting', sub: pendingLoan(m) ? 'Treasurer is reviewing it' : 'All clear' },
  ];
};
const ledgerFor = (id) => S.ledger[id] || (S.ledger[id] = [{ month: '2026-10', welfare: 0, savings: 0, development: 0, status: 'due' }]);
const splitFor = (id) => S.split[id] || (S.split[id] = { welfare: 0, savings: 0, development: 0 });
const statusBadge = (s) => ({
  paid: '<span class="badge ok">Paid</span>',
  partial: '<span class="badge warn">Partial</span>',
  due: '<span class="badge accent">Due</span>',
  missed: '<span class="badge bad">Missed</span>',
  pending: '<span class="badge warn">Pending</span>',
  approved: '<span class="badge ok">Approved</span>',
  rejected: '<span class="badge bad">Rejected</span>',
  repaid: '<span class="badge">Repaid</span>',
  open: '<span class="badge ok">Open</span>',
  taken: '<span class="badge">Taken</span>',
}[s] || `<span class="badge">${esc(s)}</span>`);

function log(memberId, text, kind, to) {
  S.activity.unshift({ memberId, text, when: today(), kind, to });
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

const avatar = (m, cls = '') => `<div class="avatar ${cls}" aria-hidden="true">${initials(m.name)}</div>`;
const amountField = (name, { value = '', suffix = 'KES', token = 'kes', min = 0, step = 'any', attrs = '' } = {}) => `
  <div class="field amount">
    <input name="${name}" type="number" inputmode="decimal" min="${min}" step="${step}" value="${value}" ${attrs} required />
    <span class="suffix"><span class="token ${token}">${token === 'kes' ? 'KSh' : 'A'}</span>${suffix}</span>
  </div>`;

/* ========================================================================= views: entry */
function vWelcome() {
  return `<div class="welcome">
    <div class="art">${circlesArt}</div>
    <h1 class="center">Save together.<br/>Trade your time.</h1>
    <p class="center muted">Your chama's book, welfare and loans in one place, plus ${esc(S.group.token)}, a shared currency every member mints at 1 per hour.</p>
    <div class="mt">
      <button class="choice accent" data-go="#/auth/member">
        <span class="ico">${I.user}</span>
        <span class="grow"><h3>I'm a member</h3><span class="small muted">Contribute, borrow and trade services</span></span>
        ${I.chevron}
      </button>
      <button class="choice" data-go="#/auth/admin">
        <span class="ico">${I.group}</span>
        <span class="grow"><h3>I run a chama</h3><span class="small muted">Chair or treasurer of an investment group</span></span>
        ${I.chevron}
      </button>
    </div>
    <p class="after-btn">Proof of concept · all data is mocked</p>
  </div>`;
}

function vAuth({ role }, q) {
  const mode = q.get('mode') === 'signup' ? 'signup' : 'login';
  const demo = member(D.DEMO_USERS[role]);
  const isA = role === 'admin';
  const tabs = `<div class="segment">
    <button class="${mode === 'login' ? 'on' : ''}" data-go="#/auth/${role}">Log in</button>
    <button class="${mode === 'signup' ? 'on' : ''}" data-go="#/auth/${role}?mode=signup">${isA ? 'Create chama' : 'Join chama'}</button>
  </div>`;
  const head = `${topbar('', { back: '#/' })}<h1>${isA ? 'Chama admin' : 'Member'}</h1>
    <p class="muted">${isA ? 'For the chair or treasurer who keeps the book.' : 'For anyone saving with a chama.'}</p>${tabs}`;

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
  if (!isA) {
    return `${head}
      <form data-form="signup-member" class="stack">
        <label class="label">Invite code</label>
        <div class="field"><input name="code" value="${esc(S.group.inviteCode)}" autocapitalize="characters" required /></div>
        <label class="label">Full name</label>
        <div class="field"><input name="name" placeholder="e.g. Wanjiru Achola" required /></div>
        <label class="label">Phone number</label>
        <div class="field"><input name="phone" type="tel" placeholder="+254 7…" required /></div>
        <label class="label">What do you do?</label>
        <div class="field"><input name="trade" placeholder="e.g. Tailor, boda rider" /></div>
        <label class="label">Choose a 4-digit PIN</label>
        <div class="field"><input name="pin" type="password" inputmode="numeric" maxlength="4" required /></div>
        <div class="mt"><button class="btn" type="submit">${I.arrow} Join ${esc(S.group.name)}</button></div>
        <p class="after-btn">Once you join you mint 1 ${esc(S.group.token)} every hour.</p>
      </form>`;
  }
  const c = S.group.contribution;
  return `${head}
    <form data-form="signup-admin" class="stack">
      <label class="label">Chama name</label>
      <div class="field"><input name="name" value="${esc(S.group.name)}" required /></div>
      <label class="label">Group token symbol</label>
      <div class="field"><input name="token" value="${esc(S.group.token)}" maxlength="12" required /><span class="suffix muted small">Group currency</span></div>
      <label class="label">Meetings</label>
      <div class="radio-row">
        ${['weekly', 'monthly'].map((v) => `<label><input type="radio" name="cadence" value="${v}" ${S.group.cadence === v ? 'checked' : ''}/><span>${v[0].toUpperCase() + v.slice(1)}</span></label>`).join('')}
      </div>
      <label class="label">Welfare per meeting</label>${amountField('welfare', { value: c.welfare })}
      <label class="label">Savings per meeting</label>${amountField('savings', { value: c.savings })}
      <label class="label">Development / loans per meeting</label>${amountField('development', { value: c.development })}
      <label class="label">Bank holding the pool</label>
      <div class="field"><input name="bank" value="${esc(S.group.bank.name)}" required /></div>
      <label class="label">Loan rules</label>
      <div class="box tight">
        <div class="row"><span>Months before borrowing</span><input name="minMonths" type="number" min="0" value="${S.group.loanRules.minMonths}" style="width:64px;text-align:right;border:0;font-weight:700;font-size:16px"/></div>
        <div class="row"><span>Limit, % of contributions</span><input name="limitPct" type="number" min="1" max="100" value="${S.group.loanRules.limitRatio * 100}" style="width:64px;text-align:right;border:0;font-weight:700;font-size:16px"/></div>
      </div>
      <label class="label">Your phone</label>
      <div class="field"><input name="phone" type="tel" value="${esc(demo.phone)}" required /></div>
      <div class="mt"><button class="btn" type="submit">${I.arrow} Create chama</button></div>
      <p class="after-btn">You'll get an invite code to share with members.</p>
    </form>`;
}

/* ========================================================================= views: member */
function welfareReminder(m) {
  const due = ledgerFor(m.id).find((r) => r.status === 'due');
  const c = S.group.contribution;
  if (!due) {
    return `<div class="reminder done"><div class="ico">${I.check}</div><div class="grow">
      <h3>You're paid up</h3><div class="small">Next meeting ${fmtDate(S.group.nextMeeting)}.</div></div></div>`;
  }
  return `<div class="reminder"><div class="ico">${I.bell}</div><div class="grow">
      <h3>Welfare due ${fmtDate(S.group.nextMeeting)}</h3>
      <div class="small">${kes(c.welfare)} welfare + ${kes(c.savings + c.development)} savings &amp; development for ${fmtMonth(due.month).split(' ')[0]}.</div>
      <div style="margin-top:10px"><button class="btn sm" data-act="pay-contribution">Pay ${kes(cycleTotal())}</button></div>
    </div></div>`;
}

function vHome() {
  const m = me();
  const avail = Math.max(0, loanLimit(m) - outstanding(m));
  const acts = S.activity.filter((a) => a.memberId === m.id || a.to === m.id).slice(0, 4);
  return `
    <div class="topbar">
      ${avatar(m)}
      <div class="grow"><div class="small muted">${esc(S.group.name)}</div><h3>Habari, ${esc(firstName(m))}</h3></div>
      <button class="icon-btn" data-go="#/save" aria-label="Reminders">${I.bell}</button>
    </div>
    <div class="hero accent">
      <div class="k">Your balance</div>
      <div class="big"><span data-bal>${tok(m.apwoche)}</span> <span style="font-size:20px">${esc(S.group.token)}</span></div>
      <div class="btn-row" style="margin-top:14px;align-items:center">
        <div class="small" style="flex:1"><strong data-mint>+${mintable(m.id).toFixed(2)}</strong> ready to mint<br/>1 every hour</div>
        <button class="btn sm secondary" data-act="mint" style="flex:0">${I.spark} Mint</button>
      </div>
      <div class="split">
        <div><div class="k">Contributed</div><strong>${kes(m.lifetime)}</strong></div>
        <div><div class="k">You can borrow</div><strong>${kes(avail)}</strong></div>
      </div>
    </div>
    ${welfareReminder(m)}
    <h2>Recent</h2>
    <div class="box">
      ${acts.length ? acts.map((a) => `<div class="row"><div class="grow"><div>${a.memberId === m.id ? 'You' : esc(member(a.memberId)?.name)} ${esc(a.text)}</div><div class="sub">${fmtDate(a.when)}</div></div></div>`).join('') : '<div class="empty">Nothing yet</div>'}
    </div>`;
}

function vSave() {
  const m = me();
  const split = splitFor(m.id);
  const total = Math.max(1, split.welfare + split.savings + split.development);
  const pct = (k) => ((split[k] / total) * 100).toFixed(1);
  const ledger = ledgerFor(m.id);
  const due = ledger.find((r) => r.status === 'due');
  const myClaims = S.claims.filter((c) => c.memberId === m.id);
  return `${topbar('Contributions')}
    <div class="small muted">Lifetime as a member</div>
    <div class="big">${kes(m.lifetime)}</div>
    <div class="chip-row" style="justify-content:flex-start;margin:10px 0 0"><span class="chip">${I.clock.replace('<svg', '<svg width="14" height="14"')} ${m.months} months · since ${monthShort(m.joined)}</span></div>
    <div class="splitbar"><span style="width:${pct('welfare')}%"></span><span style="width:${pct('savings')}%"></span><span style="width:${pct('development')}%"></span></div>
    <div class="box tight mt">
      ${D.ACCOUNTS.map((a, i) => `<div class="row"><div class="grow"><span class="legend l${i + 1}"></span>${a.label}<div class="sub" style="margin-left:18px">${a.hint}</div></div><div class="r">${kes(split[a.key])}</div></div>`).join('')}
    </div>
    <div class="mt">${due ? `<button class="btn" data-act="pay-contribution">${I.arrow} Pay ${fmtMonth(due.month).split(' ')[0]} · ${kes(cycleTotal())}</button>` : `<button class="btn" disabled>${I.check} ${fmtMonth(ledger[0].month).split(' ')[0]} paid</button>`}</div>
    <p class="after-btn">The pool is kept at ${esc(S.group.bank.name)} ${esc(S.group.bank.account)}.</p>

    <h2>Ledger</h2>
    <div class="box">
      ${ledger.map((r) => {
        const sum = r.welfare + r.savings + r.development;
        return `<div class="row"><div class="grow">${fmtMonth(r.month)}<div class="sub">${r.paidOn ? `Paid ${fmtDate(r.paidOn)}` : `Due ${fmtDate(S.group.nextMeeting)}`}</div></div><div class="r">${sum ? kes(sum) : '–'}<div>${statusBadge(r.status)}</div></div></div>`;
      }).join('')}
    </div>

    <h2>Welfare support</h2>
    <p class="muted small">Welfare is only for major sickness or a death in the family. The committee approves each request.</p>
    <button class="btn secondary" data-act="welfare-claim">${I.heart} Request welfare support</button>
    ${myClaims.length ? `<div class="box mt">${myClaims.map((c) => `<div class="row"><div class="grow">${c.reason === 'death' ? 'Bereavement' : 'Sickness'}<div class="sub">${fmtDate(c.createdAt)}</div></div><div class="r">${kes(c.amount)}<div>${statusBadge(c.status)}</div></div></div>`).join('')}</div>` : ''}`;
}

function vLoans() {
  const m = me();
  const r = S.group.loanRules;
  const checks = loanChecks(m);
  const eligible = checks.every((c) => c.ok);
  const limit = loanLimit(m);
  const mine = S.loans.filter((l) => l.memberId === m.id);
  const loanCard = m.loan && outstanding(m) > 0 ? `
    <h2>Active loan</h2>
    <div class="box"><div class="row"><span>Repaid</span><span class="r">${kes(m.loan.repaid)} / ${kes(m.loan.amount)}</span></div>
    <div style="padding:0 0 14px"><div class="bar"><span style="width:${(m.loan.repaid / m.loan.amount) * 100}%"></span></div></div></div>` : '';
  return `${topbar('Loans')}
    <div class="small muted">Your borrowing limit</div>
    <div class="big">${kes(Math.max(0, limit - outstanding(m)))}</div>
    <p class="muted small" style="margin-top:6px">${Math.round(r.limitRatio * 100)}% of what you've contributed. Your contributions are the collateral, so there is no bank paperwork.</p>
    <div class="box">
      <div class="row"><span>Lifetime contributed</span><span class="r">${kes(m.lifetime)}</span></div>
      <div class="row"><span>Limit ratio</span><span class="r">${Math.round(r.limitRatio * 100)}%</span></div>
      <div class="row"><span>Interest</span><span class="r">${(r.monthlyRate * 100).toFixed(0)}% / month, back to the pool</span></div>
    </div>
    <h2>Eligibility</h2>
    <div class="box">
      ${checks.map((c) => `<div class="row"><span class="token ${c.ok ? 'apwoche' : 'kes'}" style="background:${c.ok ? 'var(--ok-soft)' : 'var(--bad-soft)'}">${c.ok ? '✓' : '✕'}</span><div class="grow">${c.text}<div class="sub">${c.sub}</div></div></div>`).join('')}
    </div>
    <div class="mt"><button class="btn" data-go="#/loans/apply" ${eligible ? '' : 'disabled'}>${I.arrow} Apply for a loan</button></div>
    <p class="after-btn">${eligible ? 'The treasurer reviews applications at the next meeting.' : 'Meet all the checks above to apply.'}</p>
    ${loanCard}
    ${mine.length ? `<h2>Applications</h2><div class="box">${mine.map((l) => `<div class="row"><div class="grow ellipsis">${esc(l.purpose)}<div class="sub">${fmtDate(l.createdAt)} · ${l.termMonths} months</div></div><div class="r">${kes(l.amount)}<div>${statusBadge(l.status)}</div></div></div>`).join('')}</div>` : ''}`;
}

function vLoanApply() {
  const m = me();
  const limit = Math.max(0, loanLimit(m) - outstanding(m));
  const start = Math.min(20000, limit);
  return `${topbar('Apply for a loan', { back: '#/loans' })}
    <form data-form="loan" class="stack">
      <label class="label">You borrow</label>
      ${amountField('amount', { value: start, attrs: `max="${limit}" step="500"` })}
      <div class="center" style="margin:12px 0 0">${I.swap.replace('<svg', '<svg width="30" height="30"')}</div>
      <label class="label" style="margin-top:4px">You repay each month</label>
      <div class="field amount"><input data-out="monthly" readonly tabindex="-1" /><span class="suffix"><span class="token kes">KSh</span>KES</span></div>
      <div class="chip-row"><span class="chip">Limit ${kes(limit)}</span></div>
      <label class="label">Repay over</label>
      <div class="radio-row">
        ${[3, 6, 9, 12].map((t) => `<label><input type="radio" name="term" value="${t}" ${t === 6 ? 'checked' : ''}/><span>${t} months</span></label>`).join('')}
      </div>
      <label class="label">What is it for?</label>
      <div class="field"><textarea name="purpose" placeholder="e.g. Stock for my shop" required></textarea></div>
      <div class="box mt">
        <div class="row"><span>Interest</span><span class="r" data-out="interest"></span></div>
        <div class="row"><span>Total to repay</span><span class="r" data-out="total"></span></div>
        <div class="row"><span>Collateral</span><span class="r">Your contributions</span></div>
      </div>
      <div class="mt"><button class="btn" type="submit">${I.arrow} Submit application</button></div>
      <p class="after-btn">Interest goes back into the pool you share.</p>
    </form>`;
}

function updateLoanCalc(form) {
  const r = S.group.loanRules;
  const amt = Math.max(0, Number(form.amount.value) || 0);
  const term = Number(form.querySelector('[name=term]:checked')?.value || 6);
  const interest = amt * r.monthlyRate * term;
  form.querySelector('[data-out=monthly]').value = Math.ceil((amt + interest) / term).toLocaleString('en-KE');
  form.querySelector('[data-out=interest]').textContent = kes(interest);
  form.querySelector('[data-out=total]').textContent = kes(amt + interest);
}

/* ========================================================================= views: market */
function vMarket(_, q) {
  const m = me();
  const tab = q.get('tab') === 'jobs' ? 'jobs' : 'services';
  const T = esc(S.group.token);
  const services = S.services.map((s) => {
    const o = member(s.memberId);
    const own = s.memberId === m.id;
    return `<div class="card"><div class="top">${avatar(o)}<div class="grow"><h3>${esc(s.title)}</h3>
      <div class="meta">${esc(o.name)} · ${esc(s.category)}</div></div>
      <div class="price"><span class="token apwoche">A</span>${tok(s.price)}</div></div>
      ${s.note ? `<p class="small muted" style="margin:10px 0 0">${esc(s.note)}</p>` : ''}
      <div class="actions"><span class="small muted">per ${esc(s.unit)}</span>
      ${own ? `<button class="btn sm secondary" data-act="remove-service" data-id="${s.id}">Remove</button>` : `<button class="btn sm" data-act="pay-service" data-id="${s.id}">Pay in ${T}</button>`}</div></div>`;
  }).join('');
  const jobs = S.jobs.map((j) => {
    const o = member(j.memberId);
    const own = j.memberId === m.id;
    let action = '';
    if (j.status === 'open') action = own ? `<button class="btn sm secondary" data-act="close-job" data-id="${j.id}">Close</button>` : `<button class="btn sm" data-act="take-job" data-id="${j.id}">I'll do it</button>`;
    else if (own && j.takenBy) action = `<button class="btn sm" data-act="pay-job" data-id="${j.id}">Done · pay</button>`;
    else action = statusBadge(j.status);
    return `<div class="card"><div class="top">${avatar(o)}<div class="grow"><h3>${esc(j.title)}</h3>
      <div class="meta">${esc(o.name)} · ${esc(j.when)}</div></div>
      <div class="price"><span class="token apwoche">A</span>${tok(j.reward)}</div></div>
      <div class="actions"><span class="small muted">${esc(j.category)} · ${tok(j.reward)} ${esc(j.unit)}${j.takenBy ? ` · ${j.takenBy === m.id ? 'you' : esc(firstName(member(j.takenBy)))} took it` : ''}</span>${action}</div></div>`;
  }).join('');
  return `${topbar(`${T} board`, { right: `<button class="btn sm" data-go="#/market/new?type=${tab === 'jobs' ? 'job' : 'service'}">${I.plus} Post</button>` })}
    <p class="muted small">Pay each other in ${T} instead of shillings. One ${T} is roughly one hour of someone's time.</p>
    <div class="box tight">
      <div class="row"><span class="token apwoche">A</span><div class="grow">Your ${T}<div class="sub">You mint 1 every hour</div></div><strong>${tok(m.apwoche)}</strong></div>
    </div>
    <div class="segment mt">
      <button class="${tab === 'services' ? 'on' : ''}" data-go="#/market">Services (${S.services.length})</button>
      <button class="${tab === 'jobs' ? 'on' : ''}" data-go="#/market?tab=jobs">Jobs (${S.jobs.filter((j) => j.status === 'open').length})</button>
    </div>
    ${tab === 'services' ? services || '<div class="empty">No services yet</div>' : jobs || '<div class="empty">No jobs yet</div>'}`;
}

function vMarketNew(_, q) {
  const type = q.get('type') === 'job' ? 'job' : 'service';
  const T = esc(S.group.token);
  return `${topbar(type === 'job' ? 'Post a job' : 'Offer a service', { back: `#/market${type === 'job' ? '?tab=jobs' : ''}` })}
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
      ${amountField('price', { value: 1, suffix: T, token: 'apwoche', step: '0.5' })}
      <label class="label">Per</label>
      <div class="radio-row">${(type === 'job' ? ['hours', 'job'] : ['hour', 'cut', 'ride', 'session', 'item']).map((u, i) => `<label><input type="radio" name="unit" value="${u}" ${i === 0 ? 'checked' : ''}/><span>${u}</span></label>`).join('')}</div>
      <label class="label">${type === 'job' ? 'When' : 'Details'}</label>
      <div class="field"><input name="note" placeholder="${type === 'job' ? 'e.g. Saturday morning' : 'Where to find you, hours'}" /></div>
      <div class="mt"><button class="btn" type="submit">${I.arrow} Post to board</button></div>
      <p class="after-btn">Every member of ${esc(S.group.name)} can see it.</p>
    </form>`;
}

/* ========================================================================= views: profile */
function vProfile() {
  const m = me();
  const g = S.group;
  return `${topbar('Profile')}
    <div class="center" style="margin:10px 0 18px">${avatar(m, 'lg').replace('class="avatar', 'style="margin:0 auto 10px" class="avatar')}
      <h3>${esc(m.name)}</h3><div class="small muted">${esc(m.trade || 'Member')} · ${esc(m.phone)}</div>
      <div style="margin-top:8px"><span class="badge accent">${isAdmin() ? 'Chama admin' : 'Member'}</span></div></div>
    <div class="box">
      <div class="row"><span>Chama</span><span class="r">${esc(g.name)}</span></div>
      <div class="row"><span>Member since</span><span class="r">${monthShort(m.joined)}</span></div>
      <div class="row"><span>Meetings</span><span class="r">${g.cadence[0].toUpperCase() + g.cadence.slice(1)}</span></div>
      <div class="row"><span>Pool held at</span><span class="r">${esc(g.bank.name)} ${esc(g.bank.account)}</span></div>
      <div class="row"><span>Invite code</span><span class="r">${esc(g.inviteCode)}</span></div>
    </div>
    ${isAdmin() ? `<h2>Chama settings</h2><div class="box">
      ${D.ACCOUNTS.map((a) => `<div class="row"><span>${a.label}</span><span class="r">${kes(g.contribution[a.key])}</span></div>`).join('')}
      <div class="row"><span>Months before borrowing</span><span class="r">${g.loanRules.minMonths}</span></div>
      <div class="row"><span>Loan limit</span><span class="r">${Math.round(g.loanRules.limitRatio * 100)}% of contributions</span></div>
    </div>` : ''}
    <h2>Demo</h2>
    <div class="stack">
      <button class="btn secondary" data-act="switch-role">${I.swap} Switch to ${isAdmin() ? 'member' : 'admin'} view</button>
      <button class="btn secondary" data-act="reset">Reset demo data</button>
      <button class="btn ghost" data-act="logout">Log out</button>
    </div>`;
}

/* ========================================================================= views: admin */
function vAdmin() {
  const g = S.group;
  const inBank = g.pool.welfare + g.pool.savings + g.pool.development;
  const paid = S.members.filter((m) => m.paidThisCycle).length;
  const unpaid = S.members.filter((m) => !m.paidThisCycle);
  const pending = S.loans.filter((l) => l.status === 'pending').length + S.claims.filter((c) => c.status === 'pending').length;
  const reminded = S.remindedAt === g.nextMeeting;
  return `
    <div class="topbar">
      <div class="avatar" style="background:var(--accent)">${initials(g.name)}</div>
      <div class="grow"><div class="small muted">${esc(g.location)}</div><h3>${esc(g.name)}</h3></div>
      <span class="badge accent">Admin</span>
    </div>
    <div class="hero accent">
      <div class="k">In the bank · ${esc(g.bank.name)}</div>
      <div class="big">${kes(inBank)}</div>
      <div class="split" style="grid-template-columns:1fr 1fr 1fr">
        <div><div class="k">Welfare</div><strong>${tok(g.pool.welfare / 1000)}k</strong></div>
        <div><div class="k">Savings</div><strong>${tok(g.pool.savings / 1000)}k</strong></div>
        <div><div class="k">Develop.</div><strong>${tok(g.pool.development / 1000)}k</strong></div>
      </div>
    </div>
    ${unpaid.length ? `<div class="reminder ${reminded ? 'done' : ''}"><div class="ico">${reminded ? I.check : I.bell}</div><div class="grow">
      <h3>${unpaid.length} ${unpaid.length === 1 ? 'member hasn\'t' : 'members haven\'t'} paid welfare</h3>
      <div class="small">${unpaid.map((m) => esc(firstName(m))).join(', ')} · meeting ${fmtDate(g.nextMeeting)}</div>
      <div style="margin-top:10px">${reminded ? '<span class="small"><strong>Reminder sent by SMS</strong></span>' : '<button class="btn sm" data-act="remind">Send reminder</button>'}</div>
    </div></div>` : `<div class="reminder done"><div class="ico">${I.check}</div><div class="grow"><h3>Everyone has paid</h3><div class="small">Meeting ${fmtDate(g.nextMeeting)}</div></div></div>`}
    <div class="stats">
      <a class="stat" href="#/admin/members" style="text-decoration:none"><div class="v">${paid}/${S.members.length}</div><div class="k">paid this cycle</div></a>
      <a class="stat" href="#/admin/requests" style="text-decoration:none"><div class="v">${pending}</div><div class="k">requests waiting</div></a>
      <div class="stat"><div class="v">${kes(g.pool.lentOut)}</div><div class="k">lent to members</div></div>
      <div class="stat"><div class="v">${kes(cycleTotal())}</div><div class="k">per member / ${g.cadence === 'weekly' ? 'week' : 'month'}</div></div>
    </div>
    <h2>Invite members</h2>
    <div class="box"><div class="row"><div class="grow">Invite code<div class="sub">Members enter it when joining</div></div><strong>${esc(g.inviteCode)}</strong></div></div>`;
}

function vAdminMembers() {
  return `${topbar('Members')}
    <p class="muted small">${S.members.length} members · tap a member to record a cash payment from the meeting.</p>
    <div class="box">
      ${S.members.map((m) => `<div class="row link" data-act="member-detail" data-id="${m.id}">${avatar(m)}
        <div class="grow"><div class="ellipsis"><strong>${esc(m.name)}</strong></div><div class="sub ellipsis">${esc(m.trade)} · ${kes(m.lifetime)}</div></div>
        <div class="r">${m.paidThisCycle ? statusBadge('paid') : statusBadge('due')}${outstanding(m) ? '<div><span class="badge">Loan</span></div>' : ''}</div></div>`).join('')}
    </div>`;
}

function vAdminRequests(_, q) {
  const tab = q.get('tab') === 'welfare' ? 'welfare' : 'loans';
  const loans = S.loans.filter((l) => l.status === 'pending');
  const claims = S.claims.filter((c) => c.status === 'pending');
  const loanCards = loans.map((l) => {
    const m = member(l.memberId);
    const limit = loanLimit(m);
    const over = l.amount > limit;
    return `<div class="card"><div class="top">${avatar(m)}<div class="grow"><h3>${esc(m.name)}</h3><div class="meta">${fmtDate(l.createdAt)} · ${l.termMonths} months</div></div><div class="price">${kes(l.amount)}</div></div>
      <p class="small" style="margin:10px 0 6px">${esc(l.purpose)}</p>
      <div class="box tight" style="padding:0 12px">
        <div class="row small"><span>Contributed</span><span class="r">${kes(m.lifetime)} · ${m.months} mo</span></div>
        <div class="row small"><span>Limit</span><span class="r">${kes(limit)} ${over ? statusBadge('rejected').replace('Rejected', 'Over limit') : ''}</span></div>
      </div>
      <div class="btn-row mt"><button class="btn sm secondary" data-act="reject-loan" data-id="${l.id}">Reject</button><button class="btn sm" data-act="approve-loan" data-id="${l.id}">Approve</button></div></div>`;
  }).join('');
  const claimCards = claims.map((c) => {
    const m = member(c.memberId);
    return `<div class="card"><div class="top">${avatar(m)}<div class="grow"><h3>${esc(m.name)}</h3><div class="meta">${c.reason === 'death' ? 'Bereavement' : 'Sickness'} · ${fmtDate(c.createdAt)}</div></div><div class="price">${kes(c.amount)}</div></div>
      <p class="small" style="margin:10px 0 0">${esc(c.note)}</p>
      <div class="btn-row mt"><button class="btn sm secondary" data-act="reject-claim" data-id="${c.id}">Decline</button><button class="btn sm" data-act="approve-claim" data-id="${c.id}">Pay out</button></div></div>`;
  }).join('');
  return `${topbar('Requests')}
    <div class="segment">
      <button class="${tab === 'loans' ? 'on' : ''}" data-go="#/admin/requests">Loans (${loans.length})</button>
      <button class="${tab === 'welfare' ? 'on' : ''}" data-go="#/admin/requests?tab=welfare">Welfare (${claims.length})</button>
    </div>
    ${tab === 'loans'
      ? `<p class="small muted">Development account: ${kes(S.group.pool.development)} available.</p>${loanCards || '<div class="empty">No loan applications waiting</div>'}`
      : `<p class="small muted">Welfare account: ${kes(S.group.pool.welfare)} available.</p>${claimCards || '<div class="empty">No welfare requests waiting</div>'}`}`;
}

/* ========================================================================= sheets */
function sheetPayContribution(m) {
  const c = S.group.contribution;
  openSheet(`<h1 style="font-size:22px">Pay this cycle</h1>
    <p class="muted small">Sent by M-Pesa to the chama paybill, then banked at ${esc(S.group.bank.name)}.</p>
    <div class="box">${D.ACCOUNTS.map((a) => `<div class="row"><span>${a.label}</span><span class="r">${kes(c[a.key])}</span></div>`).join('')}
      <div class="row"><strong>Total</strong><strong>${kes(cycleTotal())}</strong></div></div>
    <div class="mt"><button class="btn" data-act="confirm-contribution" data-id="${m.id}">${I.arrow} Pay ${kes(cycleTotal())}</button></div>
    <p class="after-btn">Mock payment, no money moves.</p>`);
}

function sheetWelfare() {
  openSheet(`<h1 style="font-size:22px">Welfare support</h1>
    <form data-form="claim" class="stack">
      <label class="label">Reason</label>
      <div class="radio-row"><label><input type="radio" name="reason" value="sickness" checked/><span>Major sickness</span></label><label><input type="radio" name="reason" value="death"/><span>Death in the family</span></label></div>
      <label class="label">Amount needed</label>${amountField('amount', { value: 10000, step: '500' })}
      <label class="label">Tell the committee</label>
      <div class="field"><textarea name="note" placeholder="Who is affected, hospital or funeral details" required></textarea></div>
      <div class="chip-row"><span class="chip">Welfare pool ${kes(S.group.pool.welfare)}</span></div>
      <button class="btn" type="submit">${I.arrow} Send request</button>
    </form>`);
}

function sheetPayService(s, m) {
  const o = member(s.memberId);
  const T = esc(S.group.token);
  openSheet(`<h1 style="font-size:22px">Pay ${esc(firstName(o))}</h1>
    <p class="muted small">${esc(s.title)} · ${tok(s.price)} ${T} per ${esc(s.unit)}</p>
    <form data-form="pay-service" data-id="${s.id}" class="stack">
      <label class="label">You send</label>${amountField('amount', { value: s.price, suffix: T, token: 'apwoche', step: '0.5' })}
      <div class="box mt"><div class="row"><span>Shillings used</span><span class="r">None!</span></div><div class="row"><span>Fee</span><span class="r">Free!</span></div></div>
      <div class="mt"><button class="btn" type="submit">${I.arrow} Send ${T}</button></div>
      <p class="after-btn">You have ${tok(m.apwoche)} ${T}.</p>
    </form>`);
}

function sheetMember(m) {
  openSheet(`<div class="center">${avatar(m, 'lg').replace('class="avatar', 'style="margin:0 auto 10px" class="avatar')}<h3>${esc(m.name)}</h3><div class="small muted">${esc(m.trade)} · ${esc(m.phone)}</div></div>
    <div class="box mt">
      <div class="row"><span>Lifetime contributed</span><span class="r">${kes(m.lifetime)}</span></div>
      <div class="row"><span>Months</span><span class="r">${m.months}</span></div>
      <div class="row"><span>Loan limit</span><span class="r">${kes(loanLimit(m))}</span></div>
      <div class="row"><span>Outstanding loan</span><span class="r">${outstanding(m) ? kes(outstanding(m)) : 'None'}</span></div>
      <div class="row"><span>This cycle</span><span class="r">${m.paidThisCycle ? statusBadge('paid') : statusBadge('due')}</span></div>
    </div>
    <div class="mt">${m.paidThisCycle ? `<button class="btn" disabled>${I.check} Paid this cycle</button>` : `<button class="btn" data-act="confirm-contribution" data-id="${m.id}">Record ${kes(cycleTotal())} cash payment</button>`}</div>`);
}

/* ========================================================================= actions */
function payContribution(m) {
  const c = S.group.contribution;
  const due = ledgerFor(m.id).find((r) => r.status === 'due');
  if (due) Object.assign(due, { ...c, status: 'paid', paidOn: today() });
  const split = splitFor(m.id);
  for (const k of Object.keys(c)) { split[k] += c[k]; S.group.pool[k] += c[k]; }
  m.lifetime += cycleTotal();
  m.months += 1;
  m.paidThisCycle = true;
  log(m.id, `paid ${due ? fmtMonth(due.month).split(' ')[0] : 'this cycle'} contribution · ${kes(cycleTotal())}`, 'save');
}

const actions = {
  'close-sheet': closeSheet,
  'pay-contribution': () => sheetPayContribution(me()),
  'confirm-contribution': (el) => {
    const m = member(el.dataset.id);
    payContribution(m);
    closeSheet();
    toast(m.id === me().id ? 'Contribution paid. Asante!' : `Recorded payment for ${firstName(m)}`);
  },
  mint: () => {
    const m = me();
    const amt = mintable(m.id);
    if (amt < 0.01) return toast('Nothing to mint yet');
    m.apwoche = Math.round((m.apwoche + amt) * 100) / 100;
    S.lastMint[m.id] = Date.now();
    log(m.id, `minted ${tok(amt)} ${S.group.token}`, 'mint');
    toast(`Minted ${tok(amt)} ${S.group.token}`);
  },
  'welfare-claim': sheetWelfare,
  'pay-service': (el) => sheetPayService(S.services.find((s) => s.id === el.dataset.id), me()),
  'remove-service': (el) => { S.services = S.services.filter((s) => s.id !== el.dataset.id); toast('Removed from the board'); },
  'take-job': (el) => {
    const j = S.jobs.find((x) => x.id === el.dataset.id);
    Object.assign(j, { status: 'taken', takenBy: me().id });
    log(me().id, `took the job "${j.title}"`, 'job');
    toast(`${firstName(member(j.memberId))} has been told you'll do it`);
  },
  'close-job': (el) => { S.jobs.find((x) => x.id === el.dataset.id).status = 'closed'; toast('Job closed'); },
  'pay-job': (el) => {
    const j = S.jobs.find((x) => x.id === el.dataset.id);
    const m = me();
    if (m.apwoche < j.reward) return toast(`Not enough ${S.group.token}`);
    m.apwoche -= j.reward;
    member(j.takenBy).apwoche += j.reward;
    j.status = 'paid';
    log(m.id, `paid ${firstName(member(j.takenBy))} ${tok(j.reward)} ${S.group.token} for "${j.title}"`, 'out', j.takenBy);
    toast(`Paid ${tok(j.reward)} ${S.group.token}`);
  },
  remind: () => { S.remindedAt = S.group.nextMeeting; toast('SMS reminder sent'); },
  'member-detail': (el) => sheetMember(member(el.dataset.id)),
  'approve-loan': (el) => {
    const l = S.loans.find((x) => x.id === el.dataset.id);
    const m = member(l.memberId);
    if (l.amount > S.group.pool.development) return toast('Not enough in the development account');
    l.status = 'approved';
    m.loan = { amount: l.amount, repaid: 0 };
    S.group.pool.development -= l.amount;
    S.group.pool.lentOut += l.amount;
    log(m.id, `got a loan of ${kes(l.amount)}`, 'loan');
    toast(`Loan approved for ${firstName(m)}`);
  },
  'reject-loan': (el) => { S.loans.find((x) => x.id === el.dataset.id).status = 'rejected'; toast('Application rejected'); },
  'approve-claim': (el) => {
    const c = S.claims.find((x) => x.id === el.dataset.id);
    if (c.amount > S.group.pool.welfare) return toast('Not enough in the welfare account');
    c.status = 'paid';
    S.group.pool.welfare -= c.amount;
    toast(`${kes(c.amount)} sent to ${firstName(member(c.memberId))}`);
  },
  'reject-claim': (el) => { S.claims.find((x) => x.id === el.dataset.id).status = 'rejected'; toast('Request declined'); },
  'switch-role': () => {
    const role = isAdmin() ? 'member' : 'admin';
    S.session = { role, memberId: D.DEMO_USERS[role] };
    location.hash = role === 'admin' ? '#/admin' : '#/home';
  },
  reset: () => { const session = S.session; S = seed(); S.session = session && { role: session.role, memberId: D.DEMO_USERS[session.role] }; toast('Demo data reset'); },
  logout: () => { S.session = null; location.hash = '#/'; },
};

const forms = {
  login: (f, data) => {
    const role = f.dataset.role;
    const found = S.members.find((m) => m.phone.replace(/\s/g, '') === data.phone.replace(/\s/g, '') && (role === 'member' || m.role === 'admin'));
    S.session = { role, memberId: found?.id || D.DEMO_USERS[role] };
    location.hash = role === 'admin' ? '#/admin' : '#/home';
  },
  'signup-member': (f, data) => {
    if (data.code.trim().toUpperCase() !== S.group.inviteCode) return toast('That invite code is not valid');
    const m = { id: uid('m'), name: data.name.trim(), phone: data.phone.trim(), trade: data.trade.trim() || 'Member', role: 'member', joined: today(), months: 0, lifetime: 0, paidThisCycle: false, apwoche: 0, loan: null };
    S.members.push(m);
    S.lastMint[m.id] = Date.now() - 2 * HOUR;
    S.session = { role: 'member', memberId: m.id };
    log(m.id, `joined ${S.group.name}`, 'join');
    location.hash = '#/home';
    toast(`Karibu, ${firstName(m)}!`);
  },
  'signup-admin': (f, data) => {
    const g = S.group;
    Object.assign(g, {
      name: data.name.trim(),
      token: data.token.trim(),
      cadence: data.cadence,
      contribution: { welfare: +data.welfare, savings: +data.savings, development: +data.development },
      bank: { ...g.bank, name: data.bank.trim() },
      loanRules: { ...g.loanRules, minMonths: +data.minMonths, limitRatio: Math.min(1, Math.max(0.01, +data.limitPct / 100)) },
      inviteCode: `${data.token.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8)}-${Math.floor(1000 + Math.random() * 9000)}`,
    });
    S.session = { role: 'admin', memberId: D.DEMO_USERS.admin };
    location.hash = '#/admin';
    toast(`Chama ready. Invite code ${g.inviteCode}`);
  },
  loan: (f, data) => {
    const m = me();
    const amount = +data.amount;
    const limit = loanLimit(m) - outstanding(m);
    if (!(amount > 0)) return toast('Enter an amount');
    if (amount > limit) return toast(`Your limit is ${kes(limit)}`);
    S.loans.unshift({ id: uid('l'), memberId: m.id, amount, termMonths: +data.term, purpose: data.purpose.trim(), status: 'pending', createdAt: today() });
    log(m.id, `applied for a loan of ${kes(amount)}`, 'loan');
    location.hash = '#/loans';
    toast('Application sent to the treasurer');
  },
  claim: (f, data) => {
    S.claims.unshift({ id: uid('w'), memberId: me().id, reason: data.reason, note: data.note.trim(), amount: +data.amount, status: 'pending', createdAt: today() });
    closeSheet();
    toast('Request sent to the committee');
  },
  'pay-service': (f, data) => {
    const s = S.services.find((x) => x.id === f.dataset.id);
    const m = me();
    const amt = +data.amount;
    if (!(amt > 0)) return toast('Enter an amount');
    if (amt > m.apwoche) return toast(`Not enough ${S.group.token}. Mint more on Home.`);
    m.apwoche -= amt;
    member(s.memberId).apwoche += amt;
    log(m.id, `paid ${firstName(member(s.memberId))} ${tok(amt)} ${S.group.token} for ${s.title.toLowerCase()}`, 'out', s.memberId);
    closeSheet();
    toast(`Sent ${tok(amt)} ${S.group.token} to ${firstName(member(s.memberId))}`);
  },
  post: (f, data) => {
    const m = me();
    if (f.dataset.type === 'job') {
      S.jobs.unshift({ id: uid('j'), memberId: m.id, title: data.title.trim(), reward: +data.price, unit: data.unit, category: data.category, when: data.note.trim() || 'Flexible', status: 'open' });
      location.hash = '#/market?tab=jobs';
    } else {
      S.services.unshift({ id: uid('s'), memberId: m.id, title: data.title.trim(), price: +data.price, unit: data.unit, category: data.category, note: data.note.trim() });
      location.hash = '#/market';
    }
    toast('Posted to the board');
  },
};

/* ========================================================================= router */
const MEMBER_TABS = [
  ['#/home', 'Home', I.home], ['#/save', 'Save', I.save], ['#/loans', 'Loans', I.loan], ['#/market', 'Market', I.market], ['#/profile', 'Profile', I.user],
];
const ADMIN_TABS = [
  ['#/admin', 'Group', I.group], ['#/admin/members', 'Members', I.users], ['#/admin/requests', 'Requests', I.inbox], ['#/market', 'Market', I.market], ['#/profile', 'Profile', I.user],
];

const routes = [
  { re: /^\/$/, view: vWelcome, guest: true },
  { re: /^\/auth\/(?<role>member|admin)$/, view: vAuth, guest: true },
  { re: /^\/home$/, view: vHome, role: 'member' },
  { re: /^\/save$/, view: vSave, role: 'member' },
  { re: /^\/loans$/, view: vLoans, role: 'member' },
  { re: /^\/loans\/apply$/, view: vLoanApply, role: 'member' },
  { re: /^\/market$/, view: vMarket },
  { re: /^\/market\/new$/, view: vMarketNew },
  { re: /^\/profile$/, view: vProfile },
  { re: /^\/admin$/, view: vAdmin, role: 'admin' },
  { re: /^\/admin\/members$/, view: vAdminMembers, role: 'admin' },
  { re: /^\/admin\/requests$/, view: vAdminRequests, role: 'admin' },
];

let lastPath = null;
function render() {
  const [path, qs = ''] = (location.hash.slice(1) || '/').split('?');
  const q = new URLSearchParams(qs);
  const home = isAdmin() ? '#/admin' : '#/home';
  let route = routes.find((r) => r.re.test(path));
  if (!route) { location.replace(S.session ? home : '#/'); return; }
  if (route.guest && S.session) { location.replace(home); return; }
  if (!route.guest && !S.session) { location.replace('#/'); return; }
  if (route.role && route.role !== S.session.role) { location.replace(home); return; }

  const keepScroll = path === lastPath;
  const scroll = $app.scrollTop;
  $app.innerHTML = route.view(path.match(route.re).groups || {}, q);
  $app.scrollTop = keepScroll ? scroll : 0;
  lastPath = path;

  if (S.session && !route.guest) {
    const tabs = isAdmin() ? ADMIN_TABS : MEMBER_TABS;
    const current = `#${path}`;
    $tabbar.innerHTML = tabs.map(([href, label, icon]) => {
      const on = current === href || (href !== '#/admin' && current.startsWith(`${href}/`));
      return `<a href="${href}" class="${on ? 'on' : ''}" ${on ? 'aria-current="page"' : ''}><span class="pip">${icon}</span>${label}</a>`;
    }).join('');
    $tabbar.hidden = false;
  } else {
    $tabbar.hidden = true;
  }
  const loanForm = $app.querySelector('form[data-form=loan]');
  if (loanForm) updateLoanCalc(loanForm);
  save();
}

/* ========================================================================= events */
document.addEventListener('click', (e) => {
  const go = e.target.closest('[data-go]');
  if (go) { e.preventDefault(); closeSheet(); location.hash = go.dataset.go; return; }
  const act = e.target.closest('[data-act]');
  if (act && actions[act.dataset.act]) {
    e.preventDefault();
    const keepSheet = ['pay-contribution', 'welfare-claim', 'pay-service', 'member-detail'].includes(act.dataset.act);
    actions[act.dataset.act](act);
    if (!keepSheet) save();
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

document.addEventListener('input', (e) => {
  const f = e.target.closest('form[data-form=loan]');
  if (f) updateLoanCalc(f);
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
