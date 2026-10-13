import {createHash} from 'node:crypto';
import {publicationPins} from '../src/publication-pins.mjs';
export const pins=publicationPins;
export async function verifyPublication(read){for(const [path,expected] of Object.entries(pins)){const b=await read(path);if(createHash('sha256').update(b).digest('hex')!==expected)throw Error('Publication evidence identity mismatch: '+path);}}
