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

`npm test` runs the behavioural model, navigation and copy tests plus fixed-identity tamper/missing-file checks. `npm run build` validates evidence, performs a true multipage build and verifies emitted evidence, fonts, licences and routes. `npm run verify:build` reruns that emitted-artifact verification without rebuilding. `npm run preview` serves the build on loopback. This is a frontend build, not a command to reproduce native physiology.

Change presentation in `web/src/`. Keep progressive traces, original values, time semantics, same-tab state and refusal/retry behaviour covered by tests. Do not repin modified evidence merely to make a failing integrity check pass: a new recording requires a separately reviewed native experiment, source mapping and provenance record.

## Portable browser verification

After the locked install, install the matching Chromium headless shell with `npx --no-install playwright install chromium --only-shell`. On a clean Linux CI runner, Playwright's `--with-deps` option supplies system browser dependencies; do not install system packages on a shared workstation without its owner's permission.

Run `npm run check` from `web/`: unit/contracts → production build and emitted verification → Chromium interactions. Alternatively, after a build use `npm run test:browser`. Tests run serially, use a short-lived loopback static server on an ephemeral port, and close their browser/server at teardown. Missing build/browser tooling is a failure, not a skip. The suite must be executed before treating a new environment or candidate as verified.

The interaction suite exercises the **built application** for playback, original-row chart geometry, rewind, failure/refusal/retry, actual keyboard activation/focus, same-tab Model details/history, chooser routes, and narrow-screen layouts in both themes. It compares every served build file with disk bytes. Cancellation/unmount uses a separate, explicitly test-only React mount fixture and controlled delayed transport; it is not claimed as unmodified end-to-end network timing. The fixture build goes under ignored `web/.runtime/` and is never an application entrypoint or public asset. `test:browser` compiles it in a separate process that exits before Chromium starts, avoiding resident native build threads during browser checks. Contexts close between tests, and page creation has its own deadline and cleanup. Screenshots go to `web/test-results/browser/` (override with `BROWSER_ARTIFACT_DIR`); `BROWSER_DIAGNOSTICS=1` also saves navigation/request timelines. Unit scientific/geometry contracts remain distinct from browser interaction evidence.

`.github/workflows/verify.yml` runs this gate on Ubuntu 24.04 / Node 22 using the existing lockfile and pinned Playwright. It does not publish or deploy. Host-specific memory/PID instrumentation is intentionally outside the portable suite. On a workstation governed by a resource launcher, **all install/test/build/browser commands must still run through that unchanged launcher and its existing limits**; the portable runner is not permission to bypass containment. CI's job timeout and Node heap limit are not a claim of equivalent workstation cgroup containment.

Automated Chromium checks do not establish cross-browser, physical-device, screen-reader or learner validation. See the [deployment guide](deployment.md) for Cloudflare Pages settings and required hosted checks. HTML and the Pages response-header file deliberately retain noindex,nofollow; this is crawler guidance, not access control.

## Layout

- `web/`: frontend source, tests, build scripts, entrypoints and vendored estate package.
- `evidence/`: included recordings, public derivative metadata and numerical checks.
- `engine/field-map.json`: pressure mapping only, not engine source.
- `licenses/`: verbatim upstream notices copied into the serving output.
- `docs/`: architecture, provenance and original/distributed hash identities.
