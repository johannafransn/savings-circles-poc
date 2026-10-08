# Savings Circles PoC

What if your community had its own money, to boost your purchasing power when
you don't have enough shillings? A static, mobile-first PWA exploring that
idea on [Circles](https://aboutcircles.com/). The community, members and
numbers in the demo are fictional.

Live demo: https://johannafransn.github.io/savings-circles-poc/

See [PLAN.md](PLAN.md) for the feature plan and how Circles maps onto the app.

## Run locally

ES modules need to be served over HTTP, not opened from `file://`.

```sh
python3 -m http.server 8731
# open http://localhost:8731
```

On desktop the app renders in a phone-sized frame. On a phone, use
"Add to Home Screen" to install it as a PWA.

## Demo paths

- **Member**: Welcome, "Join my community", Log in. You are Achieng, a tailor.
  Mint Apwoche, see the shillings you kept, pay Brian for a haircut, take a
  job, offer a service.
- **Organiser**: Welcome, "Start a community", Log in. You are Grace.
  See the community's circulation and shillings kept, trust new members in.
- Profile has "Switch to organiser/member view" and "Reset demo data".

State is saved in `localStorage`. Mocked data lives in `js/data.js`.

## Files

| Path | What |
| --- | --- |
| `index.html` | App shell |
| `css/styles.css` | Design tokens and components (accent `#fe5511` from wallet) |
| `js/data.js` | Fictional mock data |
| `js/app.js` | Hash router, views, actions |
| `js/icons.js` | Inline SVG icons |
| `manifest.webmanifest`, `sw.js`, `icons/` | PWA |
