# CATCH THE FLY — نظام ترصد عدوى العظام

وحدة ترصد محلية (تعمل دون إنترنت / Offline First) لتسجيل حالات عدوى ما بعد العمليات الجراحية للعظام، وتحليل الاتجاهات، واكتشاف التجمعات المشتبه بها (Potential Clusters)، وتصدير البيانات للبحث.

A fully offline, Progressive Web App for recording and analyzing orthopedic surgical-site infection (SSI) cases. Data never leaves the device.

> **تنبيه الخصوصية | Privacy warning**: تجنّب إدخال أي معلومات شخصية غير ضرورية. Avoid entering unnecessary personally identifiable information. This app stores clinical data locally on the device; users are responsible for protecting the device and following hospital data-protection policies.

---

## Features

- **Fast entry form (2–4 min)**: case info, original operation, prophylaxis, OR & surgical team (multi-select staff), risk factors, infection details, microbiology (multiple organisms with culture dates & antibiogram flags), treatment, and outcome. Drafts are saved with one tap.
- **Infected-cases-only registry**: only infections are recorded. Denominators are entered manually in **Exposure Data** — the app **never computes a rate without a recorded denominator**. It always distinguishes a recorded case count from a calculated rate.
- **Analytics**: totals, monthly/yearly trends, deep vs superficial, implant-related, culture-positive/negative, top organisms/procedures/rooms/surgeons, risk-factor and procedure/organism/room combos, implant & emergency proportions — each with count + percentage of recorded cases.
- **Potential cluster detection**: temporal, room, organism, procedure, staff and combined clusters with severity ranking. Neutral language only — *"potential pattern requiring review"* — **never** "X caused the infection".
- **Exposure data & research compare**: per-period denominators (surgeon, room, procedure, team, implant). Build an A/B table or use **Research Compare (2×2)**: RR, OR, 95% CI, Fisher exact / Yates-corrected chi-square with automatic small-sample cautions.
- **Cultures / Organisms**: organism master list with MDR flags (MRSA/ESBL/VRE/MDR), case counts, reactivate/deactivate.
- **Reports**: monthly report and cluster investigation report that print to PDF (Excel/Word-friendly tables).
- **Backup / Export**: research CSV (one row per organism per case, UTF-8), full JSON backup, JSON import/restore, wipe-all.
- **Arabic-first RTL** with one-tap English toggle; fully responsive; installable PWA with offline caching.
- **Synthetic demo data** bundled so you can explore; load it only when you want, and delete it before real use.

---

## Getting started

You can run it by simply opening `index.html` over any static server (no build step, no dependencies, no Node runtime needed).

### Local development

```bash
# any static file server works, e.g. Node's:
npx serve .
```

Then open `http://localhost:3000`.

> Opening via `file://` is discouraged: IndexedDB and the service worker require a real origin (http/https). Use the local server.

### First run

1. The app asks whether to load **synthetic demo data** (recommended for exploring features).
2. Data is stored in IndexedDB **on this device only**.
3. Toggle language from the header (**EN** / **العربية**) at any time — persisted in Settings.
4. In **Settings** you manage the hospital name, cluster thresholds (min cases & time window), staff, ORs, procedures, organisms, antibiotics and infection types.

---

## Deploying to GitHub Pages

1. Push this folder to a GitHub repository.
2. Repo **Settings → Pages → Build and deployment → Source: Deploy from a branch** → select `main` (or your default branch) and folder `/ (root)` → Save.
3. The site will be published at `https://<user>.github.io/<repo>/`.
4. All asset paths are relative (`./js/...`, `./sw.js`, `./icons/...`), so it works from any subpath without configuration.
5. Remember: the app is fully static — GitHub Pages only hosts the files; there is **no server code** and no data collection.

---

## Offline / PWA

`sw.js` precaches the app shell (HTML, CSS, JS, manifest, icons) and serves it cache-first, with runtime caching for same-origin GET requests and `./` as the offline fallback. Once visited online, the app works fully offline.

- Manifest: `manifest.webmanifest` (standalone display, `#0d5c73` theme, icons `192`/`512`).
- Icons regenerable via `tools/gen-icons.js` (`node tools/gen-icons.js`).

---

## Backup & privacy

- **Backup / Export** screen: download `backup.json` (all stores) or `research.csv`; import the JSON to restore or transfer data to another device; **Delete all data** wipes everything permanently.
- Because data lives only in the browser profile, take backups regularly and store them safely (e.g., encrypted hospital storage).
- The demo data (13 complete cases + 2 drafts, 4 exposure records, 2026 date range) is clearly flagged in the UI. Remove it via *Settings → Load synthetic demo data → no* after loading real workflow, or *Backup → Delete all data* before first real use.

---

## Documentation

- [Data schema](docs/schema.md) — IndexedDB object stores, case & exposure structures.
- [Data dictionary](docs/data-dictionary.md) — every field, allowed values, and bilingual labels.

---

## Project layout

```
index.html          App shell (RTL Arabic default)
manifest.webmanifest PWA manifest
sw.js               Service worker (offline caching)
css/style.css       All styling (responsive, RTL/LTR, print)
js/i18n.js          EN/AR dictionaries + App.t()
js/core.js          Utilities, multi-select & searchable-select widgets, constants
js/db.js            IndexedDB layer (settings, lists, cases, exposures)
js/analytics.js     Stats, filters, trends, combos, clusters, staff summary, statistics
js/export.js        Research CSV, JSON backup/import, monthly & cluster reports
js/seed.js          Synthetic demo dataset + loader
js/views.js         All screens (dashboard, form, cases, detail, analytics, clusters,
                    exposures, organisms, reports, backup, settings, compare)
js/main.js          Router, actions, startup, service-worker registration
tools/gen-icons.js  Icon generator (Node, no deps)
docs/               schema + data dictionary
```

---

## License / use

For quality-improvement and research use within your institution. Verify all statistical output meets local clinical governance requirements. This tool does not provide medical advice.