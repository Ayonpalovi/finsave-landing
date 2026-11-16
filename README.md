# FinSave landing page

Static, no build step. Open `index.html` or serve the folder (`python3 -m http.server 5270`).
The only call to action is "Try the demo", which links to https://finsavee.lovable.app/. The demo app itself is unchanged.

## Before going live, edit these (search for `EDIT:`)
- `index.html` head: replace `https://YOUR-DOMAIN` in the og:url / og:image / twitter:image tags.
- Notify form: set `data-endpoint` on `#notify-form` (Formspree, Supabase function, etc.). Until it's set, the form shows a thank-you message but **stores nothing**.
- Partner link: `mailto:hello@finsave.example` becomes your real address.
- Testimonial: swap the `[Replace with a real quote…]` placeholder for a real tester quote.
- Footer privacy note placeholder.

## Dutch version later
English lives in the HTML. Every string has a `data-i18n` key. See the header of `assets/i18n.js`:
run `FinSaveI18n.dumpKeys()` in the console, translate into `locales/nl.js`, include it, and visit `?lang=nl`.

## Files
- `index.html`: all sections
- `assets/styles.css`: design tokens (`:root`) and layout
- `assets/main.js`: icons, scroll reveal, sticky mobile CTA, notify form
- `assets/i18n.js`: locale loader
- `assets/img/logo-*.png`: piggy-bank logo (square, padded from `logo-source.jpg`)
- `favicon.ico`, `favicon-48.png`, `apple-touch-icon.png`, `og-image.png` (1200×630)
