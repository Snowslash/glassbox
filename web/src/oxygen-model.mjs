import {COMMIT} from './model.mjs';
export const fields=['Hb_g_dL','SaO2_fraction','CaO2_mL_dL','CO_L_min','DO2_mL_min'];
export const labels={Hb_g_dL:'Haemoglobin',SaO2_fraction:'Arterial oxygen saturation',CaO2_mL_dL:'Oxygen content',CO_L_min:'Cardiac output',DO2_mL_min:'Oxygen delivery'};
export const units={Hb_g_dL:'g/dL',SaO2_fraction:'%',CaO2_mL_dL:'mL O₂/dL blood',CO_L_min:'L/min',DO2_mL_min:'mL O₂/min'};
export const approved={"manifest":"2558fc2e98c8a3bdad9bea34f474f2021d38c1ed336f82d22e5d0d40eb7a2142","checks":"dcd92ed3106d34946f50ffc7637e65cd0c3dc55171051b05d7bb109ad12d6fde","lesson":"0c364167254fdf541f9946756920a9bc79cd98f09f732bf8f01a520df5fe9cb3"};
const required=['step','time_s','elapsed_s',...fields,'SpO2_fraction','PaO2_mmHg','hemoglobinMass_g','bloodVolume_mL','HR_per_min','aortaO2_mmol_L','aortaHbO2_mmol_L','aortaHbO2CO2_mmol_L','O2MolarMass_g_mmol','O2Density_g_mL','arterialContent_mL_mL','anemiaActive','hemorrhageActive','totalLoss_mL','pathBaselineR_mmHg_s_mL','activeEvents'];
const nativeUnits={step:'index',time_s:'s',elapsed_s:'s',Hb_g_dL:'g/dL',SaO2_fraction:'fraction',CO_L_min:'L/min',CaO2_mL_dL:'mL O2/dL blood',DO2_mL_min:'mL O2/min',SpO2_fraction:'fraction',PaO2_mmHg:'mmHg',hemoglobinMass_g:'g',bloodVolume_mL:'mL',HR_per_min:'1/min',aortaO2_mmol_L:'mmol/L',aortaHbO2_mmol_L:'mmol/L',aortaHbO2CO2_mmol_L:'mmol/L',O2MolarMass_g_mmol:'g/mmol',O2Density_g_mL:'g/mL',arterialContent_mL_mL:'mL O2/mL blood',anemiaActive:'boolean 0/1',hemorrhageActive:'boolean 0/1',totalLoss_mL:'mL',pathBaselineR_mmHg_s_mL:'mmHg s/mL',activeEvents:'semicolon-separated names'};
const fail=()=>{throw Error('Oxygen recording failed its integrity contract. No substitute values are shown.');};
const near=(a,b)=>Math.abs(a-b)<=1e-8+1e-10*Math.abs(b);
export function validateData(d){
 if(!d||d.schemaVersion!==1||d.experimentId!=='oxygen'||d.gateStatus!=='PASS'||d.engineCommit!==COMMIT||d.fictional!==true||d.interpolated!==false||d.solverDt_s!==.02||d.sourceOutputCadence_s!==.02||d.selectedRowStride!==50||d.nominalPlaybackCadence_s!==1||d.duration_s!==360||d.action?.time_s!==60||d.action?.reductionFactor!==.3||d.action?.kind!=='AcuteAnemia'||d.action?.timing!=='after sample')fail();
 const source=s=>typeof s==='string'&&s.startsWith(`https://gitlab.kitware.com/physiology/engine/-/blob/${COMMIT}/`);
 if(d.fieldMap?.length!==24||new Set(d.fieldMap.map(m=>m.field)).size!==24||!d.sources?.length||!d.sources.every(source)||!d.limitations?.length)fail();
 for(const field of required){const m=d.fieldMap.find(m=>m.field===field);if(!m||m.unit!==nativeUnits[field]||!['unit','identifier','kind','timeSemantics'].every(k=>typeof m[k]==='string'&&m[k])||!source(m.source))fail();}
 for(const run of ['control','anaemia']){
 const rows=d.runs?.[run]?.samples;if(rows?.length!==361)fail();
 for(const [i,r]of rows.entries()){
 if(!r||Object.keys(r).length!==24||required.some(k=>k==='activeEvents'?typeof r[k]!=='string':!Number.isFinite(r[k])))fail();
 if(r.step!==i*50||Math.abs(r.time_s-i)>1e-7||r.elapsed_s!==r.time_s||r.anemiaActive!==0||r.hemorrhageActive!==0||r.totalLoss_mL!==0)fail();
 if(['SaO2_fraction','SpO2_fraction'].some(k=>r[k]<0||r[k]>1)||['bloodVolume_mL','O2Density_g_mL','O2MolarMass_g_mmol','Hb_g_dL','CO_L_min','CaO2_mL_dL','DO2_mL_min'].some(k=>r[k]<=0))fail();
 if(!near(r.CaO2_mL_dL,r.arterialContent_mL_mL*100)||!near(r.DO2_mL_min,r.CaO2_mL_dL*r.CO_L_min*10)||!near(r.Hb_g_dL,r.hemoglobinMass_g/r.bloodVolume_mL*100)||!near(r.CaO2_mL_dL,(r.aortaO2_mmol_L+4*r.aortaHbO2_mmol_L+4*r.aortaHbO2CO2_mmol_L)*r.O2MolarMass_g_mmol/r.O2Density_g_mL/10))fail();
 if(run==='anaemia'){const c=d.runs.control.samples[i];if(c.time_s!==r.time_s||(i<=60&&required.some(k=>c[k]!==r[k])))fail();}
 }if(rows.at(-1).time_s!==d.actualFinalTime_s)fail();
 }return d;
}
export function validateGate(c,r,h){
 if(c?.gateStatus!=='PASS'||r?.status!=='PASS'||!r.approvalScope||!r.criterionCorrection&& !r.decision)fail();
 for(const k of ['manifest','checks','lesson'])if(h?.[k]!==approved[k]||r['verified'+k[0].toUpperCase()+k.slice(1)+'SHA256']!==h[k])fail();
 for(const k of ['freshRepeat','checkpointContinuation','matchedPreAction','oneShotNoRepeatedLoss','sourceRowSelection','noBloodLossAction','actionEvidence','warningsErrors'])if(c[k]?.status!=='PASS')fail();
 for(const run of ['control','anaemia','repeat','restore'])if(c.relationships?.[run]?.status!=='PASS'||c.warningsErrors?.runs?.[run]?.status!=='PASS')fail();
 if(c.freshRepeat.exact!==true||c.freshRepeat.rows!==18001||c.checkpointContinuation.rows!==9001||c.checkpointContinuation.rtol!==1e-6||c.checkpointContinuation.atol!==1e-8||c.matchedPreAction.rows!==3001||c.sourceRowSelection.stride!==50||c.sourceRowSelection.rowsPerRun!==361||c.sourceRowSelection.allFieldsCompared!==true||c.postActionMassRetention?.status!=='FAIL'||c.postActionMassRetention.gating!==false||!c.criterionCorrection)fail();return true;
}
export const initialState=()=>({step:0,index:0,prediction:'',skipped:false,playing:false,speed:10,compare:false,trace:fields[0],explanation:''});
export function selectFrame(d,s){const index=s.step===0?0:s.index;return{index,anaemia:d.runs.anaemia.samples[index],control:s.step>=3&&s.compare?d.runs.control.samples[index]:null};}
export function transition(s,a,d){const last=d.runs.anaemia.samples.length-1;switch(a.type){
 case 'prediction':return ['near','falls','rises'].includes(a.value)?{...s,prediction:a.value,skipped:false}:s;
 case 'skip':return{...s,step:1,skipped:true,playing:false};
 case 'next':if(!s.step&&!s.prediction&&!s.skipped)return s;return{...s,step:Math.min(4,s.step+1),playing:false,compare:s.step===2?true:s.compare};
 case 'back':return{...s,step:Math.max(0,s.step-1),playing:false};
 case 'pause':return{...s,playing:false};
 case 'seek':return s.step>0&&Number.isFinite(a.index)?{...s,index:Math.max(0,Math.min(last,Math.round(a.index))),playing:false}:s;
 case 'end':return s.step?{...s,index:last,playing:false}:s;
 case 'play':return s.step?{...s,index:s.index===last?0:s.index,playing:!s.playing}:s;
 case 'tick':return s.playing?{...s,index:Math.min(last,s.index+1),playing:s.index+1<last}:s;
 case 'speed':return [1,10,30].includes(a.value)?{...s,speed:a.value}:s;
 case 'compare':return s.step>=3?{...s,compare:!s.compare}:s;
 case 'trace':return fields.includes(a.value)?{...s,trace:a.value}:s;
 case 'explanation':return{...s,explanation:String(a.value)};
 default:return s;
}}
export const display=(value,field)=>(field==='SaO2_fraction'?value*100:value).toFixed(field==='DO2_mL_min'?1:2);
export const figure=row=>({content:row.CaO2_mL_dL,flow:row.CO_L_min,delivery:row.DO2_mL_min});
export function geometry(d,field,index){const values=['anaemia','control'].flatMap(run=>d.runs[run].samples.map(r=>r[field]));const low=Math.min(...values),high=Math.max(...values),pad=(high-low)*.12||1,domain=[low-pad,high+pad];const points=run=>d.runs[run].samples.slice(0,index+1).map(r=>[40+r.elapsed_s/360*520,140-(r[field]-domain[0])/(domain[1]-domain[0])*120]);return{domain,anaemia:points('anaemia'),control:points('control')};}
export const linePath=(points,actionGap=false)=>points.map(([x,y],i)=>`${i===0||(actionGap&&i===61)?'M':'L'}${x},${y}`).join(' ');
export function readRoute(search){const p=new URLSearchParams(search),raw=p.get('sample'),n=/^(0|[1-9]\d*)$/.test(raw||'')?Number(raw):0;return{...initialState(),step:3,index:Number.isSafeInteger(n)&&n<=360?n:0,compare:p.get('compare')==='1',trace:fields.includes(p.get('trace'))?p.get('trace'):fields[0]};}
export const modelHref=(frame,state)=>'./oxygen-model.html?'+new URLSearchParams({sample:String(frame.index),compare:frame.control?'1':'0',trace:state.trace});
