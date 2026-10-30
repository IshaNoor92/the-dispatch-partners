# The Dispatch Partners — website

Static marketing site for The Dispatch Partners Ltd (UK e-commerce fulfilment, Rainham). Plain HTML, CSS and JavaScript — no build step.

## Pages

| File | Purpose |
| --- | --- |
| `index.html` | Home: services, storage comparison, how it works, pricing preview, FAQ |
| `pricing.html` | Full price list and monthly cost calculator |
| `contact.html` | Three-step quote form (Netlify Forms) and map |
| `thank-you.html` | Fallback page if the form posts without JavaScript |
| `privacy.html` | Privacy policy |
| `404.html` | Not-found page (Netlify serves it automatically) |

Shared styles are in `assets/css/styles.css`; all behaviour is in `assets/js/main.js`. The header and footer are repeated in each page, so a change there needs making in every HTML file.

## Run locally

```bash
npx serve .
```

On localhost the quote form validates and shows the success message but does not send anything — Netlify Forms only works once deployed.

## Deploy to Netlify

1. Push this repo to GitHub.
2. In Netlify: **Add new site → Import an existing project**, pick the repo. No build command; publish directory `.` (already set in `netlify.toml`).
3. After the first deploy, open **Forms** in the Netlify dashboard: the `quote` form appears there. Under **Forms → Form notifications** add an email notification to `contact@thedispatchpartners.com` so enquiries arrive in the inbox.
4. Add the custom domain `thedispatchpartners.com` under **Domain management**.
