import assert from 'node:assert/strict';
export const pages=['index.html','lab.html','licences.html','app/index.html','app/model.html','app/oxygen.html','app/oxygen-model.html','app/respiratory.html','app/respiratory-model.html','404.html'];
const csp="default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self'; font-src 'self'; connect-src 'self'; base-uri 'none'; form-action 'none'; object-src 'none'";
const required={
 'content-security-policy':csp+"; frame-ancestors 'none'",
 'x-frame-options':'DENY',
 'x-content-type-options':'nosniff',
 'referrer-policy':'no-referrer',
 'permissions-policy':'camera=(), microphone=(), geolocation=()',
 'x-robots-tag':'noindex, nofollow'
};
// Used against source in unit tests and the actual output directory after build.
export async function verifyDeployment(read){
 const lines=(await read('_headers')).trimEnd().split(/\r?\n/);
 assert.equal(lines.shift(),'/*','One global Pages header rule is required');
 const actual={};
 for(const line of lines){
  const match=/^  ([\w-]+): (.+)$/.exec(line);assert.ok(match,'Unexpected header line: '+line);
  const name=match[1].toLowerCase();assert.equal(actual[name],undefined,'Duplicate header: '+name);actual[name]=match[2];
 }
 assert.deepEqual(actual,required,'Deployment response policy changed');
 for(const page of pages){
  const html=await read(page);
  assert.equal(/http-equiv="Content-Security-Policy" content="([^"]+)"/.exec(html)?.[1],csp,'CSP changed: '+page);
  assert.match(html,/name="robots" content="noindex,nofollow"/,'Indexing policy changed: '+page);
  if(page==='404.html'){
   assert.match(html,/<h1[^>]*>Page not found<\/h1>/);
   assert.match(html,/<main\b/);assert.match(html,/href="\/"/);assert.match(html,/href="\/lab.html"/);
   assert.doesNotMatch(html,/<(?:script|base)\b/i,'404 must work without an application or base tag');
   const hrefs=[...html.matchAll(/href="([^"]+)"/g)].map(m=>m[1]);
   assert.ok(hrefs.every(h=>/^\/(?!\/)/.test(h)),'404 links and styles must resolve from nested missing paths');
   assert.match(html,/rel="stylesheet"/,'404 must use the pinned estate styles');
  }
 }
 return {pages:pages.length,headers:Object.keys(required).length};
}
