import {validateData} from './model.mjs';

// Pressure intentionally checks schema in the browser, not a new runtime pin.
// Fixed recording identity remains owned by the existing build-time gates.
export const pressureBundle = {
  files:{lesson:'../evidence/lesson-data.json'},
  validate:values => validateData(values.lesson),
};
