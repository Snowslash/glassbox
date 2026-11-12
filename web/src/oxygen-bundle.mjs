import {validateGate, validateData} from './oxygen-model.mjs';

export const oxygenBundle = {
  files:{
    manifest:'../evidence/oxygen/manifest.json',
    checks:'../evidence/oxygen/checks.json',
    review:'../evidence/oxygen/review.json',
    lesson:'../evidence/oxygen/lesson-data.json',
  },
  // Oxygen validates the three fixed digests and the review's claims together.
  // Its review JSON is not independently byte-pinned in the browser.
  validate(values, hashes) {
    validateGate(values.checks, values.review, hashes);
    return validateData(values.lesson);
  },
};
