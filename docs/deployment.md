# Static deployment

Glassbox needs static hosting, not a backend, database or running Pulse engine. The source package does not provision a host or configure a domain. The setup below targets **Cloudflare Pages at the domain root**, not a repository-name subdirectory.

## Build settings

After the reviewed source changes are committed and pushed, connect `Snowslash/glassbox` in Cloudflare **Workers & Pages → Pages → Import an existing Git repository**. This is Pages, not a Workers deployment.

| Setting | Value |
|---|---|
| Production branch | `main` |
| Framework preset | None / custom |
| Root directory | Repository root; leave blank |
| Output directory | `web/dist` |

Build command:

```sh
cd web && npm ci --ignore-scripts && npm test && npm run build
```

Environment:

```text
NODE_VERSION=22.23.3
SKIP_DEPENDENCY_INSTALL=true
NODE_OPTIONS=--max-old-space-size=1536
```

The Node version matches the locally checked build. The explicit install uses the committed lockfile and vendored estate package. Publish **only `web/dist`**, not the repository root or `web/public`. No build-time secrets are needed.

## Routing, fallback and security

Pages redirects `.html` URLs to extensionless forms. All three Model details views recognise both forms; authored links keep their existing `.html` destinations and safe snapshot query parameters. Same-tab history navigation does not require a server redirect.

The build includes a real `404.html`, preventing Pages' implicit single-page-app fallback. It is script-free, uses the pinned estate stylesheet and has ordinary links home and to the chooser. Its links, stylesheet and favicon resolve from the domain root so it also works at deeply nested missing URLs. Its static dark appearance does not load the app's theme controller. Deploying below a URL subdirectory would need a separately checked URL change.

`web/public/_headers` becomes `web/dist/_headers`. Its global Pages rule preserves the existing self-origin CSP and adds frame-embedding denial, MIME-sniffing protection, no-referrer policy and disabled camera, microphone and geolocation permissions. It does not enable analytics, external scripts or additional origins. Other static hosts may ignore this file and require equivalent native configuration.

**Indexing remains disabled:** every HTML entrypoint has `noindex,nofollow`, and the response rule adds `X-Robots-Tag: noindex, nofollow`. This is crawler guidance, **not access control**: a Pages deployment is publicly accessible by default. Changing indexing later requires deliberately updating both layers and their tests.

## Verification and release

`npm test` covers clean-route recognition and the source deployment contract, including rejected missing/weakened headers, missing fallback files and accidental indexing. `npm run build` checks the actual emitted deployment files in addition to evidence, fonts and licences. These are local artifact checks, not proof that a provider has applied the configuration.

Before announcing the generated Pages address or attaching a custom domain:

- Verify all nine application entrypoints, including direct Model details URLs with and without `.html`.
- Refresh a Model details page; check that the selected sample, return navigation and browser back/forward still work.
- Exercise prediction, playback, seeking and comparisons in all three lessons.
- Inspect actual HTTPS response headers for the HTML, a recording and an unknown path. Confirm the CSP and indexing policy survived hosting.
- Confirm a deeply nested unknown URL returns **HTTP 404**, with working styles, favicon, keyboard focus and recovery links. A missing recording must not become a successful landing-page response.
- Check mobile layouts, both themes, skip links and browser console/network errors. Review any provider-injected scripts rather than weakening the CSP to accommodate them.
- Check evidence integrity, applicable licence links and the exact deployed commit. Repeat key checks after attaching the intended custom domain.

The preparation environment exercised a local fixture of the documented Pages clean-URL, header and 404 behaviour. Actual Cloudflare edge behaviour, account-level transformations and custom-domain HTTPS still require post-deployment verification. Browser checks do not establish cross-browser, screen-reader or learner validation.

References: [Pages build configuration](https://developers.cloudflare.com/pages/configuration/build-configuration/), [build environment](https://developers.cloudflare.com/pages/configuration/build-image/), [serving pages and 404 behaviour](https://developers.cloudflare.com/pages/configuration/serving-pages/), [headers](https://developers.cloudflare.com/pages/configuration/headers/), [custom domains](https://developers.cloudflare.com/pages/configuration/custom-domains/).
