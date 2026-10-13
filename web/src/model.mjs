export const COMMIT='5e29e5b13710a08cec90874be7d36ecb192ebcda';
export const traceFields=['bloodVolume_mL','MAP_mmHg','HR_per_min','strokeVolume_mL'];
export const compartments=['Aorta','VenaCava','LeftHeart','RightHeart'];
export const feedback=['baroHeartRateScale','baroElastanceScale','baroResistanceScale','baroComplianceScale'];
export const requiredFields=['step','time_s','elapsed_s',...traceFields,'CO_mL_per_min','lossRate_mL_per_s','totalLoss_mL',...feedback,...compartments.flatMap(c=>['_P_mmHg','_V_mL','_inFlow_mL_per_s','_outFlow_mL_per_s'].map(s=>c+s)),'path_source_mmHg','path_target_mmHg','path_R_mmHg_s_per_mL','path_Q_mL_per_s','hemorrhageActive'];
export function validateData(d) {
 const fail=()=>{throw new Error('Recorded data failed its integrity contract. No substitute values are shown.');};
 if(!d || d.schemaVersion!==1 || d.gateStatus!=='PASS' || d.engineCommit!==COMMIT || d.fictional!==true || d.interpolated!==false || d.solverDt_s!==0.02 || d.sourceOutputCadence_s!==0.02 || d.selectedRowStride!==50 || d.nominalPlaybackCadence_s!==1 || JSON.stringify(d.defaultTraces)!==JSON.stringify(traceFields)) fail();
 const sources=d.annotations?.[0]?.implemented_relationship?.sources;
 if(!Array.isArray(sources)||sources.length!==5||sources.some(s=>typeof s!=='string'||!s.startsWith(`https://gitlab.kitware.com/physiology/engine/-/blob/${COMMIT}/`))||!Array.isArray(d.limitations)||!d.limitations.length||d.limitations.some(s=>typeof s!=='string')) fail();
 if(!Array.isArray(d.fieldMap) || d.fieldMap.length!==requiredFields.length+1) fail();
 for(const f of [...requiredFields,'activeEvents']) {
  const m=d.fieldMap.find(x=>x.field===f);
  if(!m || !['unit','identifier','semantics','kind'].every(k=>typeof m[k]==='string' && m[k]) || typeof m.source!=='string' || !m.source.startsWith(`https://gitlab.kitware.com/physiology/engine/-/blob/${COMMIT}/`)) fail();
 }
 for(const run of ['bleed','control']) {
  const rows=d.runs?.[run]?.samples;
  if(!Array.isArray(rows)||rows.length!==551) fail();
  rows.forEach((r,i)=>{
   if(!r || requiredFields.some(k=>typeof r[k]!=='number'||!Number.isFinite(r[k])) || typeof r.activeEvents!=='string') fail();
   if(r.step!==i*50 || Math.abs(r.elapsed_s-i)>1e-6 || r.time_s!==r.elapsed_s || r.path_R_mmHg_s_per_mL<=0 || ![0,1].includes(r.hemorrhageActive)) fail();
   if(run==='control' && (r.step!==d.runs.bleed.samples[i].step || r.time_s!==d.runs.bleed.samples[i].time_s)) fail();
  });
  if(rows.at(-1).time_s!==d.actualFinalTime_s) fail();
 }
 return d;
}
export function initialState() {return {step:0,index:0,prediction:'',skipped:false,playing:false,speed:10,compare:false,selection:'Aorta',trace:'bloodVolume_mL',explanation:''};}
export function snapIndex(fraction,count) {return Math.max(0,Math.min(count-1,Math.round((Number.isFinite(fraction)?fraction:0)*(count-1))));}
export function selectFrame(d,s) {const index=s.step===0?0:s.index;return {index,bleed:d.runs.bleed.samples[index],control:s.compare&&s.step>=3?d.runs.control.samples[index]:null};}
export function transition(s,a,d) {
 const last=d.runs.bleed.samples.length-1;
 switch(a.type) {
 case 'prediction':return ['near','falls','rises'].includes(a.value)?{...s,prediction:a.value,skipped:false}:s;
 case 'skip':return {...s,skipped:true,step:1,playing:false};
 case 'next':{if(s.step===0&&!s.prediction&&!s.skipped)return s;const step=Math.min(4,s.step+1);return {...s,step,playing:false,compare:step===3?true:s.compare};}
 case 'back':return {...s,step:Math.max(0,s.step-1),playing:false};
 case 'seek':return s.step>0&&Number.isFinite(a.index)?{...s,index:Math.max(0,Math.min(last,Math.round(a.index))),playing:false}:s;
 case 'reset':return s.step>0?{...s,index:0,playing:false}:s;
 case 'end':return s.step>0?{...s,index:last,playing:false}:s;
 case 'play':return s.step>0?{...s,index:s.index===last?0:s.index,playing:!s.playing}:s;
 case 'tick':return s.playing?{...s,index:Math.min(last,s.index+1),playing:s.index+1<last}:s;
 case 'speed':return [1,10,30].includes(a.value)?{...s,speed:a.value}:s;
 case 'compare':return s.step>=3?{...s,compare:!s.compare}:s;
 case 'selection':return s.step>=2&&[...compartments,'path','feedback'].includes(a.value)?{...s,selection:a.value}:s;
 case 'trace':return traceFields.includes(a.value)?{...s,trace:a.value}:s;
 case 'explanation':return {...s,explanation:String(a.value)};
 default:return s;
 }
}
