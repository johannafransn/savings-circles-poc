import { I, cat } from '../js/icons.js';
import {
  S, save, reloadState, resetState, STORE_KEY, esc, tok, fmtDate, member, firstName, joinLink, waShare, avatarHtml, DAY,
} from '../js/store.js';

const $root = document.getElementById('admin');
const $toast = document.getElementById('toast');
const T = () => esc(S.community.token);
const coin = '<span class="token coin">A</span>';
let toastTimer;
function toast(msg) {
  $toast.textContent = msg; $toast.hidden = false;
  clearTimeout(toastTimer); toastTimer = setTimeout(() => { $toast.hidden = true; }, 2400);
}
const nameOf = (id) => esc(member(id)?.name || 'Former member');
const catTile = (key) => `<div class="tile sm" style="background:${cat(key).tint}">${cat(key).icon}</div>`;
const shareText = () => `Karibu! Join ${S.community.fullName || S.community.name} on ${S.community.token}. Buy and sell with your neighbours: ${joinLink()}`;

/* ---------------------------------------------------------------- views */
function vLogin() {
  const g = member(S.community.adminId);
  return `<div class="a-login"><div class="panel">
    <span class="big-ico">${I.fingerprint}</span>
    <h1 style="font-size:24px;margin:0 0 6px">${T()} admin</h1>
    <p class="muted">For chama admins. Invite members and look after your community market.</p>
    <button class="btn mt" data-act="login">${I.fingerprint} Log in with passkey</button>
    <p class="after-btn">Demo: logs in as ${esc(g?.name || 'the admin')}.</p>
  </div></div>`;
}

function vOverview() {
  const weekAgo = Date.now() - 7 * DAY;
  const trades = S.activity.filter((a) => a.kind === 'pay' && new Date(a.when).getTime() >= weekAgo);
  const circulation = S.members.reduce((s, m) => s + m.balance, 0);
  const openReqs = S.requests.filter((r) => r.status === 'open' && !r.hidden).length;
  const pays = S.activity.filter((a) => a.kind === 'pay').slice(0, 8);
  const newest = [...S.members].sort((a, b) => b.joined.localeCompare(a.joined)).slice(0, 5);
  return `<div class="a-head"><div><h1>Overview</h1><div class="muted">${esc(S.community.fullName || S.community.name)} · ${esc(S.community.location)}</div></div>
      <a class="btn sm" href="#/invite">${I.whatsapp} Invite members</a></div>
    <div class="a-stats">
      <a class="a-stat accent" href="#/members" aria-label="${T()} in circulation: see members"><span class="go">${I.chevron}</span><div class="v">${coin}${tok(Math.round(circulation))}</div><div class="k">${T()} in circulation</div></a>
      <a class="a-stat" href="#/members" aria-label="Members"><span class="go">${I.chevron}</span><div class="v">${S.members.length}</div><div class="k">members</div></a>
      <a class="a-stat" href="#/trades" aria-label="Trades this week"><span class="go">${I.chevron}</span><div class="v">${trades.length}</div><div class="k">trades this week</div></a>
      <a class="a-stat" href="#/market?show=requests" aria-label="Open requests"><span class="go">${I.chevron}</span><div class="v">${openReqs}</div><div class="k">open requests</div></a>
    </div>
    <div class="a-cols">
      <div class="a-card"><h2>Recent trades</h2><div class="overflow-x"><table class="a-table">
        <thead><tr><th>From</th><th>To</th><th>For</th><th class="num">${T()}</th><th>Date</th></tr></thead>
        <tbody>${pays.map((a) => `<tr><td>${nameOf(a.from)}</td><td>${nameOf(a.to)}</td><td>${esc(a.what || '')}</td><td class="num">${tok(a.amount)}</td><td>${fmtDate(a.when)}</td></tr>`).join('') || '<tr><td colspan="5" class="muted">No trades yet</td></tr>'}</tbody>
      </table></div></div>
      <div class="a-card"><h2>Newest members</h2><table class="a-table"><tbody>
        ${newest.map((m) => `<tr><td><div class="who">${avatarHtml(m)}${esc(m.name)}</div></td><td>${fmtDate(m.joined)}</td></tr>`).join('')}
      </tbody></table></div>
    </div>`;
}

