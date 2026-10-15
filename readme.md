# Glassbox

Glassbox is a browser-based lab for exploring how blood pressure, oxygen transport and breathing work. Each lesson starts with a prediction, followed by a recorded experiment you can pause and inspect.

## The lessons

- **Pressure is not volume**: follow blood loss and see why blood pressure alone does not tell you how much blood remains in circulation.
- **Saturation is not delivery**: explore why oxygen saturation can stay high even when less oxygen reaches the tissues.
- **Where does the breath go?**: see how breathing changes when airflow meets more resistance or the lungs are harder to expand.

## Try the lab

Follow the [setup guide](docs/development.md#run-locally) to run the lab on your computer.

Once it is open, select **Open lab** and choose any lesson. Make your prediction, then play the recording. Pause or move the timeline to compare measurements at the same point in the experiment.

Each lesson has a **Model details** page explaining its assumptions and limitations. Use **Project overview** above the heading to return to the introduction, then **Open lab** to choose another experiment.

The experiments use fictional scenarios recorded with the Pulse physiology simulator. The browser replays those results rather than running new simulations.

## Landing-page maintenance

The project introduction lives in `web/src/project.js`; `ProjectPage.tsx` and `project-page.css` are generated copies of the shared estate project-page template. Keep the initial HTML facts and links available without JavaScript. The landing opens `lab.html`, leaving lesson selection and recorded-model behaviour unchanged.

From `web`, local release verification passed: locked `npm ci`, full `npm audit --json` (no reported vulnerabilities), `npm test` and `npm run build`. The build runs the native prepare step and verifies recording hashes, licences, fonts, strict CSP and deployment artifacts; do not substitute a bare Vite build. These checks do not claim live-host or clinical validation.

## Find out more

[How the lab works](docs/architecture.md) · [Where the recordings come from](docs/provenance.md) · [Deployment guide](docs/deployment.md)

## Licence

Original Glassbox code and teaching material are [MIT licensed](LICENSE). Third-party material keeps its own licences; see the [third-party notices](THIRD_PARTY_NOTICES.md).
