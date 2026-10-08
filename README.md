# Savings Circles PoC

A static, mobile-first PWA exploring how [Circles](https://aboutcircles.com/)
could support a chama (savings and investment group). The group, members
and numbers in the demo are fictional.

See [PLAN.md](PLAN.md) for the full feature plan and how Circles maps onto a chama.

## Run

ES modules need to be served over HTTP, not opened from `file://`.

```sh
python3 -m http.server 8731
# open http://localhost:8731
```

On desktop the app renders in a phone-sized frame. On a phone, use
"Add to Home Screen" to install it as a PWA.

## Demo paths

- **Member**: Welcome, "I'm a member", Log in. You are Achieng Otieno (tailor).
  Mint Apwoche, pay the welfare reminder, request welfare, apply for a loan,
  pay Brian the barber in Apwoche, take a job, post a service.
- **Admin**: Welcome, "I run a chama", Log in. You are Grace Akinyi (chair).
  See the pool, send a welfare reminder, record a cash payment, approve
  loans and welfare claims.
- Profile has "Switch to admin/member view" and "Reset demo data".

State is saved in `localStorage`. Mocked data lives in `js/data.js`.

## Files

| Path | What |
| --- | --- |
| `index.html` | App shell |
| `css/styles.css` | Design tokens and components (accent `#fe5511` from wallet) |
| `js/data.js` | Mocked constants |
| `js/app.js` | Hash router, views, actions |
| `js/icons.js` | Inline SVG icons |
| `manifest.webmanifest`, `sw.js`, `icons/` | PWA |
