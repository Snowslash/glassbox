import React from 'react';
import {traceFields, snapIndex} from './model.mjs';
import {chartGeometry, formatValue, labels} from './presentation.mjs';
const descriptions = {
 bloodVolume_mL:'Blood in the circulation',
 MAP_mmHg:'Average pressure over a heartbeat',
 HR_per_min:'Beats per minute',
 strokeVolume_mL:'Blood pumped with each beat'
};
export function Traces({data, state, frame, dispatch}) {
 const predict = state.step === 0;
 const visibleFields = state.step < 2 ? traceFields.slice(0, 2) : traceFields;
 return <section className="traces" aria-label="Synchronized measurements">
  {frame.control && <div className="legend"><span><i className="solid-key"/> Blood loss</span><span><i className="dashed-key"/> No blood loss</span></div>}
  {visibleFields.map(field => {
   const g = chartGeometry(data, field, frame.index, Boolean(frame.control), predict);
   const unit = data.fieldMap.find(m => m.field === field).unit;
   const label = field === 'MAP_mmHg' ? 'Blood pressure (MAP)' : labels[field];
   return <figure key={field} id={`trace-${field}`} tabIndex="-1" className="trace" aria-label={`${label} graph`} data-selected={state.step >= 2 && state.trace === field} data-field={field} data-index={frame.index}>
    <figcaption><h3 className="trace-title">{label}</h3><span className="trace-value" data-value={frame.bleed[field]}>{formatValue(frame.bleed[field], field)} <small>{unit}</small></span></figcaption>
    <p className="trace-meaning">{descriptions[field]}</p>
    {frame.control && <p className="control-value" data-value={frame.control[field]}>No blood loss: {formatValue(frame.control[field], field)} {unit}</p>}
    <div className="plot">
     <div className="y-ticks" aria-hidden="true">{[g.max, (g.min + g.max) / 2, g.min].map((v, i) => <span key={i}>{formatValue(v, field)}</span>)}</div>
     <svg className="chart" viewBox="0 0 600 125" preserveAspectRatio="none" role="img" aria-label={`${label}, ${unit}. ${predict ? 'Starting value only.' : 'Click to choose a time. You can also use the time slider.'}`} onPointerDown={e => {
      if (predict) return;
      const r = e.currentTarget.getBoundingClientRect();
      const fraction = ((e.clientX - r.left) / r.width * 600 - 50) / 520;
      dispatch({type:'seek', index:snapIndex(fraction, data.runs.bleed.samples.length)});
     }}>
      <path className="gridline" d="M50 16H570 M50 61H570 M50 106H570"/>
      {g.control && <polyline className="control-line" points={g.control}/>}
      <polyline className="bleed-line" points={g.bleed}/>
      <line className="cursor" x1={g.cursor} x2={g.cursor} y1="10" y2="112"/>
      <circle className="sample-dot" cx={g.cursor} cy={g.pointY} r="3.5"/>
      {g.controlPointY !== null && <circle className="control-dot" cx={g.cursor} cy={g.controlPointY} r="3.5"/>}
     </svg>
    </div>
    <div className="axis-labels">{predict ? <span>Starting value</span> : <><span>0 s</span><span>{Math.round(data.actualFinalTime_s)} s</span></>}</div>
    {predict && <p className="trace-curtain">Make your prediction to see what happens.</p>}
   </figure>;
  })}
 </section>;
}
