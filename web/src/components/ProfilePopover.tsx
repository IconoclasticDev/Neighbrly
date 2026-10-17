import React, {useEffect,useRef,useState} from 'react';
import {AppIcon} from './AppIcon';

export function ProfilePopover({savedCount,onSaved,onPriorities,onSettings}:{savedCount:number;onSaved:()=>void;onPriorities:()=>void;onSettings:()=>void}) {
  const [open,setOpen]=useState(false);
  const wrapper=useRef<HTMLDivElement>(null),trigger=useRef<HTMLButtonElement>(null),panel=useRef<HTMLDivElement>(null);
  useEffect(()=>{
    if(!open)return;
    panel.current?.querySelector<HTMLButtonElement>('button')?.focus();
    const outside=(event:PointerEvent)=>{if(!wrapper.current?.contains(event.target as Node))setOpen(false);};
    const escape=(event:KeyboardEvent)=>{if(event.key==='Escape'){event.preventDefault();setOpen(false);trigger.current?.focus();}};
    document.addEventListener('pointerdown',outside);document.addEventListener('keydown',escape);
    return()=>{document.removeEventListener('pointerdown',outside);document.removeEventListener('keydown',escape);};
  },[open]);
  const navigate=(action:()=>void)=>{setOpen(false);action();};
  return <div className="nb-profile" ref={wrapper} onBlur={event=>{if(event.relatedTarget&&!event.currentTarget.contains(event.relatedTarget as Node))setOpen(false);}}>
    <button ref={trigger} className="nb-avatar" aria-label="Your profile" aria-haspopup="dialog" aria-expanded={open} aria-controls={open?'nb-profile-popover':undefined} onClick={()=>setOpen(value=>!value)}>You</button>
    {open&&<div className="nb-profile-popover" id="nb-profile-popover" ref={panel} role="dialog" aria-labelledby="nb-profile-title">
      <div className="nb-profile-heading"><span className="nb-profile-monogram" aria-hidden="true">You</span><div><h2 id="nb-profile-title">Your space</h2><p>Your next home, your priorities.</p></div></div>
      <div className="nb-profile-links">
        <button onClick={()=>navigate(onSaved)}><AppIcon name="bookmark" size={18}/><span>Saved reports</span><small>{savedCount}</small></button>
        <button onClick={()=>navigate(onPriorities)}><AppIcon name="priorities" size={18}/><span>My priorities</span><span aria-hidden="true">→</span></button>
        <button onClick={()=>navigate(onSettings)}><AppIcon name="settings" size={18}/><span>Settings & data</span><span aria-hidden="true">→</span></button>
      </div>
      <p className="nb-profile-note">Preferences and saved reports stay on this device. No account required.</p>
    </div>}
  </div>;
}
