// Everything on the project page that is specific to Glassbox. The layout lives in ProjectPage.
/** @type {import('./ProjectPage').ProjectPageData} */
export const project={
 key:'glassbox',
 name:'Glassbox',
 tagline:'Predict, then watch the physiology',
 description:'Predict what happens, watch a recorded physiology experiment, then see what changed and why.',
 why:'Numbers like blood pressure and oxygen saturation can look fine while what they stand for has changed. That’s easier to see happen than to be told.',
 actions:[{label:'Open the lab',href:'./lab.html'}],
 sourceHref:'https://github.com/Snowslash/glassbox',
 licencesHref:'./licences.html',
 beforeYouUse:[
  'The experiments are made-up cases, recorded in advance with a physiology simulator. The lab plays them back rather than running new ones.',
  'Each lesson has a page explaining what the model assumes and where it falls short.',
  'Your answers stay in this tab. Nothing is saved except whether you prefer light or dark.',
 ],
 shotsNote:'A lesson part-way through its recording.',
 shots:[
  {
   src:'./images/pressure-comparison.png',
   alt:'The blood-loss lesson, with charts of blood volume, blood pressure, heart rate and the blood pumped by each beat, each set against a recording with no blood loss.',
   width:1132,
   height:991,
   caption:'The blood-loss lesson: blood volume, blood pressure, heart rate and how much blood each beat pumps, side by side with a recording where no blood is lost.',
  },
 ],
 capabilities:[
  ['Pressure is not volume','Follow blood loss and see why blood pressure alone can’t tell you how much blood is left.'],
  ['Saturation is not delivery','See why oxygen saturation can stay high even when less oxygen reaches the tissues.'],
  ['Where does the breath go?','See how breathing changes when the airways narrow or the lungs get harder to inflate.'],
 ],
 limits:'It’s for learning how the physiology works, not for clinical decisions.',
};
