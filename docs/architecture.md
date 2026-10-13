# Architecture

Vite builds a static multipage site: a project introduction at `index.html`, a lesson chooser at `lab.html`, an About/licences page and six lesson/details HTML entrypoints under `app/`. Relative asset and recording URLs keep it usable at a project subpath. React is used for the shared estate header/theme and interactive lessons; there is no server-side simulation or application API.

Each lesson owns a pure state-transition model and a React view. Prediction initially reveals only the baseline. Playback advances the original sample index; seeking, replay and returning to prediction hide later trace points. Axes remain fixed across playback and branches. Comparison uses the same index in the matched recording rather than normalizing branches independently.

Pressure combines `model.mjs`, `presentation.mjs`, `Traces.jsx` and optional `ModelDetails.jsx`/`Inspector.jsx`. Oxygen uses `oxygen-model.mjs` and `OxygenApp.jsx`; content and delivery are native fields, with explicit dimensional conversion. Respiratory uses `respiratory-model.mjs` and `RespiratoryApp.jsx`; the columnar payload decodes into the original named quantities, with supplied observed driver-cycle boundaries.

Lesson-to-details links take a snapshot of the selected sample. Same-tab history retains the in-memory lesson state and returns paused. Query strings contain only safe selection parameters, not prediction or reflection text. A reload starts a fresh lesson. Only the estate theme preference persists.

Before a build, `publication-integrity.mjs` hashes every included evidence input against fixed source pins. Existing schema and gate validators then check rows, mappings, scientific constraints and review cross-references. Oxygen and respiratory also enforce their fixed approvals in the browser. Invalid or missing recordings produce a refusal and explicit retry, never substitute data. Pressure retains its original runtime schema validation, with exact identity enforced at build time.

The build copies evidence and verbatim licence files to the static output. The verifier compares source-to-output bytes and checks all HTML entrypoints and fonts. CSP permits self-hosted scripts, styles, fonts and data only; there is no analytics, account system or content autosave.
