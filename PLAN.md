# Savings Circles PoC — feature plan

A static, mobile-first PWA that explores how Circles can support a chama
(savings and investment group). The demo group, Apwoche Investment Group,
and all of its members and numbers are fictional.

Everything is mocked. Data lives in `js/data.js` and is imported statically.
Actions mutate an in-memory copy that is saved to `localStorage` so the demo
feels real; "Reset demo" in Profile restores the constants.

## Chama practices the app models

- A mandatory welfare amount paid by everyone at each meeting, used only for
  major sickness or a death in the family.
- Separate accounts for welfare, savings and development (loans), pooled and
  kept in a bank account.
- A shared book of who paid what, every meeting.
- Loans backed by your own contributions: after a minimum number of months
  you can borrow a share of what you have put in.
- A group currency worth about one hour of time, spent between members for
  services instead of shillings.

## How Circles maps onto a chama

- **One currency in the app: Apwoche.** Members tap Mint and receive Apwoche,
  1 per hour since their last mint (the PoC caps the mock at 14 days).
- **Under the hood** each mint creates the member's personal CRC and wraps it
  into the Apwoche Circles group token in the same step. The app never shows
  personal CRC, so members only ever deal with one currency.
- **Shillings stay in the bank**: welfare, savings and development money stay
  in KES. Apwoche is a parallel, time-based economy for services.

## Roles and sign-in

Two entry paths from the welcome screen.

1. **Member**
   - Sign up: enter invite code from admin, name, phone, trade; set a PIN.
   - Log in: phone + PIN.
2. **Chama admin** (chair or treasurer)
   - Sign up: create a chama (name, token symbol, cadence, welfare / savings /
     development amounts, bank account, loan rules). Gets an invite code.
   - Log in: phone + PIN.

## Member features

- **Home**
  - Apwoche balance.
  - Mint button with the Apwoche accrued since the last mint.
  - Welfare reminder: amount and due date of the next meeting, pay now.
  - Lifetime contributed, months active, loan limit.
  - Recent activity.
- **Save (contributions)**
  - Lifetime total, split by welfare / savings / development.
  - Month-by-month ledger with paid / missed status.
  - Make this cycle's contribution.
  - Request welfare support (sickness or death).
- **Loans**
  - Eligibility check (months contributed, outstanding loans).
  - Limit = 80% of lifetime contributions.
  - Apply: amount, term, purpose; shows monthly repayment.
  - Active loan with repayment progress, past applications and status.
- **Market (Apwoche board)**
  - Services tab: what members offer for Apwoche (barber, tailoring, …).
  - Jobs tab: work members want done, paid in Apwoche.
  - Post a service or a job; pay or accept from a listing.
- **Profile**: details, trade, invite code, switch demo role, reset demo.

## Admin features

- **Group dashboard**: pool per account and in the bank, collection rate
  this cycle, pending requests, send welfare reminder to everyone unpaid.
- **Members**: who paid this cycle, lifetime contributions, loan status.
- **Requests**: approve or reject loan applications and welfare claims.
- **Market**: same board as members.
- **Profile / settings**: contribution amounts, cadence, loan rules, invite code.

## Out of scope for the PoC

Real Circles SDK calls, real auth, M-Pesa / bank integration, backend.

## Tech

- Plain HTML + CSS + ES modules, no build step.
- PWA: `manifest.webmanifest` + `sw.js` app-shell cache.
- On desktop the app renders inside a centred phone-sized frame.
- White background, black hairline borders, orange accent `#fe5511`
  (wallet `--color-orange-500`), pill buttons with a hard black shadow.
