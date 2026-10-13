<!-- Public explanatory derivative. Original SHA-256: 21e4f0c409021bc5b3f1eeff80fe7b0afdea0c5b704207852de9674d85d57909. Native raw evidence is historical and not included. -->

# Respiratory native feasibility — annotated state

**Recorded native gate: PASS. Public derivative; see review.json and manifest.json for included versus historical identities.**

## Executed result

Seven fresh native processes completed using the original whole-body baseline and installed Pulse library/assets: control, higher resistance, lower lung compliance, each perturbation repeated, and each perturbation restored from its active 60-second checkpoint. The solver interval was 0.02 seconds. Each full run has 6,001 original rows, each restore 3,001, with 45 fields. Native final time is `119.99999999999326` seconds, not rebased 120. Pre-action rows 0–1500 are identical. Actions were submitted after row 1500; row 1501 is the first affected solve. No action-induced time jump occurred.

`checks.json` contains 90 passing named checks. The historical native test run passed 14 Python tests. Both fresh repeats and both checkpoint continuations are **numerically exact across every exported numeric field**; event strings and step indices are exact too. This exceeds, but does not replace, the predeclared rtol=1e-6/atol=1e-8 contract. No native warning/error/fatal or irreversible-state message occurred.

### Last complete breath: original steps 5749–5999

The actual recorded interval is 114.97999999999426–119.97999999999327 s; each interval includes 251 original rows including the closing boundary.

| Branch | Total lung-volume span (L) | Peak inspiratory flow (L/s) | Peak expiratory flow (L/s; signed) |
|---|---:|---:|---:|
| Control | 0.436005087289983 | 0.5633062078130833 | -0.6571465322981062 |
| Higher resistance | 0.3821888179700861 | 0.43141928548121306 | -0.5316358063959072 |
| Lower lung compliance | 0.2547694585591276 | 0.35315662318902874 | -0.38170685650543923 |

Both changes produced smaller tidal excursions under the same actual driver waveform, but **not equally small excursions**. No parameter search or volume matching was performed. The low-C branch also changed resting volume: this breath's total-volume range was 1.990205298090347–2.2449747566494747 L, versus 2.242891693042143–2.678896780332126 L in control. A schematic must not imply unchanged resting volume.

## Implemented mechanism witnesses

These are direct native circuit parameters, not resistance or compliance inferred from plotted system outputs.

- At first affected row 1501, highR/control Current resistance ratios are exactly 3 for LarynxToTrachea and both TracheaTo*ConductingAirways paths. The alveolar-duct resistance ratios and lung-compliance ratios are 1.
- At the same row, lowC/control Current left/right lung-compliance ratios are exactly 0.5; all five exported airway resistance ratios are 1.
- During the last breath, upper resistance is 1.125 cmH2O s/L in control and lowC, versus 3.375 in highR. Left lung compliance is 0.1 L/cmH2O in control/highR and 0.05 in lowC.
- Left chest-wall compliance remains native and volume-dependent: ranges 0.10323517350653647–0.13074320200261808 in control, 0.10323657214194377–0.12752099955352247 in highR, and 0.0861003208485964–0.1033525863581757 L/cmH2O in lowC. A change here is not a second authored intervention.
- All exported Current lung/chest-wall C and primary airway R parameters were cross-checked against full native checkpoint circuit values and units.
- The worst normalized pure-path residual in the seven recordings is 1.3109854381433239e-16, below the unchanged 0.001 limit. Formula: `abs((Psource-Ptarget)-Q*R)/max(abs(Psource-Ptarget),1 cmH2O)`. Actual source-free, compliance-free and inertance-free topology is recorded. This equation check establishes implementation consistency, not independent physiological validation.

## Source and topology

The public pinned C++ `pulse::Engine::GetController().GetCircuits().GetActiveRespiratoryCircuit()` exposes the direct circuit. No protected-member hack, engine modification or calculated-compliance fallback was needed. Gas-link-to-path identity was checked for all five resistance paths.

The local `ComputeExposedModelParameters` at RespiratoryModel.cpp 1101–1140 exposes total model compliance/resistance, **not public left/right compliance getters**. Its local left/right variables are not an exposed API. Direct Current circuit compliance access resolves the requirement.