function vInvite() {
  const link = joinLink();
  const viaLink = S.members.filter((m) => m.via === 'link').sort((a, b) => b.joined.localeCompare(a.joined));
  return `<div class="a-head"><div><h1>Invite members</h1><div class="muted">Members can only join with this link. Send it on WhatsApp.</div></div></div>
    <div class="a-card">
      <h2>Your join link</h2>
      <div class="a-link-box">
        <div class="field"><span class="field-ico">${I.link}</span><input id="join-link" value="${esc(link)}" readonly /></div>
        <button class="btn sm secondary" data-act="copy">${I.copy} Copy</button>
        <a class="btn sm wa-btn" href="${waShare(shareText())}" target="_blank" rel="noopener" id="wa-share">${I.whatsapp} Share on WhatsApp</a>
      </div>
      <p class="hint" style="margin-top:12px">New members tap the link, save a passkey, add their name and the services they offer. They never see an invite code.</p>
      <a class="small" href="${esc(link)}" target="_blank" rel="noopener"><strong>Open the link as a new member</strong></a>
    </div>
    <div class="a-card"><h2>Joined with the link (${viaLink.length})</h2><div class="overflow-x"><table class="a-table" id="via-link">
      <thead><tr><th>Name</th><th>Phone</th><th>Services</th><th>Joined</th></tr></thead>
      <tbody>${viaLink.map((m) => `<tr><td><div class="who">${avatarHtml(m)}${esc(m.name)}</div></td><td>${esc(m.phone)}</td><td>${S.services.filter((s) => s.memberId === m.id).length}</td><td>${fmtDate(m.joined)}</td></tr>`).join('') || '<tr><td colspan="4" class="muted">Nobody yet. Share the link above.</td></tr>'}</tbody>
    </table></div></div>`;
}

function vMembers() {
  const rows = [...S.members].sort((a, b) => a.name.localeCompare(b.name));
  const total = S.members.reduce((t, m) => t + m.balance, 0);
  return `<div class="a-head"><div><h1>Members</h1><div class="muted">${S.members.length} people · ${tok(Math.round(total))} ${T()} in circulation</div></div>
      <a class="btn sm" href="#/invite">${I.plus} Invite</a></div>
    <div class="a-card"><div class="overflow-x"><table class="a-table">
      <thead><tr><th>Name</th><th>Phone</th><th class="num">Balance</th><th>Services</th><th>Joined</th><th>How</th><th></th></tr></thead>
      <tbody>${rows.map((m) => `<tr><td><div class="who">${avatarHtml(m)}${esc(m.name)}${m.id === S.community.adminId ? ' <span class="badge accent">Admin</span>' : ''}</div></td>
        <td>${esc(m.phone)}</td><td class="num">${tok(m.balance)}</td><td>${S.services.filter((s) => s.memberId === m.id).length}</td><td>${fmtDate(m.joined)}</td>
        <td>${m.via === 'link' ? '<span class="badge ok">Link</span>' : '<span class="badge">Founder</span>'}</td>
        <td class="num">${m.id === S.community.adminId ? '' : `<button class="btn sm secondary" data-act="remove-member" data-id="${m.id}">${I.trash} Remove</button>`}</td></tr>`).join('')}</tbody>
    </table></div></div>`;
}

function vMarket() {
  return `<div class="a-head"><div><h1>Market</h1><div class="muted">Hide anything that shouldn't be on the market.</div></div></div>
    <div class="a-card"><h2>Services (${S.services.length})</h2><div class="overflow-x"><table class="a-table">
      <thead><tr><th></th><th>Service</th><th>By</th><th class="num">${T()} / session</th><th>Days</th><th></th></tr></thead>
      <tbody>${S.services.map((s) => `<tr class="${s.hidden ? 'muted-row' : ''}"><td>${catTile(s.category)}</td><td><strong>${esc(s.title)}</strong><div class="small muted">${esc(s.description || '')}</div></td>
        <td>${nameOf(s.memberId)}</td><td class="num">${tok(s.price)}</td><td class="small">${(s.days || []).map((d) => d.slice(0, 2)).join(' ')}</td>
        <td class="num"><button class="btn sm secondary" data-act="toggle-service" data-id="${s.id}">${s.hidden ? `${I.eye} Show` : `${I.eyeOff} Hide`}</button></td></tr>`).join('')}</tbody>
    </table></div></div>
    <div class="a-card" id="requests"><h2>Requests (${S.requests.filter((r) => r.status !== 'closed').length})</h2><div class="overflow-x"><table class="a-table">
      <thead><tr><th></th><th>Request</th><th>By</th><th class="num">Budget</th><th>Status</th><th></th></tr></thead>
      <tbody>${S.requests.filter((r) => r.status !== 'closed').map((r) => `<tr class="${r.hidden ? 'muted-row' : ''}"><td>${catTile(r.category)}</td><td><strong>${esc(r.title)}</strong><div class="small muted">${esc(r.description || '')}</div></td>
        <td>${nameOf(r.memberId)}</td><td class="num">${tok(r.budget)}</td><td>${r.status === 'open' ? '<span class="badge ok">Open</span>' : `<span class="badge">Taken by ${esc(firstName(member(r.takenBy)) || 'member')}</span>`}</td>
        <td class="num"><button class="btn sm secondary" data-act="toggle-request" data-id="${r.id}">${r.hidden ? `${I.eye} Show` : `${I.eyeOff} Hide`}</button></td></tr>`).join('')}</tbody>
    </table></div></div>`;
}

