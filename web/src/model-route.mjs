// Accept Pages' clean URL without changing authored .html links or query state.
export const isModelRoute=(pathname,stem)=>pathname.endsWith('/'+stem)||pathname.endsWith('/'+stem+'.html');
