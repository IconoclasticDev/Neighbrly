const assert=require('node:assert/strict');
const core=require(process.argv[2]);
const counts=Object.fromEntries(core.METRICS.map(m=>[m.id,0]));
for(const q of core.QUIZ){counts[q.a.m]++;counts[q.b.m]++;}
assert.deepEqual([...new Set(Object.values(counts))],[2]);
const a=core.report(core.AREAS[0],core.DEFAULT_WEIGHTS);
assert.deepEqual([a.score,a.lo,a.hi,a.used],[63,53,68,6]);
const empty=structuredClone(core.AREAS[0]);
Object.values(empty.entries).forEach(e=>e.value=null);
assert.equal(core.score(empty,core.DEFAULT_WEIGHTS).score,null);
assert.equal(core.score(core.AREAS[0],{...core.DEFAULT_WEIGHTS,value:9}).score,null);
assert.equal(core.AREAS[0].price,null);assert.equal(core.AREAS[2].promoter,null);
for(const area of core.AREAS){const r=core.report(area,core.DEFAULT_WEIGHTS);for(const claim of r.summary){const e=r.ledger.find(e=>e.ref===claim.ref);assert.equal(e.metric,claim.metric);assert.ok(claim.text.includes(e.raw));}}
const vectors=[];
for(let bits=0;bits<2**core.QUIZ.length;bits++){
  const weights=core.weightsFromAnswers(core.QUIZ.map((q,i)=>(bits&(1<<i))?q.a.m:q.b.m));
  for(const area of core.AREAS){const {score,lo,hi,used,total,coverage,summary}=core.report(area,weights);vectors.push({area:area.id,weights,result:{score,lo,hi,used,total,coverage,summary}});}
}
if(process.argv[3])require('fs').writeFileSync(process.argv[3],JSON.stringify(vectors));
const stateSize=JSON.stringify(core.AREAS.map(area=>({id:area.id,savedAt:new Date().toISOString(),snapshot:core.report(area,core.DEFAULT_WEIGHTS)}))).length;
assert.ok(stateSize<15000,`Saved state size ${stateSize}`);
console.log(`Core checks passed; generated ${vectors.length} quiz/locality parity vectors. Saved snapshots ${stateSize} bytes.`);
