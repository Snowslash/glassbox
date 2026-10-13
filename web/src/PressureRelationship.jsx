import React from 'react';
import {formatValue} from './presentation.mjs';
const terms=[
 {term:'MAP',name:'Mean arterial pressure',short:'Pressure',field:'MAP_mmHg',unit:'mmHg'},
 {term:'HR',name:'Heart rate',short:'Heart rate',field:'HR_per_min',unit:'beats/min'},
 {term:'SV',name:'Stroke volume',short:'Stroke volume',field:'strokeVolume_mL',unit:'mL/beat'}
];
export function PressureRelationship({data,state,frame,dispatch,onModel}){
 const baseline=data.runs.bleed.samples[0];
 const focusTrace=field=>{dispatch({type:'trace',value:field});document.getElementById(`trace-${field}`)?.focus();};
 return <section id="pressure-relationship" className="pressure-relationship" aria-label="Pressure relationship" data-index={frame.index}>
  <div className="pressure-equation" role="group" aria-label="Mean arterial pressure approximately equals heart rate times stroke volume times systemic vascular resistance">
   {terms.map(({term,name,short,field,unit},i)=><React.Fragment key={term}>
    {i>0&&<span className="operator" aria-hidden="true">{i===1?'≈':'×'}</span>}
    <button data-term={term} aria-label={`${term} · ${name}: show graph`} aria-controls={`trace-${field}`} aria-pressed={state.trace===field} onClick={()=>focusTrace(field)}>
     <strong>{term}</strong><span className="term-name">{short}</span>
     <span className="term-value" data-value={frame.bleed[field]}>{formatValue(frame.bleed[field],field)}<small>{unit}</small></span>
    </button>
   </React.Fragment>)}
   <span className="operator" aria-hidden="true">×</span>
   <button data-term="SVR" aria-label="SVR · Systemic vascular resistance: open Model details" onClick={onModel}>
    <strong>SVR</strong><span className="term-name">Systemic resistance</span><span className="term-action">Model details</span>
   </button>
  </div>
  <p className="cardiac-output"><strong>CO = HR × SV</strong> — Cardiac output: <strong data-co="bleed" data-value={frame.bleed.CO_mL_per_min}>{(frame.bleed.CO_mL_per_min/1000).toFixed(2)} L/min</strong> <span className="co-reference">(started at <span data-co="baseline">{(baseline.CO_mL_per_min/1000).toFixed(2)} L/min</span>)</span>
   {frame.control&&<span className="co-control">No blood loss at this time: <span data-co="control" data-value={frame.control.CO_mL_per_min}>{(frame.control.CO_mL_per_min/1000).toFixed(2)} L/min</span></span>}
  </p>
  <details className="pressure-assumptions"><summary>Why approximately?</summary>
   <p><strong>MAP − CVP = CO × SVR.</strong> CVP is mean central venous pressure: the average pressure in the large veins near the heart. We leave it out of the shorter equation when it is small compared with arterial pressure.</p>
   <p>With heart rate in beats/min and stroke volume in mL/beat, HR × SV gives mL/min. Divide by 1000 for L/min; pair that with SVR in mmHg·min/L.</p>
  </details>
 </section>;
}
