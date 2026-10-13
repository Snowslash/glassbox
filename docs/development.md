# Development

## Run locally

You need Node.js 22.12 or newer and npm. Download or clone the project, then open a terminal in the project folder (the one containing `readme.md` and `web/`). Run:

```sh
cd web
npm ci --ignore-scripts
npm test
npm run build
npm run preview
```

Open the local address printed in the terminal. Select **Open lab** to choose a lesson. Keep the terminal running while you use the lab; press Ctrl+C when you are finished. Open the printed address rather than double-clicking an HTML file.

`npm ci --ignore-scripts` uses the lockfile and the included estate archive. You do not need to install Pulse: this package plays the included recordings and does not run new physiology experiments.

## Working on the app

Build output and dependencies are excluded from the source distribution. The build also creates copies in `web/public/evidence/`, `web/public/licenses/` and `web/public/THIRD_PARTY_NOTICES.md`. Those copies are ignored by Git; the originals in `evidence/`, `licenses/` and `THIRD_PARTY_NOTICES.md` remain part of the source package.

`npm test` runs the original behavioural model, navigation and copy tests plus fixed-identity tamper/missing-file checks. `npm run build` validates evidence, performs a true multipage build and verifies emitted evidence, fonts, licences and routes. `npm run preview` serves the build on loopback. This is a frontend build, not a command to reproduce native physiology.

Change presentation in `web/src/`. Keep progressive traces, original values, time semantics, same-tab state and refusal/retry behaviour covered by tests. Do not repin modified evidence merely to make a failing integrity check pass: a new recording requires a separately reviewed native experiment, source mapping and provenance record.

The original browser regression suites were exercised in the preparation environment, outside this portable package because their Linux resource instrumentation is host-specific. Automated Chromium checks do not establish cross-browser, screen-reader or learner validation. No website hosting or custom domain is configured by the source package. See the [deployment guide](deployment.md) for Cloudflare Pages settings and required hosted checks. HTML and the Pages response-header file deliberately retain noindex,nofollow; this is crawler guidance, not access control.

## Layout

- `web/`: frontend source, tests, build scripts, entrypoints and vendored estate package.
- `evidence/`: included recordings, public derivative metadata and numerical checks.
- `engine/field-map.json`: pressure mapping only, not engine source.
- `licenses/`: verbatim upstream notices copied into the serving output.
- `docs/`: architecture, provenance and original/distributed hash identities.
