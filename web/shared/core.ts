import data from './demo.json';
export const METRICS=data.metrics;
export const QUIZ=data.quiz;
export const AREAS=data.areas;
export type MetricId=typeof METRICS[number]['id'];
export type Weights=Record<string,number>;
export type Area=typeof AREAS[number];
export const DEFAULT_WEIGHTS:Weights=Object.fromEntries(METRICS.map(m=>[m.id,1]));
export function weightsFromAnswers(answers:string[]):Weights {
  const w={...DEFAULT_WEIGHTS};for(const m of answers){if(!(m in w))throw Error('Unknown metric');w[m]++;}return w;
}
export function score(area:Area,w:Weights){
  let num=0,known=0,total=0,used=0;
  for(const m of METRICS){const weight=w[m.id];if(!Number.isFinite(weight)||weight<=0||weight>9)throw Error('Invalid weights');total+=weight;const v=area.entries[m.id as keyof typeof area.entries].value;if(v!==null){known+=weight;num+=weight*v;used++;}}
  const coverage=known/total;
  return {score:used>=3&&coverage>=.5?Math.round(num/known):null,lo:Math.floor(num/total),hi:Math.ceil((num+100*(total-known))/total),used,total:METRICS.length,coverage:Math.round(100*coverage)};
}
export const band=(v:number|null)=>v===null?'Insufficient data':v>=75?'Strong':v>=55?'Mixed':'Weak';
export const tone=(v:number|null)=>v===null?'missing':v>=75?'good':v>=55?'caution':'risk';
export function summary(area:Area,w:Weights){return METRICS.map(m=>({m,e:area.entries[m.id as keyof typeof area.entries]})).filter(r=>r.e.value!==null).sort((a,b)=>w[b.m.id]*Math.abs(b.e.value!-60)-w[a.m.id]*Math.abs(a.e.value!-60)).slice(0,3).map(({m,e})=>({text:`${m.label} ${e.value!>=75?'is a strength':e.value!>=55?'is mixed':'needs a closer look'}: ${e.raw} (score ${e.value}).`,ref:e.ref,metric:m.id}));}
export function checklist(area:Area,w:Weights){return [...METRICS].sort((a,b)=>w[b.id]-w[a.id]).flatMap(m=>{const e=area.entries[m.id as keyof typeof area.entries];return e.value===null?[{id:m.id,title:`Verify ${m.label.toLowerCase()}`,text:`No data yet. ${m.verify}`}]:e.value<55?[{id:m.id,title:`Check ${m.label.toLowerCase()}`,text:m.verify}]:[]}).concat([{id:'rera',title:'Check project registration',text:'Ask for the RERA registration number and read the project complaint history.'},{id:'deeds',title:'Ask for registered deals',text:'Compare recent registered sale deeds with the asking price for the same building and property type.'}]);}
export function report(area:Area,w:Weights){return {areaId:area.id,areaName:area.name,demo:true,methodVersion:'demo-bounds-v2',asOf:'2026-10-01',...score(area,w),ledger:METRICS.map(m=>({metric:m.id,label:m.label,...area.entries[m.id as keyof typeof area.entries]})),summary:summary(area,w),checklist:checklist(area,w)};}
export * from './mapData';
