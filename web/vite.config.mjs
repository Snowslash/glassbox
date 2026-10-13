import {defineConfig} from 'vite';
import {resolve} from 'node:path';
export default defineConfig({base:'./',build:{rolldownOptions:{input:Object.fromEntries(['index.html','lab.html','licences.html','app/index.html','app/model.html','app/oxygen.html','app/oxygen-model.html','app/respiratory.html','app/respiratory-model.html'].map(p=>[p,resolve(import.meta.dirname,p)]))}}});
