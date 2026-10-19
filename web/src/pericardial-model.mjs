export const branches=['control','effusion'];
export const labels={control:'No added fluid',effusion:'Fluid around the heart'};
export const approved={"lesson": "9e091201f7708cbbc6d7b1e03f2aeea0c0f3772e28b03ed7d9b3396aa2776e2f", "approval": "01457adf8e75bb312b2f9e98b0472fdca4b05c8c50556e8e2e3c0f6ab389f917", "checks": "8deba69589d46b82dca90a36d7342034ff69efc0d31d9bde4210290c1384b855"};
export const trendColumns=["step", "time_s", "bloodVolume_mL", "CVP_mmHg", "CO_L_min", "SV_mL", "HR_min", "Pericardium1_P_mmHg", "Pericardium1_V_mL", "RightHeart1_P_mmHg", "RightHeart1_V_mL", "RightHeart3_P_mmHg", "LeftHeart1_P_mmHg", "LeftHeart1_V_mL", "LeftHeart3_P_mmHg", "Pericardium1ToGround_C_mL_mmHg", "RightHeart1ToRightHeart3_C_mL_mmHg", "LeftHeart1ToLeftHeart3_C_mL_mmHg", "RightHeart3ToGround_baseline_mmHg", "RightHeart3ToGround_current_mmHg", "RightHeart3ToGround_next_mmHg", "LeftHeart3ToGround_baseline_mmHg", "LeftHeart3ToGround_current_mmHg", "LeftHeart3ToGround_next_mmHg", "GroundToPericardium1_flow_mL_s", "VenaCava1ToRightHeart2_flow_mL_s", "RightHeart2ToRightHeart1_flow_mL_s", "RightHeart1ToMainPulmonaryArteries1_flow_mL_s", "LeftHeart2ToLeftHeart1_flow_mL_s", "LeftHeart1ToAorta2_flow_mL_s", "injectionSource_mL_s", "inflowR_mmHg_s_mL", "inflowSource_mmHg", "inflowTarget_mmHg", "effusionActive", "cycleStart", "hemorrhageActive", "hemorrhaged_mL", "activeEvents"];
export const pvColumns=['step','time_s','RightHeart1_P_mmHg','RightHeart1_V_mL','RightHeart3_P_mmHg','Pericardium1_P_mmHg','cycleStart'];
const fail=()=>{throw Error('Pericardial recording failed its integrity contract. No substitute values are shown.');};
export function validateGate(c,r,h){
 if(c?.status!=='PASS'||c.testsRun!==11||c.skipped!==0||c.failures?.length!==0||r?.status!=='PASS'||r.parentUIApproved!==true||r.payloadSHA256!==approved.lesson||r.payloadBytes!==7782514)fail();
 for(const k of Object.keys(approved))if(h?.[k]!==approved[k])fail();return true;
}
export function validateData(d){
 if(d?.schemaVersion!==1||d.dt_s!==.02||d.actionAfterStep!==1500||d.duration_s!==630||Object.keys(d.branches||{}).join(',')!==branches.join(','))fail();
 for(const b of branches){const x=d.branches[b];
 if(JSON.stringify(x.trendColumns)!==JSON.stringify(trendColumns)||JSON.stringify(x.pvColumns)!==JSON.stringify(pvColumns)||x.trendRows?.length!==631||x.pvRows?.length!==31501||x.trendSourceIndices?.length!==631||x.pvSourceIndices?.length!==31501||x.latestCompleteCycleIds?.length!==31501)fail();
 for(const [i,a]of x.pvRows.entries())if(a.length!==7||!a.every(Number.isFinite)||a[0]!==i||x.pvSourceIndices[i]!==i||Math.abs(a[1]-i*.02)>1e-7||![0,1].includes(a[6]))fail();
 for(const [i,a]of x.trendRows.entries()){
 if(a.length!==39||!a.slice(0,38).every(Number.isFinite)||typeof a[38]!=='string'||a[0]!==i*50||x.trendSourceIndices[i]!==i*50)fail();
 for(const [j,k]of pvColumns.entries())if(a[trendColumns.indexOf(k)]!==x.pvRows[i*50][j])fail();
 if(b==='effusion'&&i<=30&&JSON.stringify(a)!==JSON.stringify(d.branches.control.trendRows[i]))fail();
 }
 const starts=[];for(let i=1;i<x.pvRows.length;i++)if(x.pvRows[i][6]===1&&x.pvRows[i-1][6]===0)starts.push(i);
 if(x.completeCycles?.length!==starts.length-1)fail();
 for(const [i,c]of x.completeCycles.entries()){
 if(c.id!==i||c.startIndex!==starts[i]||c.endIndex!==starts[i+1]||c.startStep!==c.startIndex||c.endStep!==c.endIndex||c.maxVolume_mL!==Math.max(...x.pvRows.slice(c.startIndex,c.endIndex).map(a=>a[3])))fail();
 }
 let latest=-1;for(let i=0;i<31501;i++){while(latest+1<x.completeCycles.length&&x.completeCycles[latest+1].endStep<=i)latest++;if(x.latestCompleteCycleIds[i]!==(latest<0?null:latest))fail();}
 }return d;
}
export const initialState=()=>({step:0,index:0,branch:'effusion',compare:false,speed:30,playing:false,prediction:'',reflection:''});
export const displayIndex=s=>s.step===0?0:s.index;
export const showOutcome=s=>s.step>0&&displayIndex(s)===31500;
export function transition(s,a){switch(a.type){
 case 'prediction':return ['yes','no','unsure'].includes(a.value)?{...s,prediction:a.value}:s;
 case 'skip':return {...s,step:1,playing:false};
 case 'next':return s.step===0&&!s.prediction?s:{...s,step:Math.min(4,s.step+1),compare:s.step===2?true:s.compare,playing:false};
 case 'back':return {...s,step:Math.max(0,s.step-1),playing:false};
 case 'seek':return s.step&&Number.isFinite(a.index)?{...s,index:Math.max(0,Math.min(31500,Math.round(a.index))),playing:false}:s;
 case 'replay':return s.step?{...s,index:0,playing:false}:s;
 case 'play':return s.step?{...s,index:s.index===31500?0:s.index,playing:!s.playing}:s;
 case 'pause':return {...s,playing:false};
 case 'tick':{if(!s.playing||!Number.isFinite(a.count))return s;const index=Math.min(31500,s.index+Math.max(1,Math.floor(a.count)));return {...s,index,playing:index<31500};}
 case 'speed':return [1,10,30].includes(a.value)?{...s,speed:a.value}:s;
 case 'branch':return branches.includes(a.value)?{...s,branch:a.value}:s;
 case 'compare':return s.step>=3?{...s,compare:!s.compare}:s;
 case 'reflection':return {...s,reflection:String(a.value)};
 default:return s;
}}
export const latestCycle=(d,b,i)=>d.branches[b].completeCycles[d.branches[b].latestCompleteCycleIds[i]]??null;
export const axes={cvp:{x:[0,630],y:[0,10],xLabel:'Time (s)',yLabel:'Venous pressure (mmHg)',column:3},co:{x:[0,630],y:[0,7],xLabel:'Time (s)',yLabel:'Cardiac output (L/min)',column:4},pv:{x:[0,160],y:[0,40],xLabel:'Amount in model chamber (mL)',yLabel:'Inside pressure (mmHg)'}};
export function geometry(d,b,kind,index){const x=d.branches[b],a=axes[kind],c=kind==='pv'?latestCycle(d,b,index):null;
 const rows=kind==='pv'?(c?x.pvRows.slice(c.startIndex,c.endIndex):[]):x.trendRows.slice(0,Math.floor(index/50)+1);
 return {points:rows.map(r=>[40+(kind==='pv'?r[3]:r[1])/a.x[1]*520,180-(kind==='pv'?r[2]:r[a.column])/a.y[1]*160]),indices:rows.map(r=>r[0])};
}
export function readRoute(search){const p=new URLSearchParams(search),v=p.get('sample'),n=/^(0|[1-9]\d*)$/.test(v||'')?Number(v):0;return {...initialState(),step:1,index:Number.isSafeInteger(n)&&n<=31500?n:0,branch:branches.includes(p.get('branch'))?p.get('branch'):'effusion',compare:p.get('compare')==='1'};}
export const modelHref=s=>'./pericardial-model.html?'+new URLSearchParams({sample:String(displayIndex(s)),branch:s.branch,compare:s.step>=3&&s.compare?'1':'0'});
