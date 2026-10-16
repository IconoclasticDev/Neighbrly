const fs=require('node:fs');
const assert=require('node:assert/strict');
const {JSDOM,VirtualConsole}=require('jsdom');
const input=process.argv[2]; if(!input)throw Error('Pass the inline fragment path.');
const fragment=fs.readFileSync(input,'utf8');
const errors=[];const vc=new VirtualConsole();
vc.on('jsdomError',e=>{if(!e.message.includes('Could not parse CSS stylesheet'))errors.push(e.message)});
const dom=new JSDOM(fragment,{runScripts:'dangerously',url:'https://test.invalid/',pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){w.ResizeObserver=class{observe(){}disconnect(){}};w.SVGSVGElement.prototype.createSVGRect=()=>({});}});
const w=dom.window,d=w.document;
const settle=()=>new Promise(r=>setTimeout(r,40));
const txt=()=>d.querySelector('#nb-product')?.textContent||'';
async function click(text){const b=[...d.querySelectorAll('button')].find(b=>b.textContent.trim()===text);assert.ok(b,`Button missing: ${text}`);b.click();await settle();}
async function clickPart(text){const b=[...d.querySelectorAll('button')].find(b=>b.textContent.includes(text));assert.ok(b,`Button missing: ${text}`);b.click();await settle();}
(async()=>{
 await settle();assert.match(txt(),/Before you sign/);
 await click('Explore the demo first ↗');assert.equal(d.querySelectorAll('.nb-area').length,3);assert.ok(d.querySelectorAll('.leaflet-overlay-pane path').length>=24,'Ward geometry should render');
 await clickPart('Demo Locality A');assert.match(txt(),/Missing-data bounds/);assert.match(txt(),/53–68/);
 await click('♡ Save report');assert.match(txt(),/♥ Saved/);
 await clickPart('Price Reality Check');assert.match(txt(),/No data yet/);
 await click('← Demo Locality A');await clickPart('Air quality');assert.match(txt(),/Invented demonstration dataset/);
 await click('← Demo Locality A');await clickPart('Your visit checklist');const checkbox=d.querySelector('input[type=checkbox]');checkbox.click();await settle();assert.match(txt(),/1 of/);
 await clickPart('Compare');assert.equal(d.querySelectorAll('select').length,2);
 await clickPart('My priorities');for(let i=0;i<7;i++){const option=d.querySelector('.nb-options button');assert.ok(option);option.click();await settle();}assert.match(txt(),/These reports reflect your priorities/);
 await click('Android layout');assert.ok(d.querySelector('.nb-phone'));
 await clickPart('Demo Locality B');await click('Share ↗');assert.match(d.querySelector('[aria-label="Shareable report text"]').value,/DEMO DATA/);assert.match(d.querySelector('[aria-label="Shareable report text"]').value,/Invented demonstration dataset/);
 d.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));await settle();assert.equal(d.querySelector('[role=dialog]'),null);
 await clickPart('Price Reality Check');const input=d.querySelector('input[type=number]');assert.equal(input.value,'21800');assert.match(txt(),/9% above/);
 await clickPart('Saved reports');assert.match(txt(),/Demo Locality A/);assert.match(txt(),/Saved/);
 const saved=JSON.parse(w.localStorage.getItem('neighbrly.preview.v2'));assert.equal(saved.saved.length,1);assert.equal(Object.values(saved.checks).filter(Boolean).length,1);assert.equal(saved.quizDone,true);assert.equal(saved.device,'phone');
 await click('You');await click('Clear preferences & saved data');assert.ok(d.querySelector('[role=dialog]'));await click('Keep my data');assert.equal(d.querySelector('[role=dialog]'),null);
 assert.deepEqual(errors,[]);console.log('PASS: welcome, map geometry, report, save, missing price, evidence, checklist, compare, 7-question quiz, phone layout, share dialog, price input, saved state, reset cancellation; no runtime errors.');dom.window.close();
})().catch(e=>{console.error(e);dom.window.close();process.exitCode=1;});
