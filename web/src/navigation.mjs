import {initialState,compartments,traceFields} from './model.mjs';
import {isModelRoute} from './model-route.mjs';
const selections=[...compartments,'path','feedback'];
export const isModelPath=pathname=>isModelRoute(pathname,'model');
export function modelHref(frame,state){
 const params=new URLSearchParams({sample:String(frame.index),compare:frame.control?'1':'0',selection:selections.includes(state.selection)?state.selection:'Aorta',trace:traceFields.includes(state.trace)?state.trace:traceFields[0]});
 return './model.html?'+params;
}
export function readModelState(search,data){
 const params=new URLSearchParams(search),raw=params.get('sample');
 const index=/^(0|[1-9]\d*)$/.test(raw??'')?Number(raw):0;
 return {...initialState(),step:3,index:Number.isSafeInteger(index)&&index<data.runs.bleed.samples.length?index:0,compare:params.get('compare')==='1',selection:selections.includes(params.get('selection'))?params.get('selection'):'Aorta',trace:traceFields.includes(params.get('trace'))?params.get('trace'):traceFields[0]};
}
