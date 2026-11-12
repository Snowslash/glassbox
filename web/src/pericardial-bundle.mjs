import {approved, validateGate, validateData} from './pericardial-model.mjs';

export const pericardialBundle = {
  files:{
    approval:'../evidence/pericardial/approval.json',
    checks:'../evidence/pericardial/checks.json',
    lesson:'../evidence/pericardial/lesson-data.json',
  },
  verifyHash(key, hash) {
    if (hash !== approved[key]) throw Error('Recording integrity mismatch. Playback stopped.');
  },
  validate(values, hashes) {
    validateGate(values.checks, values.approval, hashes);
    validateData(values.lesson);
    return values;
  },
};
