# Elite Way Closer OS (standalone)

Open closer desk. No password. WhatsApp-first. Data stays in the visitor’s browser (`localStorage` key `ew-sales-v3`).

This is **not** the public Holdings site. Point a **subdomain** at this app only.

Suggested host: `sales.eliteway.co.za` or `desk.eliteway.co.za`.

## Build (on this machine)

```bash
cd closer-os
npm install
npm run build
```

Upload **everything inside `dist/`** to the subdomain document root:

- `index.html`
- `assets/`
- `logo-mark.png` (and other public files)

Do **not** upload `src/` or `node_modules`.

## DNS / hosting

1. In your domain DNS, add an **A** or **CNAME** for the subdomain to the same host as the main site (or a separate static host: Netlify, Cloudflare Pages, cPanel subdomain).
2. Set the subdomain’s document root to this `dist` folder (or drag-drop `dist` on Netlify/Cloudflare Pages).
3. SPA: if someone opens `/sales` on this subdomain it is unnecessary — the desk **is** `/`. If the host 404s on refresh of unknown paths, add a rewrite: all routes → `index.html`.

## Notes

- `noindex` is set. Closers should use the URL; Google should not treat this as the company homepage.
- Quotes/invoices download as PDF in the browser. Banking details live in the same browser profile.
- House products: EWHTS and white-label booking. Add more on **Products**.
- Link back to https://www.eliteway.co.za/ is at the bottom.

## If the desk sits in a folder (not subdomain root)

Edit `vite.config.js` and set `base: '/folder/'` then rebuild.