function vTrades() {
  const weekAgo = Date.now() - 7 * DAY;
  const pays = S.activity.filter((a) => a.kind === 'pay');
  const week = pays.filter((a) => new Date(a.when).getTime() >= weekAgo);
  const volume = week.reduce((t, a) => t + a.amount, 0);
  return `<div class="a-head"><div><h1>Trades</h1><div class="muted">${week.length} this week · ${tok(volume)} ${T()} changed hands</div></div></div>
    <div class="a-card"><div class="overflow-x"><table class="a-table">
      <thead><tr><th>From</th><th>To</th><th>For</th><th class="num">${T()}</th><th>Date</th></tr></thead>
      <tbody>${pays.map((a) => `<tr class="${new Date(a.when).getTime() >= weekAgo ? '' : 'muted-row'}"><td>${nameOf(a.from)}</td><td>${nameOf(a.to)}</td><td>${esc(a.what || '')}</td><td class="num">${tok(a.amount)}</td><td>${fmtDate(a.when)}</td></tr>`).join('') || '<tr><td colspan="5" class="muted">No trades yet</td></tr>'}</tbody>
    </table></div><p class="hint">Faded rows are older than a week.</p></div>`;
}

const NAV = [['#/overview', 'Overview', I.grid, vOverview], ['#/invite', 'Invite', I.whatsapp, vInvite], ['#/members', 'Members', I.users, vMembers], ['#/trades', 'Trades', I.swap, vTrades], ['#/market', 'Market', I.market, vMarket]];

function shell(current, body) {
  const c = S.community;
  return `<div class="a-shell">
    <aside class="a-side">
      <div class="a-brand"><span class="logo">${esc(c.name[0] || 'A')}</span><div><strong>${esc(c.name)}</strong><small>Admin</small></div></div>
      <nav class="a-nav">${NAV.map(([href, label, icon]) => `<a href="${href}" class="${href === current ? 'on' : ''}">${icon}${label}</a>`).join('')}</nav>
      <div class="spacer"></div>
      <a class="a-link" href="../" target="_blank" rel="noopener">${I.out} Member app</a>
      <button class="a-link" data-act="reset">${I.spark} Reset demo</button>
      <button class="a-link" data-act="logout">${I.logout} Log out</button>
    </aside>
    <main class="a-main">${body}</main>
  </div>`;
}

/* ---------------------------------------------------------------- actions */
const actions = {
  login: () => { S.adminSession = { memberId: S.community.adminId }; location.hash = '#/overview'; },
  logout: () => { S.adminSession = null; location.hash = '#/login'; },
  copy: async () => {
    const input = document.getElementById('join-link');
    try { await navigator.clipboard.writeText(input.value); } catch { input.select(); document.execCommand('copy'); }
    toast('Link copied');
  },
  'remove-member': (el) => {
    const m = member(el.dataset.id);
    if (!m || !confirm(`Remove ${m.name} from ${S.community.name}?`)) return;
    S.members = S.members.filter((x) => x.id !== m.id);
    S.services = S.services.filter((s) => s.memberId !== m.id);
    S.requests = S.requests.filter((r) => r.memberId !== m.id);
    if (S.session?.memberId === m.id) S.session = null;
    if (S.account?.memberId === m.id) S.account = null;
    toast(`${m.name} removed`);
  },
  'toggle-service': (el) => { const s = S.services.find((x) => x.id === el.dataset.id); s.hidden = !s.hidden; toast(s.hidden ? 'Hidden from the market' : 'Back on the market'); },
  'toggle-request': (el) => { const r = S.requests.find((x) => x.id === el.dataset.id); r.hidden = !r.hidden; toast(r.hidden ? 'Hidden from the market' : 'Back on the market'); },
  reset: () => { resetState({ adminSession: S.adminSession }); toast('Demo reset'); },
};

/* ---------------------------------------------------------------- router */
let lastHash = null;
function render() {
  const [hash, qs = ''] = (location.hash || '#/overview').split('?');
  if (!S.adminSession) { if (hash !== '#/login') { location.replace('#/login'); return; } $root.innerHTML = vLogin(); return; }
  if (hash === '#/login') { location.replace('#/overview'); return; }
  const nav = NAV.find(([href]) => href === hash);
  if (!nav) { location.replace('#/overview'); return; }
  const scroll = window.scrollY;
  $root.innerHTML = shell(nav[0], nav[3]());
  document.title = `${nav[1]} · ${S.community.name} Admin`;
  const show = new URLSearchParams(qs).get('show');
  if (location.hash !== lastHash) window.scrollTo(0, 0); else window.scrollTo(0, scroll);
  if (show && location.hash !== lastHash) document.getElementById(show)?.scrollIntoView({ block: 'start' });
  lastHash = location.hash;
}

document.addEventListener('click', async (e) => {
  const act = e.target.closest('[data-act]');
  if (!act || !actions[act.dataset.act]) return;
  e.preventDefault();
  await actions[act.dataset.act](act);
  save();
  render();
});
window.addEventListener('storage', (e) => { if (e.key === STORE_KEY) { reloadState(); render(); } });
window.addEventListener('hashchange', render);
render();
