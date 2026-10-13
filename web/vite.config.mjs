import {defineConfig} from 'vite';
import {resolve} from 'node:path';
export default defineConfig({base:'./',plugins:[{name:'root-relative-error-styles',transformIndexHtml:{order:'post',handler(html,context){return context.path==='/404.html'?html.replaceAll('href="./','href="/'):html;}}}],build:{rolldownOptions:{input:Object.fromEntries(['index.html','404.html','lab.html','licences.html','app/index.html','app/model.html','app/oxygen.html','app/oxygen-model.html','app/respiratory.html','app/respiratory-model.html'].map(p=>[p,resolve(import.meta.dirname,p)]))}}});
