import React,{createContext,useContext,useEffect,useRef,useState} from 'react';
import {Alert} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {DEFAULT_WEIGHTS,Weights} from './score';
import {AREAS,METRICS} from './data';
type State={weights:Weights;quizDone:boolean;saved:string[]};
const KEY='neighbrly.v2';
const init:State={weights:{...DEFAULT_WEIGHTS},quizDone:false,saved:[]};
type Ctx=State&{ready:boolean;setWeights:(w:Weights)=>void;toggleSaved:(id:string)=>void;reset:()=>void};
const C=createContext<Ctx>({...init,ready:false,setWeights:()=>{},toggleSaved:()=>{},reset:()=>{}});
export const useApp=()=>useContext(C);
function validate(v:any):State{if(!v||typeof v!=='object')return init;return {weights:METRICS.every(m=>Number.isFinite(v.weights?.[m.id])&&v.weights[m.id]>=1&&v.weights[m.id]<=9)?Object.fromEntries(METRICS.map(m=>[m.id,v.weights[m.id]])):{...DEFAULT_WEIGHTS},quizDone:v.quizDone===true,saved:Array.isArray(v.saved)?v.saved.filter((id:unknown)=>AREAS.some(a=>a.id===id)):[]};}
export function AppProvider({children}:{children:React.ReactNode}){
  const [s,setS]=useState<State>(init),[ready,setReady]=useState(false);const state=useRef(s);const queue=useRef(Promise.resolve());
  useEffect(()=>{AsyncStorage.getItem(KEY).then(v=>{const n=validate(v?JSON.parse(v):null);state.current=n;setS(n);}).catch(()=>Alert.alert('Preferences unavailable','We could not read saved preferences. You can continue with equal weights.')).finally(()=>setReady(true));},[]);
  function save(n:State){state.current=n;setS(n);queue.current=queue.current.then(()=>AsyncStorage.setItem(KEY,JSON.stringify(n))).catch(()=>{Alert.alert('Could not save','Your changes work for this session but may not survive closing the app. Try again when device storage is available.');});}
  return <C.Provider value={{...s,ready,setWeights:w=>save({...state.current,weights:w,quizDone:true}),toggleSaved:id=>save({...state.current,saved:state.current.saved.includes(id)?state.current.saved.filter(x=>x!==id):[...state.current.saved,id]}),reset:()=>save({...init,weights:{...DEFAULT_WEIGHTS}})}}>{children}</C.Provider>;
}
