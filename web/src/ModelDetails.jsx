import React from 'react';
import {COMMIT,traceFields} from './model.mjs';
import {formatValue,labels} from './presentation.mjs';
import {Schematic,Inspector} from './Inspector.jsx';
const resistanceFields=[['baroResistanceScale','Resistance setting','multiplier'],['path_R_mmHg_s_per_mL','Right-leg route resistance','mmHg·s/mL']];
const svrSource=`https://gitlab.kitware.com/physiology/engine/-/blob/${COMMIT}/src/cpp/engine/common/system/physiology/CardiovascularModel.cpp#L1613`;

export function ModelDetails({data,state,frame,dispatch}){
 const baseline=data.runs.bleed.samples[0],co=data.fieldMap.find(m=>m.field==='CO_mL_per_min');
 const inspect=selection=>{dispatch({type:'selection',value:selection});document.getElementById('model-inspector')?.focus();};
 return <article id="model-page" className="model-page" data-index={frame.index} data-step={frame.bleed.step}>
  <p>Recorded values at <strong>{Math.round(frame.bleed.elapsed_s)} seconds</strong>{frame.control?' · blood loss and matched no-blood-loss comparison': ' · blood-loss recording'}. Return to the lesson to choose a different time.</p>
  <section id="model-calculations">
   <h2>How Pulse calculates these values</h2>
   <p>MAP and stroke volume refer to the last completed heartbeat. Cardiac output comes straight from the recording; we haven't worked it out from the rounded numbers on screen. <a href={co.source}>How Pulse calculates cardiac output</a>.</p>
   <p>Pulse works out its reported SVR by dividing pressure difference by cardiac output. That tells us how the numbers fit together, not why they changed. Several responses change together, so this comparison can't tell us how much each response helped. <a href={svrSource}>How Pulse calculates SVR</a>.</p>
  </section>
  <section id="resistance-evidence" className="resistance-evidence">
   <h2 id="resistance-heading">Resistance values</h2>
   <p>These recordings have no overall SVR value. Below are the model's resistance setting and one route through the right leg, not overall SVR.</p>
   <table className="values resistance-values"><thead><tr><th scope="col">Model value</th><th scope="col">Start</th><th scope="col">Blood loss<br/>{Math.round(frame.bleed.elapsed_s)} s</th>{frame.control&&<th scope="col">No blood loss<br/>{Math.round(frame.control.elapsed_s)} s</th>}</tr></thead>
    <tbody>{resistanceFields.map(([field,label,unit])=><tr key={field} data-field={field}>
     <th scope="row"><a href={data.fieldMap.find(m=>m.field===field).source}>{label}</a><small>{unit}</small></th>
     <td data-run="baseline" data-value={baseline[field]}>{formatValue(baseline[field],field)}</td>
     <td data-run="bleed" data-value={frame.bleed[field]}>{formatValue(frame.bleed[field],field)}</td>
     {frame.control&&<td data-run="control" data-value={frame.control[field]}>{formatValue(frame.control[field],field)}</td>}
    </tr>)}</tbody>
   </table>
   <p>The setting is a multiplier used by the model, not a measurement from a person.</p>
   <div className="resistance-actions"><button onClick={()=>inspect('feedback')}>See the model's response</button><button onClick={()=>inspect('path')}>See the individual path</button></div>
  </section>
  <section id="model-inspection">
   <h2>Inside the model</h2>
   <p className="model-intro">The model responds to falling pressure by making the heart beat faster and more strongly, increasing resistance and changing how easily the veins expand.</p>
   <div className="optional-model"><Schematic state={state} frame={frame} dispatch={dispatch}/><Inspector data={data} state={state} frame={frame}/></div>
   <TraceNote data={data} field={state.trace} dispatch={dispatch}/>
   <details className="sample-evidence"><summary>Recording details</summary>
    <p>Sample index {frame.index} · original solver step {frame.bleed.step} · actual time <code>{String(frame.bleed.time_s)} s</code>. {frame.control?'Control and blood loss use the identical time index.':'Blood-loss run selected.'}</p>
    <p>Original samples are selected every 1 s from 0.02 s native output. Lines connect samples; displayed values are not interpolated. These observations are not full engine checkpoints.</p>
    <a href="../evidence/lesson-data.json">Original recording data (JSON)</a> · <a href="../evidence/field-map.json">Field mapping & source links</a>
   </details>
  </section>
  <section id="model-assumptions">
   <h2>Assumptions and limitations</h2>
   <p>This is a teaching prototype using fictional Pulse simulations, not patient data. You are inspecting recordings, not running a live simulation.</p>
   <p>One recording includes steady blood loss at 1.5 mL/s for 550 seconds; the other has none. Both start from the same saved model state. No treatment is given.</p>
   <p>The displayed blood pressure is mean arterial pressure (MAP), averaged over the last completed heartbeat. Stroke volume also refers to the last completed heartbeat. Heart rate is the rate set by the model. Values inside the circulation diagram are snapshots: the two hearts may be at different points in a beat, even at the same time on the recording.</p>
   <p>The blood-loss rate is prescribed: it does not fall when pressure falls. Reported external loss differs from the change in circulating volume because other fluid exchanges also affect volume. Pulse's loss counter uses the preceding circuit flow, with a one-step lag.</p>
   <p>The four compartments are selected parts of the model, not a complete anatomical circulation. Their volumes must not be added together. The model has no atria.</p>
   <p>The local numerical, repeatability and checkpoint tests passed for this scenario. They check the software, not whether every model quantity accurately represents human physiology. The two recordings do not isolate the contribution of each feedback mechanism.</p>
   <p>Known upstream warnings and issues were reviewed for this experiment. Other scenarios and APIs need their own review.</p>
  </section>
  <section id="model-sources">
   <h2>Sources, checks and licences</h2>
   <div className="evidence-links"><a href="../evidence/checks.json">Numerical checks</a><a href="../evidence/review.json">Independent gate review</a><a href="../evidence/annotated-state.md">Annotated result & sources</a><a href="../evidence/warnings-review.md">Warning review</a><a href="../evidence/build-provenance.json">Build provenance & hashes</a><a href="../licenses/OFL-Literata.txt">Literata licence</a><a href="../licenses/OFL-Atkinson-Hyperlegible-Next.txt">Atkinson licence</a></div>
   <p className="quiet">Pulse REL_4_4_0 · commit {COMMIT} · fictional StandardMale model PG–01. Estate UI 2.0.0-alpha.7.</p>
  </section>
 </article>;
}
function TraceNote({data,field,dispatch}){
 const m=data.fieldMap.find(m=>m.field===field);
 const meaning={bloodVolume_mL:'Blood in the circulation at the selected time.',MAP_mmHg:'Average arterial pressure over the last completed heartbeat.',HR_per_min:'The heart rate set by the model at the selected time.',strokeVolume_mL:'Blood pumped during the last completed heartbeat.'};
 return <section className="trace-note" aria-label="Selected trace meaning">
  <label>Measurement details <select aria-label="Measurement details" value={field} onChange={e=>dispatch({type:'trace',value:e.target.value})}>{traceFields.map(f=><option key={f} value={f}>{labels[f]}</option>)}</select></label>
  <p>{meaning[field]}</p>
  <details><summary>Technical definition and source</summary><p>{m.semantics}.</p><code>{m.identifier}</code><p><a href={m.source}>Calculation in the source code</a></p></details>
 </section>;
}
