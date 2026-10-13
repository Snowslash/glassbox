<!-- Public explanatory derivative. Original SHA-256: 0336df49b38dfe22bd49502d1c89502043e09f0b83d48ca7294261d6ca5830c4. Native raw evidence is historical and not included. -->

# Oxygen transport: recorded result

Post-hoc criterion correction: no repeated loss, not symmetric constancy. Same rtol=1e-6 atol=1e-8; original FAIL remains non-gating. This is not a conservation test; the positive drift cause is unresolved.

The original symmetric constancy diagnostic failed in 624 rows, first at step 17354 (347.0799999999743 s). Drift there was +0.0005748966345890949 g from first-post mass 574.8823334287836 g. Maximum positive gain: 0.0005902470450109831 g. Control also shows a smaller gain. Approximate balance corrections in Saturation.cpp do not prove the cause.

Fresh repeat: 18,001 rows, exact across fields/events. Restore: 9,001 rows from 180–360 s within unchanged rtol=1e-6 / atol=1e-8. Largest absolute difference: 4.697425492850016e-05 mL/min in DO2. Pre-action minimum mass drift: -1.2509190128184855e-08 g; post-action minimum: 0.0 g.

## Observation (real engine output)

| Sample | Hb g/dL | SaO2 fraction | CO L/min | CaO2 mL/dL | DO2 mL/min |
|---|---:|---:|---:|---:|---:|
| Shared baseline | 14.9666002493 | 0.9755025143 | 5.7790183003 | 20.5892984972 | 1189.8593280605 |
| Shared pre-action, 60 s | 14.9601914562 | 0.9753229950 | 5.7781949512 | 20.5806268593 | 1189.1887421078 |
| First post-action, 60.02 s | 10.4721320585 | 0.9753229938 | 5.7781949512 | 14.4929097419 | 837.4285789865 |
| Anaemia final, 360 s | 10.4496133659 | 0.9742930856 | 5.9745099943 | 14.4414661163 | 862.8068364514 |
| Control final, 360 s | 14.9280140545 | 0.9755544908 | 5.7586174060 | 20.5420574561 | 1182.9384962157 |

Rounded table only; Included `action-boundary.json` and `lesson-data.json` retain original precision and actual timestamps; raw CSVs are historical and not included. Control and anaemia match exactly through step 3000. First-post/pre Hb mass ratio is 0.7000000000726581; the local resistance-baseline ratio is 0.955. The first post-action blood volume is exactly the same as matched control (5489.6398385545435 mL). All sampled acute-anaemia and haemorrhage active flags are false and native total haemorrhaged volume remains zero. Blood volume subsequently evolves naturally; this is not a constant-volume experiment.

## Implemented relationship (source-inspected and algebraically checked)

- The action scales Hb, HbO2, HbCO2 and HbO2CO2 masses in vascular leaf compartments by `1-factor`, then scales cardiovascular resistance baselines by `clamp(1 - .15*factor, .9, 1)`. It neither withdraws circulating volume nor isolates haemoglobin alone. Cardiovascular `ProcessActions` clears it after one application.
- Native `BloodChemistry.ArterialOxygenContent` is mL O2/mL blood; exported CaO2 multiplies it by 100. Raw aortic molarities reconstruct content with `(O2 + 4*HbO2 + 4*HbO2CO2) * (native O2 molar mass / native O2 density) / 10`.
- Native DO2 equals native CO in L/min × 10 × content in mL/dL. Maximum absolute delivery residual across either trace was 2.2737367544323206e-13 mL/min. Content reconstruction residuals were at most 1.4210854715202004e-14 mL/dL. Global Hb concentration exactly matches haemoglobin mass / blood volume × 100 at parsed export precision.
- Whole-body controller model order places cardiovascular processing before blood chemistry (and tissue processing after it); all model Process calls precede PostProcess and time increment. CO is computed from the last completed cardiac cycle; content/saturation are current aortic blood-chemistry outputs. Equation agreement does **not** establish cycle-matched assays or independent mechanism validation. Completed-step raw content reconstruction was tested on every row.
- SaO2 comes from aorta. Pulse oximetry comes from right-arm saturation (plus carbon monoxide saturation if present); it is not a noisy clinical sensor model. Global Hb concentration is not the aortic Hb-species concentration.

Pinned implementation links and each field's identifiers, units and time semantics are in `field-map.json` and `lesson-data.json`. The how-to's misleading bleeding/reversibility prose is not used as an explanation.

## Action serialization discrepancy

The engine log genuinely serializes the individual AcuteAnemia action at 60 s with factor 0.3; its exact JSON text was retained in the historical native evidence. However, the historical submitted-action collection is `{}` even though the exporter immediately asserted `HasAcuteAnemia() == true` before advancing. Source inspection confirms `PBEngine::Serialize(const SEPatientActionCollection&, ...)` lines 320–423 lacks an AcuteAnemia branch. `GetAllActions` also omits it. Empty action-manager files therefore cannot independently prove absence of this pending action. This limitation does not invalidate the native per-action log, active flag assertion, one-shot mass change or cleared post-step flags. A checkpoint saved **while pending** would need special scrutiny; this checkpoint was saved long after consumption.

## Teaching interpretation

These recorded observations illustrate why a similar saturation can coexist with lower oxygen content and delivery. Later cardiac output increases in the anaemia branch, but delivery remains below matched control. This does not isolate the roles of altered viscosity, feedback or other coupled processes, and the passed contracted checks establish only bounded same-build/platform consistency and repeatability, not mass conservation or independent physiological validation. No normal-saturation clinical threshold, treatment advice or clinical/learner validation is inferred.

