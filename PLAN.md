# Apwoche community money PoC — plan

## The pitch

What if your community had its own money, to boost your purchasing power when
you don't have enough shillings?

Members mint Apwoche, 1 per hour, and spend it with each other on goods and
services: a haircut, a boda ride, fish, tailoring. **1 Apwoche = 1 KES.**

The community, its members and numbers are fictional. The app does not
digitise the chama's book, loans or welfare. It is about the Circles features.

## Two separate apps

| | Member app (`/`) | Admin site (`/admin/`) |
| --- | --- | --- |
| Who | Chama members | Chama admins |
| Shape | Phone-first PWA, icons first, minimal text | Desktop-first website with a sidebar |
| Entry | Only through the admin's join link | Passkey login |

## Member app

**Entry: referral links only.** The admin shares
`…/#/join?ref=APWOCHE-2041` on WhatsApp. There is no open sign-up.
- A valid link shows "Grace invited you" and one Join button. The invite code is never shown.
- No link or a bad link shows "Ask your chama admin" with a WhatsApp icon.
- Returning members log in with their passkey, or phone number + PIN.

**Onboarding, styled after M-PESA.** One question per screen, a step bar, a big
keypad and a sticky bottom button.
1. **Secure:** passkey first ("Use fingerprint or face"). Fallback is phone
   number, SMS code, then a 4-digit PIN, like M-PESA.
2. **About you:** photo (optional), name, phone.
3. **Services:** category icon, name, short description, price per session,
   days worked, hours per day. Add as many as you like, or skip.

**Home:** balance, Mint button, transactions. Nothing else.

**Market:** Services and Requests tabs, category icon filter, 2-column photo
cards. A card shows the photo (or the category icon), name, short description,
price per session and the provider. Chat opens WhatsApp; Pay sends Apwoche.
If nobody offers something, "Ask for it" posts it under Requests.

**Offer a service:** photo, category, name, short description, price per
session ("1 Apwoche = 1 KES"), days, hours per day. Members can post several.

**Me:** photo, name, phone, my services (edit, delete), my requests, log out.
No invite code: invites come only from admins.

## Admin site

- **Overview:** Apwoche in circulation, members, trades this week, open requests, recent trades.
- **Invite:** the join link with Copy and Share on WhatsApp, plus who joined with it.
- **Members:** everyone, with remove.
- **Market:** hide or show any service or request.

Both apps share one saved state in the browser, so a member who joins in one
tab appears in the admin site in another.

## How Circles maps onto it

- Each mint creates the member's personal CRC and wraps it into the Apwoche
  group token in one step. The app only ever shows Apwoche.
- Joining through the admin's link is the admin trusting the member into the group.
- Minting stays at the Circles rate of 1 per hour.

## Open points for Deep

- Deep's note on services stops at "how many days of…". The app asks for
  days worked and hours per day.
- At 1 Apwoche = 1 KES and 1 per hour, members mint 24 a day, so a 150
  Apwoche haircut is about 6 days of minting.
- The admin is also a normal member in the member app.

## Out of scope

Real Circles SDK calls, real SMS and auth, backend, in-app chat, translations
(the copy is English for now, kept short and icon-led so it can be translated).

## Tech

- Plain HTML + CSS + ES modules, no build step. Shared state in `js/store.js`.
- PWA: `manifest.webmanifest` + `sw.js` app-shell cache.
- Passkeys use real WebAuthn where the browser supports it, mocked otherwise.
- White background, black hairline borders, orange accent `#fe5511`
  (wallet `--color-orange-500`), pill buttons with a hard black shadow.
