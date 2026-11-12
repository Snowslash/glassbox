import {approved, validateGate, validateData} from './respiratory-model.mjs';

export const respiratoryBundle = {
  files:{
    manifest:'../evidence/respiratory/manifest.json',
    checks:'../evidence/respiratory/checks.json',
    review:'../evidence/respiratory/review.json',
    fieldMap:'../evidence/respiratory/field-map.json',
    playback:'../evidence/respiratory/playback.json',
  },
  verifyHash(key, hash) {
    if (hash !== approved[key]) throw Error('The recording or its approval has changed. Integrity check stopped playback.');
  },
  validate(values, hashes) {
    validateGate(values.checks, values.review, hashes);
    return {data:validateData(values.playback), mapping:values.fieldMap};
  },
};