The actual gas hierarchy is `PulmonaryLungs -> LeftLungPulmonary / RightLungPulmonary -> ConductingAirways + AlveolarDeadSpace + Alveoli`. Do not use guessed `LeftLung`/`RightLung` names. Do not add parent totals to child volumes, or include pleural volumes in alveolar gas. `field-map.json` records every exported signal, unit, source and time semantics and the native child lists. Total system volume agrees with the two non-overlapping pulmonary side totals to a worst 2.220446049250313e-16 L; this is an aggregation check, **not gas conservation**.

## Pressure and flow axes

Recommended opening comparison: original `flow_L_s` and `volume_L` versus actual time. Recommended loop: **tidal flow-volume**, x=`volume_L`, y=`flow_L_s`, positive into the lungs. This is not forced spirometry or a diagnostic shape template.

For matched-input comparison use x=`driver_cmH2O`, y=`volume_L`, labelled **breathing input–volume**, not static compliance. Actual source pressure ranges -5 to 0 cmH2O in the final breath. `musclePressure_cmH2O` is absolute pressure near ambient, not the negative driver itself; do not mislabel it as -5 to 0.

For lung distension use one side consistently: x=`LeftTransalveolar_cmH2O` (Current left alveolar minus Current left pleural pressure), y=`leftAlveoli_L`. This is an explicitly defined same-side transpulmonary/distending-pressure view with no hidden bilateral weighting. Pulse's named `GetTranspulmonaryPressure` instead uses airway-opening minus pleural pressure in this source; it is deliberately not the plotted alveolar-minus-pleural field. Ideal constant native lung compliance can make this dynamic trajectory close to a line; do not promise a hysteresis loop or diagnose static compliance from a breathing manoeuvre. The useful driver-volume and tidal flow-volume shapes do not depend on making this graph look loop-like.

## Original-row playback and breath boundaries

The included columnar `playback.json` preserves all 6,001 original rows per branch at 0.02 s: 18,003 selected rows total. Every field, not only plotted fields, is checked against the source CSV. `sourceRowIndices[i] == i`; corresponding branch samples have identical step/time. No interpolation, smoothing, resampling or 1-second decimation is used.

Complete breath boundaries are successive observed starts of falling driver pressure after a flat/rising predecessor. The initial already-inspiring fragment is excluded; no `time % 5` guess is used. There are 23 complete driver-cycle intervals in each main branch. The summaries are sampled volume spans and signed flow extrema, not a substituted monitor tidal-volume value. All original rows, including incomplete edge fragments and the intervention transient, remain in playback; summaries alone exclude incomplete cycles. The baseline had an inherited phase, which explains the approximately 114.98-second final-cycle start rather than 115.00.

## Action serialization and restart nuance

Common configuration explicitly sets Active=On, DefaultType=Model and the specified pressure/timing fields. It is applied Instantaneous at time zero without resetting phase. Protobuf JSON omits the zero-valued `Model` enum and zero numeric values; the C++ setter and present scalar/unit wrappers establish the explicit settings. There are no compliance curves, resistance overrides, equipment, disease or treatment actions.

Individual configuration and modification JSON, action collections before/after processing, exact action times, full checkpoints, final states and event columns were retained in the historical native evidence, not this frontend distribution. Unlike the earlier oxygen action, this mechanics modification persists in active actions.

On restore, `RespiratoryModel::SetUp` lines 427–429 calls `SERespiratoryMechanicsModifiers::Activate`; that method's lines 60–83 fills absent multipliers with identity 1. Thus restored action JSON has additional explicit identity fields, although submitted modifier isolation and effective values are unchanged. Numeric recording continuation and event/discrete equality are exact. Do not claim byte-identical full-state or action-JSON serialization. The extra exploratory byte-shape assertion failed and was corrected to this source-grounded identity expansion; the original byte-shape failure is a historical diagnostic. No numerical threshold was changed.

## Limitations

These are controlled fictional recordings from one authored fixed-driver experiment, not disease diagnoses, physiological/clinical validation, static compliance testing, forced spirometry or evidence of learner benefit. Whole-body gas exchange and feedback remain active; the explicit breathing waveform overrides its driver. External flow need not equal a naïve closed-system volume integral. Native warnings were reviewed, not suppressed.
