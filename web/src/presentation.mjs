export const traceSemantics={MAP_mmHg:'Last completed-cycle mean',strokeVolume_mL:'Last completed-cycle integral',HR_per_min:'Heart-driver frequency',bloodVolume_mL:'Net circulating volume'};
export const labels={bloodVolume_mL:'Blood volume',MAP_mmHg:'Mean arterial pressure',HR_per_min:'Heart rate',strokeVolume_mL:'Stroke volume'};
export function formatValue(value,field='') {
 if(!Number.isFinite(value)) throw new Error('Invalid recorded value');
 const digits=field==='bloodVolume_mL'?0:field.startsWith('baro')?3:1;
 return value.toLocaleString('en-GB',{minimumFractionDigits:digits,maximumFractionDigits:digits});
}
export function chartGeometry(data,field,index,compare,predict=false) {
 const bleed=data.runs.bleed.samples, control=data.runs.control.samples;
 const values=predict?[bleed[0][field]]:[...bleed,...control].map(r=>r[field]);
 const low=Math.min(...values),high=Math.max(...values), pad=Math.max((high-low)*0.12,Math.abs(low)*0.005,0.1);
 const min=Math.floor((low-pad)*10)/10,max=Math.ceil((high+pad)*10)/10;
 const x=i=>50+i/(bleed.length-1)*520,y=v=>16+(max-v)/(max-min)*90;
 // Keep scales fixed across playback; reveal only through the selected sample.
 const visibleCount=predict?1:index+1;
 const points=rows=>rows.slice(0,visibleCount).map((r,i)=>`${x(i).toFixed(2)},${y(r[field]).toFixed(2)}`).join(' ');
 return {min,max,cursor:x(index),pointY:y(bleed[index][field]),controlPointY:compare&&!predict?y(control[index][field]):null,bleed:points(bleed),control:compare&&!predict?points(control):''};
}
export function validateGate(checks,review) {
 const names=['control_finite','control_loss_integral','control_resistance','control_schedule','bleed_finite','bleed_loss_integral','bleed_resistance','bleed_schedule','repeat_finite','repeat_loss_integral','repeat_resistance','repeat_schedule','restore_finite','restore_loss_integral','restore_resistance','restore_schedule','repeat','restart','matched_baseline','runtime_validity','actions_repeat','actions_restore','restored_initial_actions','active_checkpoint','schema_mapping'];
 if(checks?.numeric_status!=='PASS'||review?.status!=='PASS'||names.some(k=>checks[k]?.pass!==true)) throw new Error('Engine gate is not PASS');
 return true;
}
