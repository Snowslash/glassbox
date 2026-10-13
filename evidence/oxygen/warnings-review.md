<!-- Public explanatory derivative. Original SHA-256: 93e429f807afbe7681193e7189c82a63aa1d7458fc9e6d4d3e0fe0143bae8d15. Native raw evidence is historical and not included. -->

# Warning / validity review — corrected contracted gate

## All four native runs reviewed

`control.log`, `anaemia.log`, `repeat.log`, `restore.log`: zero WARN, ERROR, FATAL or IrreversibleState entries. The historical native checker computed these results separately for each run and checked finite/admissible original rows; checks.json records the results. Only StartOfCardiacCycle, StartOfInhale and StartOfExhale events occur, sometimes combined. Repeat events match exactly; restored continuation events match uninterrupted anaemia at every row.

Control, anaemia and repeat log `[INFO] [119.9(s)] Stomach is out of Sodium`. Restore starts at 180 s and does not repeat that earlier message. The identical baseline provides default stomach contents; no feeding/treatment/electrolyte intervention was introduced. This retained informational depletion message is not an engine warning and does not validate longer-duration nutrition handling.

All four logs identify Pulse 4.4.0 with blank GitHash. Their `Build Time` strings differ between process starts; these strings are not used as binary provenance or evidence of recompilation. The unchanged executable, static library, source/build/assets and archived dependency hashes establish reuse. No rebuild was run during continuation.

## Retained failed diagnostic and criterion correction

The original diagnostic failed at the additional symmetric Hb-mass constancy test. It remains FAIL at rtol=1e-6 / atol=1e-8: 624 failed rows, first step 17354, maximum positive gain 0.0005902470450109831 g. This does not establish repeated action loss. The cumulative source remains unresolved. Source-inspected approximate balance corrections in Saturation.cpp do not prove attribution. No red-cell-production, validated-conservation or proven floating-point-cause claim is made.

The post-hoc correction adopted the no-repeated-loss predicate with identical tolerances. Pre-action minimum mass drift is -1.2509190128184855e-08 g, within tolerance; post-action minimum is 0.0 g. Every gain, including future gross gains, remains in the separate diagnostic. The contracted gate is now PASS after genuinely executed repeat/restore, not because the diagnostic was concealed. The original FAIL is retained in the included checks; original native logs are historical and excluded.

## Serialization and physiology limitations

The pending AcuteAnemia patient-action collection serialization is empty despite a successful native HasAcuteAnemia assertion. PBEngine collection serialization omits this action; individual native logged JSON retains factor 0.3. Empty collection output does not independently prove absence. The 180s checkpoint is after consumption; its continuation passed, not a pending-action serialization test.

The action also changes empirical cardiovascular resistance baselines. This is not haemorrhage or isolated Hb manipulation. CO is a completed-cycle output while aortic content is instantaneous; their derived delivery equation is not independent physiological validation. Global Hb differs from aortic Hb species, and aortic SaO2 differs in definition from right-arm pulse oximetry. No clinical/learner validation or forced outcome gate.

