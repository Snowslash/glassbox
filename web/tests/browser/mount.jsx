// Test-only mount/unmount surface; never an application build entrypoint.
import React, {useState} from 'react';
import {createRoot} from 'react-dom/client';
import {App} from '../../src/App.jsx';
import {OxygenApp} from '../../src/OxygenApp.jsx';
import {RespiratoryApp} from '../../src/RespiratoryApp.jsx';
import {PericardialApp} from '../../src/PericardialApp.jsx';
const lessons = {pressure: App, oxygen: OxygenApp, respiratory: RespiratoryApp, pericardial: PericardialApp};
function Fixture() {
  const [lesson, setLesson] = useState('pressure');
  const Lesson = lessons[lesson];
  return <><nav>{[...Object.keys(lessons), 'unmount'].map(name => <button key={name} data-mount={name} onClick={() => setLesson(name)}>{name}</button>)}</nav>{Lesson && <Lesson key={lesson}/>}</>;
}
// Keep the same relative recording URLs as the production /app/ documents.
history.replaceState(null, '', '/app/lifecycle-fixture');
createRoot(document.getElementById('fixture')).render(<Fixture/>);
