import React, {useEffect, useState, useRef} from 'react';
import {ProjectNavigation} from './ProjectNavigation.jsx';
import {PublicEstateHeader, EstateShell, EstatePageTitle, useEstateTheme} from '@sangeev/estate-ui';
import {validateData, initialState, transition, selectFrame} from './model.mjs';
import {formatValue} from './presentation.mjs';
import {Traces} from './Traces.jsx';
import {ModelDetails} from './ModelDetails.jsx';
import {isModelPath,modelHref,readModelState} from './navigation.mjs';
import {PressureRelationship} from './PressureRelationship.jsx';

const stages = ['Predict', 'Watch', 'Look closer', 'Compare', 'Explain'];
const predictions = {near:'Stay roughly the same', falls:'Fall', rises:'Rise'};
const headings = ['Before you watch', 'Watch the blood pressure', 'What else changed?', 'What if no blood was lost?', 'What did blood pressure miss?'];
const nextLabels = ['Watch blood loss', 'What else changed?', 'Compare with no blood loss', 'Bring it together'];

export function App() {
 const {theme, toggleTheme} = useEstateTheme();
 const [data, setData] = useState(null), [error, setError] = useState(''), [attempt, setAttempt] = useState(0);
 const [modelPage,setModelPage]=useState(()=>isModelPath(window.location.pathname));
 const [lessonState,setLessonState]=useState(initialState);
 const [modelState,setModelState]=useState(()=>({...initialState(),step:3}));
 const previousPage=useRef(modelPage);
 const syncRoute=()=>{
  const model=isModelPath(window.location.pathname);
  setLessonState(s=>({...s,playing:false}));
  if(model&&data)setModelState(readModelState(window.location.search,data));
  setModelPage(model);
 };
 useEffect(()=>{syncRoute();window.addEventListener('popstate',syncRoute);return()=>window.removeEventListener('popstate',syncRoute);},[data]);
 useEffect(()=>{
  document.title=modelPage?'Model details · Glassbox':'Pressure is not volume · Glassbox';
  if(previousPage.current!==modelPage){window.scrollTo(0,0);document.getElementById('page-heading')?.focus();}
  previousPage.current=modelPage;
 },[modelPage]);
 const visit=href=>{window.history.pushState(null,'',href);syncRoute();};
 const follow=(event,href)=>{if(event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;event.preventDefault();visit(href);};
 const modelLink=data?modelHref(selectFrame(data,lessonState),lessonState):'./model.html';
 const openModel=selection=>visit(modelHref(selectFrame(data,lessonState),{...lessonState,selection}));
 useEffect(() => {
  const controller = new AbortController();
  setError(''); setData(null);
  fetch('../evidence/lesson-data.json', {signal:controller.signal, cache:'no-cache'})
   .then(r => {if (!r.ok) throw Error(`Data request failed (${r.status}).`); return r.json();})
   .then(validateData).then(recording=>{setData(recording);if(isModelPath(window.location.pathname))setModelState(readModelState(window.location.search,recording));})
   .catch(e => {if (e.name !== 'AbortError') setError(e.message);});
  return () => controller.abort();
 }, [attempt]);
 return <>
  <a className="skip-link" href="#lesson">{modelPage?'Skip to model details':'Skip to lesson'}</a>
  <PublicEstateHeader navigation="projects" theme={theme} onToggleTheme={toggleTheme}/>
  <EstateShell as="main" variant="wide-app" id="lesson">
   <ProjectNavigation/>
   <div className="lesson-heading">
    <div id="page-heading" tabIndex="-1"><EstatePageTitle variant="app">{modelPage?'Model details':'What happens to blood pressure during blood loss?'}</EstatePageTitle></div>
    <nav className="page-links" aria-label="Lesson and model details">
     {modelPage?<a id="return-to-lesson" href="./" onClick={e=>follow(e,'./')}>Return to lesson</a>:<>
      <a href="#about" onClick={() => {document.getElementById('about').open = true;}}>About this simulation</a>
      <a id="model-details-link" href={modelLink} onClick={e=>follow(e,modelLink)}>Model details</a>
     </>}
    </nav>
   </div>
   {error ? <section role="alert" className="load-state"><h2>We couldn't load the recording</h2><p>No results are shown. Try loading it again.</p><details><summary>Error details</summary><p>{error}</p></details><button onClick={() => setAttempt(n => n + 1)}>Retry data</button></section>
    : !data ? <p role="status" className="load-state">Loading the recording…</p>
    : modelPage?<ModelDetails data={data} state={modelState} frame={selectFrame(data,modelState)} dispatch={a=>setModelState(s=>transition(s,a,data))}/>
    : <Lesson data={data} state={lessonState} setState={setLessonState} onModel={openModel}/>}
   {!modelPage&&<About/>}
  </EstateShell>
 </>;
}

function Lesson({data,state,setState,onModel}) {
 const dispatch = a => setState(s => transition(s, a, data));
 const frame = selectFrame(data, state), predict = state.step === 0;
 const atEnd = frame.index === data.runs.bleed.samples.length - 1;
 useEffect(() => {
  if (!state.playing) return;
  const timer = setInterval(() => setState(s => transition(s, {type:'tick'}, data)), 1000 / state.speed);
  return () => clearInterval(timer);
 }, [state.playing, state.speed, data]);
 useEffect(() => {
  const pause = () => {if (document.hidden) setState(s => ({...s, playing:false}));};
  document.addEventListener('visibilitychange', pause);
  return () => document.removeEventListener('visibilitychange', pause);
 }, []);
 useEffect(() => {if (state.step > 0) document.getElementById('step-heading')?.focus({preventScroll:true});}, [state.step]);
 return <>
  <p className="lesson-progress" aria-label="Lesson progress">{state.step + 1} of 5 · {stages[state.step]}</p>
  <div className="lesson-grid">
   <aside className="instruction" aria-label="Guided instruction">
    <h2 id="step-heading" tabIndex="-1">{headings[state.step]}</h2>
    {predict ? <>
     <p>In this simulation, blood is gradually lost from the circulation.</p>
     <fieldset><legend>What do you expect the blood pressure to do?</legend>
      {Object.entries(predictions).map(([value, text]) => <label className="prediction" key={value}><input type="radio" name="prediction" value={value} checked={state.prediction === value} onChange={() => dispatch({type:'prediction', value})}/><span>{text}</span></label>)}
     </fieldset>
    </> : state.step === 1 ? <>
     <p>Press Play, or move the slider to explore the recording. Does pressure fall as blood volume falls?</p>
     {atEnd && <p className="endpoint-observation">There is less blood in the circulation, but the pressure is still close to where it started.</p>}
    </> : state.step === 2 ? <>
     <p>Stroke volume is the blood pumped with each beat. Cardiac output is the amount pumped each minute.</p>
     <p>Blood pressure also depends on systemic vascular resistance (SVR): how much the body's blood vessels resist blood flow. Greater resistance can help maintain pressure when the heart pumps less.</p>
     {atEnd && <p>The heart is beating faster, but pumping less blood with each beat. The faster rate doesn't make up the difference, so it pumps less blood each minute. Yet the pressure has barely changed. The model raises resistance, which helps explain the steady pressure.</p>}
     <p>Click a part of the equation to see what changed.</p>
    </> : state.step === 3 ? <>
     <p>Both recordings begin with the same model. The dashed lines show what happens without blood loss.</p>
     <p>Compare them at the same time. Which measurements changed most?</p>
    </> : <>
     <p>Blood pressure stayed nearly the same. What changed that you would have missed by looking at pressure alone?</p>
     <label htmlFor="explanation">How would you explain that in your own words?</label>
     <textarea id="explanation" rows="3" value={state.explanation} onChange={e => dispatch({type:'explanation', value:e.target.value})}/>
     <p className="quiet">Optional. Your answer stays in this tab and isn't saved or scored.</p>
    </>}
    <div className="step-actions">
     {!predict && <button id="back" onClick={() => dispatch({type:'back'})}>Back</button>}
     {state.step < 4 && <button id="next" className={predict || atEnd ? 'estate-primary-action' : ''} disabled={predict && !state.prediction && !state.skipped} onClick={() => dispatch({type:'next'})}>{nextLabels[state.step]}</button>}
    </div>
    {predict && <button className="text-button skip-prediction" onClick={() => dispatch({type:'skip'})}>Skip prediction</button>}
   </aside>
   <section className="working-area" aria-label="Recorded model working area" data-index={frame.index} data-step={frame.bleed.step}>
    <div className="workspace-heading"><h2>{predict ? 'Before blood loss' : 'Blood-loss recording'}</h2>{!predict && <span className="time-readout"><strong>{Math.round(frame.bleed.elapsed_s)} s</strong> / {Math.round(data.actualFinalTime_s)} s</span>}</div>
    {state.step >= 2 && <PressureRelationship data={data} state={state} frame={frame} dispatch={dispatch} onModel={()=>onModel('feedback')}/>}
    {!predict && <div className="transport">
     <div className="transport-actions">
      <button id="play" className={atEnd ? '' : 'estate-primary-action'} onClick={() => dispatch({type:'play'})}>{state.playing ? 'Pause' : atEnd ? 'Replay' : 'Play'}</button>
      <button id="end" disabled={atEnd} onClick={() => dispatch({type:'end'})}>See the end</button>
      <label>Speed <select aria-label="Playback speed" value={state.speed} onChange={e => dispatch({type:'speed', value:Number(e.target.value)})}><option value="1">1×</option><option value="10">10×</option><option value="30">30×</option></select></label>
     </div>
     <label className="scrubber" htmlFor="time">Time · {Math.round(frame.bleed.elapsed_s)} seconds<input id="time" type="range" min="0" max={data.runs.bleed.samples.length - 1} step="1" value={state.index} aria-valuetext={`${Math.round(frame.bleed.elapsed_s)} seconds`} onChange={e => dispatch({type:'seek', index:Number(e.target.value)})}/></label>
     {state.step >= 3 && <label className="compare-switch"><input id="compare" type="checkbox" checked={state.compare} onChange={() => dispatch({type:'compare'})}/> Show no blood loss</label>}
    </div>}
    <Traces data={data} state={state} frame={frame} dispatch={dispatch}/>
    {!predict && <p className="sampling">The graphs use different vertical scales; check the numbers as well as the shape.</p>}
    {state.step === 4 && <Explanation data={data} frame={frame}/>}
   </section>
  </div>
 </>;
}

function Explanation({data, frame}) {
 const control = data.runs.control.samples[frame.index];
 return <section className="explanation"><h2>Blood pressure doesn't tell the whole story</h2>
  <p>By the end of this recording, the heart is beating faster but pumping less with each beat. It pumps less blood each minute, yet the pressure has barely changed.</p>
  <p>Greater resistance helps keep pressure up even when less blood is being pumped. In this simulation, rising resistance helps explain why pressure stays close to where it started.</p>
  <details><summary>Compare the numbers at {Math.round(frame.bleed.elapsed_s)} seconds</summary>
   <p>With blood loss, mean arterial pressure is {formatValue(frame.bleed.MAP_mmHg, 'MAP_mmHg')} mmHg and blood volume is {formatValue(frame.bleed.bloodVolume_mL, 'bloodVolume_mL')} mL. Without blood loss, they are {formatValue(control.MAP_mmHg, 'MAP_mmHg')} mmHg and {formatValue(control.bloodVolume_mL, 'bloodVolume_mL')} mL.</p>
  </details>
 </section>;
}

function About() {
 return <details id="about" className="about"><summary>About this simulation</summary>
  <p>This is a teaching prototype using fictional Pulse simulations, not patient data. You are replaying two recordings, not running a live simulation.</p>
  <p>One recording includes steady blood loss at 1.5 mL/s for 550 seconds; the other has none. Both start from the same saved model state. No treatment is given.</p>
 </details>;
}
