# Community money PoC — feature plan

## The pitch

What if your community had its own money, to boost your purchasing power when
you don't have enough shillings?

Every member mints the community currency, 1 per hour. They spend it with each
other on goods and services: a haircut, a boda ride, fish, tailoring. Every
trade paid in the community currency is shillings that stay in a member's
pocket for the things only shillings can buy, like rent and school fees.

The demo community, Apwoche Investment Group, and all of its members and
numbers are fictional. This PoC does not try to digitise a chama's book,
loans or welfare. It is about the Circles features.

## How Circles maps onto the app

- **One currency in the app: Apwoche.** Members tap Mint and receive Apwoche,
  1 per hour since their last mint (the PoC caps the mock at 14 days).
- **Under the hood** each mint creates the member's personal CRC and wraps it
  into the Apwoche Circles group token in the same step. The app never shows
  personal CRC, so members only ever deal with one currency.
- **Membership is trust.** The organiser trusts new people into the group,
  which is what lets them mint and trade.
- **Purchasing power is the headline number.** Each listing carries its usual
  shilling price, so the app can show how many shillings a member kept by
  paying in Apwoche.

## Roles and sign-in

1. **Member**
   - Join: invite code, name, phone, what you can offer, PIN.
   - Log in: phone + PIN.
2. **Community organiser**
   - Start a community: name, currency name, location. Gets an invite code.
   - Log in: phone + PIN.

## Member features

- **Home**
  - Balance and Mint button with the amount accrued since the last mint.
  - Shillings kept and currency earned over the last 30 days.
  - "Spend it nearby": a few things on offer, one tap to pay.
  - Recent activity, each payment showing the shillings kept.
- **Market**
  - Offered: what neighbours sell for Apwoche, with the usual shilling price.
  - Wanted: help neighbours need, paid in Apwoche. Take a job, get paid when done.
  - Post an offer or a request.
  - Pay sheet shows the shillings you keep as you type.
- **Profile**: details, what I offer, invite a neighbour, demo switches.

## Organiser features

- **Community**: currency in circulation, members, new currency per day,
  shillings kept across the community, trades this week, join requests,
  invite code, recent trades.
- **Members**: trust or decline people waiting to join; see what each
  member offers.
- Wallet, Market and Profile, same as members.

## Out of scope for the PoC

Real Circles SDK calls, real auth, backend, and anything that digitises the
chama itself (contributions, loans, welfare).

## Tech

- Plain HTML + CSS + ES modules, no build step.
- PWA: `manifest.webmanifest` + `sw.js` app-shell cache.
- On desktop the app renders inside a centred phone-sized frame.
- White background, black hairline borders, orange accent `#fe5511`
  (wallet `--color-orange-500`), pill buttons with a hard black shadow.
