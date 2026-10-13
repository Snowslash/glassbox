export const branches=['control','highR','lowC'];
export const labels={control:'Unchanged',highR:'Higher airway resistance',lowC:'Lower lung compliance'};
export const columns=['step','time_s','driver_cmH2O','flow_L_s','volume_L','LeftLungCompartment_L','RightLungCompartment_L','leftAlveoli_L','rightAlveoli_L','LeftTransalveolar_cmH2O','RightTransalveolar_cmH2O','leftLungC_L_cmH2O','rightLungC_L_cmH2O','leftChestC_L_cmH2O','rightChestC_L_cmH2O','upperR_cmH2O_s_L','leftR_cmH2O_s_L','rightR_cmH2O_s_L','upperSource_cmH2O','upperTarget_cmH2O','upperFlow_L_s'];
export const approved={"playback":"f0e9746f3633d8e12eac310249718bc1e47808f557694ebbd14c9e17db1d8ee6","manifest":"4102cacab2da068d01f31185a830ac84cb29e161a02000d9afa41a8c75f4a94a","checks":"9f6ebcc4538234bf3ee34963a4abfb6136d4fdc0eb1231ff2a30a30477ada71f","review":"521be82cb1175ea12791e6c299948fde5c074626ed1d2ccc800ea4617009e5ac","fieldMap":"ba67120d4f6f97f347dd3f6c9263775ab7212065b9dfd4f6ec11768c15688a55"};
export const nativeHash='a7c9b859287b38dfb4d8026f1119c45b12916c829763675bb164bdf6bc5702a3';
const fail=()=>{throw Error('Respiratory recording failed its integrity contract. No substitute values are shown.');};
export function validateGate(c,r,h){
 if(c?.gateStatus!=='PASS'||c.checkCount!==90||c.checks?.length!==90||!c.checks.every(x=>x.passed===true)||r?.status!=='PASS'||r.parentUIApproval!==true)fail();
 for(const k of Object.keys(approved))if(h?.[k]!==approved[k])fail();
 if(r.manifestSHA256!==h.manifest||r.checksSHA256!==h.checks||r.fieldMapSHA256!==h.fieldMap||r.lessonDataSHA256!==nativeHash||r.playback?.sha256!==h.playback||r.playback?.bytes!==6100431||r.playback?.interpolated!==false)fail();return true;
}
export function validateData(d){
 if(d?.schemaVersion!==1||d.format!=='columnar-original-fields'||d.nativeSourceSHA256!==nativeHash||d.interpolated!==false||d.sourceCadence_s!==.02||d.selectedCadence_s!==.02||d.selectedRowsPerRun!==6001||JSON.stringify(d.columns)!==JSON.stringify(columns)||d.sourceRowIndices?.length!==6001||!d.sourceRowIndices.every((n,i)=>n===i))fail();
 const runs={};for(const b of branches){if(d.runs?.[b]?.length!==6001)fail();runs[b]=d.runs[b].map((a,i)=>{
 if(a?.length!==21||!a.every(Number.isFinite)||a[0]!==i||Math.abs(a[1]-i*.02)>1e-8||a[2]<-5||a[2]>0||a.slice(4,9).some(v=>v<=0)||a.slice(11,19).some(v=>v<=0)||Math.abs(a[4]-a[5]-a[6])>1e-12)fail();
 if(b!=='control'&&(a[1]!==d.runs.control[i][1]||a[2]!==d.runs.control[i][2]||(i<=1500&&a.some((v,j)=>v!==d.runs.control[i][j]))))fail();
 return Object.fromEntries(columns.map((k,j)=>[k,a[j]]));});
 const breaths=d.breaths?.[b];if(breaths?.length!==23)fail();
 for(const [j,r]of breaths.entries()){if(r.startStep!==249+j*250||r.endStep!==499+j*250||r.originalRowsInclusive!==251||r.startTime_s!==runs[b][r.startStep]?.time_s||r.endTime_s!==runs[b][r.endStep]?.time_s)fail();const rows=runs[b].slice(r.startStep,r.endStep+1),vs=rows.map(x=>x.volume_L),fs=rows.map(x=>x.flow_L_s);if(r.volumeSpan_L!==Math.max(...vs)-Math.min(...vs)||r.inspiratoryPeak_L_s!==Math.max(...fs)||r.expiratoryPeak_L_s!==Math.min(...fs))fail();}
 }return {...d,runs};
}
export const initialState=()=>({step:0,index:0,branch:'highR',plot:'tidal',compare:false,speed:10,playing:false,prediction:'',reflection:''});
export const displayIndex=s=>s.step===0?0:s.index;
export const showOutcome=s=>s.step>0&&displayIndex(s)>=5999;
export function transition(s,a){switch(a.type){
 case 'prediction':return ['both','resistance','compliance','neither'].includes(a.value)?{...s,prediction:a.value}:s;
 case 'skip':return {...s,step:1,playing:false};
 case 'next':return s.step===0&&!s.prediction?s:{...s,step:Math.min(4,s.step+1),compare:s.step===2?true:s.compare,playing:false};
 case 'back':return {...s,step:Math.max(0,s.step-1),playing:false};
 case 'seek':return s.step&&Number.isFinite(a.index)?{...s,index:Math.max(0,Math.min(6000,Math.round(a.index))),playing:false}:s;
 case 'finalBreath':return s.step?{...s,index:5999,playing:false}:s;
 case 'replay':return s.step?{...s,index:0,playing:false}:s;
 case 'play':return s.step?{...s,index:s.index===6000?0:s.index,playing:!s.playing}:s;
 case 'pause':return {...s,playing:false};
 case 'tick':{if(!s.playing)return s;const index=Math.min(6000,s.index+Math.max(1,Math.floor(a.count||1)));return {...s,index,playing:index<6000};}
 case 'speed':return [1,10,30].includes(a.value)?{...s,speed:a.value}:s;
 case 'branch':return ['highR','lowC'].includes(a.value)?{...s,branch:a.value}:s;
 case 'plot':return ['tidal','input'].includes(a.value)?{...s,plot:a.value}:s;
 case 'compare':return s.step>=3?{...s,compare:!s.compare}:s;
 case 'reflection':return {...s,reflection:String(a.value)};
 default:return s;
}}
export function breathRange(d,b,index){const breaths=d.breaths[b];const r=breaths.find(x=>index>=x.startStep&&index<=x.endStep);if(r)return {start:r.startStep,end:r.endStep,cursor:index,complete:index===r.endStep,fragment:false};return {start:index<breaths[0].startStep?0:breaths.at(-1).endStep,end:index<breaths[0].startStep?breaths[0].startStep-1:6000,cursor:index,complete:false,fragment:true};}
// Fixed across every branch and cursor, including the large post-change transient.
export const axes={volume:{x:[0,120],y:[1.8,2.8],xField:'time_s',yField:'volume_L',xLabel:'Time (s)',yLabel:'Lung volume (L)'},flow:{x:[0,120],y:[-3,1],xField:'time_s',yField:'flow_L_s',xLabel:'Time (s)',yLabel:'Airflow (L/s)'},tidal:{x:[1.8,2.8],y:[-3,1],xField:'volume_L',yField:'flow_L_s',xLabel:'Lung volume (L)',yLabel:'Airflow (L/s)'},input:{x:[-5,0],y:[1.8,2.8],xField:'driver_cmH2O',yField:'volume_L',xLabel:'Breathing input (cmH₂O)',yLabel:'Lung volume (L)'}};
export function point(row,kind){const a=axes[kind];return [40+(row[a.xField]-a.x[0])/(a.x[1]-a.x[0])*520,180-(row[a.yField]-a.y[0])/(a.y[1]-a.y[0])*160];}
const cache=new WeakMap();
export function geometry(d,b,kind,index){let c=cache.get(d);if(!c){c={};cache.set(d,c);}const key=b+kind;if(!c[key])c[key]=d.runs[b].map(r=>point(r,kind));const start=['tidal','input'].includes(kind)?breathRange(d,b,index).start:0;return {domain:axes[kind],points:c[key].slice(start,index+1),sourceIndices:d.sourceRowIndices.slice(start,index+1)};}
export const filling=r=>({left:r.LeftLungCompartment_L,right:r.RightLungCompartment_L,max:1.6});
export function readRoute(search){const p=new URLSearchParams(search),v=p.get('sample'),n=/^(0|[1-9]\d*)$/.test(v||'')?Number(v):0;return {...initialState(),step:3,index:Number.isSafeInteger(n)&&n<=6000?n:0,branch:['highR','lowC'].includes(p.get('branch'))?p.get('branch'):'highR',plot:p.get('plot')==='input'?'input':'tidal',compare:p.get('compare')==='1'};}
export const modelHref=s=>'./respiratory-model.html?'+new URLSearchParams({sample:String(displayIndex(s)),branch:s.branch,plot:s.plot,compare:s.step>=3&&s.compare?'1':'0'});
