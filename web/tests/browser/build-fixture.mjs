// Compile in a separate, awaited process: Vite's native build worker pool must
// exit before Chromium starts. This fixture is never part of the public build.
import {build} from 'vite';
import {resolve} from 'node:path';
const web = resolve(import.meta.dirname, '../..');
await build({configFile:false, root:web, publicDir:false, base:'/__fixture/', logLevel:'warn',
  build:{outDir:resolve(web, '.runtime/lifecycle-fixture'), emptyOutDir:true,
    rolldownOptions:{input:resolve(web, 'tests/browser/mount.html')}}});
