<!-- Public explanatory derivative. Original SHA-256: b03888250a8897d6230a764cf7cd9bb3230a83db172bbe769b13a6b350429ef3. Native raw evidence is historical and not included. -->

# Annotated actual state — engineering gate PASS

Actual engine time: **549.99999999978979 s**, step 27500. Solver dt and full recording cadence: 0.02 s. Display bundle selects every 50th real row; it does not interpolate.

## Observation

| Quantity | Matched control | Blood loss | Difference vs control |
|---|---:|---:|---:|
| Circulating volume (mL) | 5508.974622 | 4684.615314 | -14.9639% |
| MAP (mmHg; last completed cycle mean) | 95.298036 | 94.212668 | -1.1389% |
| HR (1/min; heart-driver frequency) | 71.305626 | 87.695657 | +22.9856% |
| Stroke volume (mL; last completed cycle) | 80.613504 | 57.807241 | -28.2909% |
| CO (mL/min; cycle SV × HR) | 5748.196378 | 5069.443981 | -11.8081% |
| Actual path resistance (mmHg s/mL) | 13.850253 | 15.831240 | +14.3029% |

The engine reports external loss **824.969999999 mL**. The initial-to-final circulating-volume decline is **802.672094954 mL**; these differ by **22.297905046 mL**. The control volume also drifts. This is not a closed vascular-volume conservation experiment: exchange/redistribution and other sinks are present. The residual is not attributed to a specific transfer without a complete ledger.
Requested rate × duration is 825.000000000 mL, versus the engine counter's 824.969999999 mL. The 0.03 mL difference is one 0.02 s step at 1.5 mL/s: cardiovascular preprocessing counts the preceding actual circuit flow; first-step rate is zero. The export preserves this convention, rather than editing the counter.

## Implemented relationship

For **Aorta1 → RightLeg1**, `95.875753115358108 - 23.04494295670656` mmHg divided by actual current resistance `15.831239968991184` mmHg s/mL equals `4.6004488783762998` mL/s. Full-trace residual is zero at exported precision. The path has no pressure/flow source, compliance, inertance, valve or switch.

Final baroreceptor modifiers: heart rate **1.230554620**, elastance **1.011644173**, resistance **1.135735853**, compliance **0.937564288**. The selected systemic path resistance is higher in the blood-loss branch.

NervousModel derives sympathetic fraction from normalized MAP and updates four delayed scales. CardiovascularModel applies them to heart-driver frequency, maximal elastance, systemic path resistance and venous compliance.

The nervous-system prose sign discrepancy is resolved for this experiment by the pinned implementation and executed trace: resistance feedback and actual path resistance increase, not decrease. Reported systemic vascular resistance was not used as independent causal evidence.

- https://gitlab.kitware.com/physiology/engine/-/blob/5e29e5b13710a08cec90874be7d36ecb192ebcda/src/cpp/engine/common/system/physiology/NervousModel.cpp#L298
- https://gitlab.kitware.com/physiology/engine/-/blob/5e29e5b13710a08cec90874be7d36ecb192ebcda/src/cpp/engine/common/system/physiology/NervousModel.cpp#L432
- https://gitlab.kitware.com/physiology/engine/-/blob/5e29e5b13710a08cec90874be7d36ecb192ebcda/src/cpp/engine/common/system/physiology/CardiovascularModel.cpp#L2623
- https://gitlab.kitware.com/physiology/engine/-/blob/5e29e5b13710a08cec90874be7d36ecb192ebcda/src/cpp/engine/common/system/physiology/CardiovascularModel.cpp#L2806
- https://gitlab.kitware.com/physiology/engine/-/blob/5e29e5b13710a08cec90874be7d36ecb192ebcda/src/cpp/engine/common/system/physiology/CardiovascularModel.cpp#L2855

Circuit sampling source: https://gitlab.kitware.com/physiology/engine/-/blob/5e29e5b13710a08cec90874be7d36ecb192ebcda/src/cpp/cdm/circuit/SECircuitCalculator.cpp#L1117

## Teaching interpretation

This matched model experiment supports the proposed question: near-maintained MAP does not mean blood volume or stroke volume is maintained. The implemented feedback and exported modifiers provide a concrete mechanism consistent with the result, but do not isolate each mechanism's causal contribution.

## Limits

- A recorded row is not a full engine state.
- No atria; compartment volumes and pressures are model constructs, not literal anatomy.
- Blood-volume change also reflects redistribution/exchange and other sinks; it need not equal cumulative hemorrhage.
- Prescribed external flow is pressure-independent; no treatment inference.
- Matched control versus bleed does not isolate baroreflex causal contribution.
- Same elapsed time is not phase matching: do not interpret different instantaneous heart volumes as direct preload differences.
- The path equation is a consistency check of the implemented circuit solver, not independent physiological validation.
- Warning relevance review: `warnings-review.md`.
- All repeat channels and events matched exactly. Active-state restart passed rtol=1e-6, atol=1e-8; its largest error used 0.025606 of the allowed tolerance. Same-build/platform evidence only.
- A UI frame is not a full checkpoint, and playback is not state restoration.
