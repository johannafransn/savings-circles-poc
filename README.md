# Apwoche community money PoC

What if your community had its own money, to boost your purchasing power when
you don't have enough shillings? A static PWA exploring that idea on
[Circles](https://aboutcircles.com/). The community, members and numbers in
the demo are fictional.

| | Link |
| --- | --- |
| Member join link (start here) | https://johannafransn.github.io/savings-circles-poc/#/join?ref=APWOCHE-2041 |
| Member app | https://johannafransn.github.io/savings-circles-poc/ |
| Admin site | https://johannafransn.github.io/savings-circles-poc/admin/ |

See [PLAN.md](PLAN.md) for the feature plan.

## Run locally

ES modules need to be served over HTTP, not opened from `file://`.

```sh
python3 -m http.server 8731
# member join link: http://localhost:8731/#/join?ref=APWOCHE-2041
# admin site:       http://localhost:8731/admin/
```

## Demo paths

- **New member:** open the join link, save a passkey (or use phone + PIN),
  add your name and a service or two. You land on Home.
- **Existing member:** open the member app, tap "I already joined", then log
  in. Without an account on this device it logs in as Achieng, a tailor.
- **Admin:** open the admin site and log in as Grace. Copy or share the join
  link, see who joined, remove members, hide listings.
- Both apps share state in this browser. "Reset demo" restores the mock data.

## Files

| Path | What |
| --- | --- |
| `index.html`, `js/app.js` | Member app |
| `admin/` | Admin site |
| `js/store.js` | Shared state and helpers |
| `js/data.js` | Fictional mock data |
| `js/icons.js` | Icons and service categories |
| `css/styles.css` | Design tokens and components (accent `#fe5511` from wallet) |
| `manifest.webmanifest`, `sw.js`, `icons/` | PWA |
