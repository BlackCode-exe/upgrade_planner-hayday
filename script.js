/* ===== Config ===== */
const TOOLSETS = {
  barn: ["Bolt","Plank","Duct Tape"],
  silo: ["Nail","Screw","Wood Panel"],
  expansion: ["Land Deed","Mallet","Marker Stake"]
};
let mode = "barn";

/* ===== Capacity ===== */
function reqFromCapacity(cap){
  const t = Number(cap);
  if(!Number.isFinite(t)) return null;
  if (t>=75 && t<=1000 && (t-75)%25===0)  return 1 + (t-75)/25;       // 75→1 … 1000→38
  if (t>=1050 && t<=25000 && (t-1050)%50===0) return 39 + (t-1050)/50; // 1050→39 … 25000→518
  return null;
}

/* ===== Distribution day  ===== */
function dayRaiseBalanced(cur, targetEach, cap=89){
  const n = cur.length;
  const deficit = cur.reduce((s,v)=>s+Math.max(0,targetEach-v),0);
  if (deficit===0) return {adds:[0,0,0],used:0,after:cur.slice(),slots:[]};
  const budget = Math.min(cap, deficit);

  const lo = Math.max(...cur), hi = targetEach;
  let L=lo, R=hi, best=lo;
  const need=(T)=>cur.reduce((s,v)=>s+Math.max(0,Math.min(T,targetEach)-v),0);
  while(L<=R){
    const mid = (L+R)>>1;
    if (need(mid) <= budget){ best=mid; L=mid+1; } else { R=mid-1; }
  }
  const adds = cur.map(v=>Math.max(0,Math.min(best,targetEach)-v));
  let used = adds.reduce((s,v)=>s+v,0);
  let room = budget-used;
  if(room>=n){
    const extra = Math.min(Math.floor(room/n), targetEach-best);
    if(extra>0){ for(let i=0;i<n;i++) adds[i]+=extra; used+=extra*n; }
  }
  const after = cur.map((v,i)=>v+adds[i]);

  // Build slots ≤10 each, round-robin
  const names = TOOLSETS[mode]; const left=adds.slice(); const slots=[];
  while(left.reduce((s,v)=>s+v,0)>0){
    for(let i=0;i<n;i++){
      if(left[i]>0){
        const take = Math.min(10,left[i]); left[i]-=take;
        slots.push({tool:names[i], amount:take});
      }
    }
  }
  return {adds,used,after,slots};
}
function fullPlan(initial, targetEach){
  const steps=[]; let cur=initial.slice(); let day=1;
  while(cur.some(v=>v<targetEach)){
    const step = dayRaiseBalanced(cur, targetEach, 89);
    if(step.used===0) break;
    steps.push({day, ...step, start:cur.slice(), targetEach});
    cur=step.after.slice(); day++;
  }
  return steps;
}

/* ===== UI ===== */
const el = (id)=>document.getElementById(id);
const ids = {target:'target',a:'t0',b:'t1',c:'t2'};
function isBlank(x){ return (x==="" || x===null || typeof x==="undefined"); }
function readNum(id){ const v=el(id).value; if(isBlank(v)) return null; const n=+v; return Number.isFinite(n)?Math.max(0,Math.floor(n)):0; }
function allProvided(){ return ![ids.a,ids.b,ids.c].some(id=>isBlank(el(id).value)); }

function setMode(newMode){
  mode = newMode;
  // tabs
  ["barn","silo","expansion"].forEach(m => el(`tab-${m}`).setAttribute("aria-pressed", String(m===mode)));
  // labels
  const [A,B,C] = TOOLSETS[mode];
  el('lbl-a').textContent = A; el('lbl-b').textContent = B; el('lbl-c').textContent = C;
  el('hint-mode').textContent =
    mode==='barn' ? 'Barn: Bolt, Plank, Duct Tape.' :
    mode==='silo' ? 'Silo: Nail, Screw, Wood Panel.' :
                    'Expansion: Land Deed, Mallet, Marker Stake.';
  // target label & placeholder
  if(mode==='expansion'){ el('lbl-target').textContent='Target tool'; el('target').placeholder='e.g., 65'; }
  else{ el('lbl-target').textContent='Target Capacity'; el('target').placeholder='e.g., 1000 or 1050'; }
  // clear outputs
  el('out').style.display='none'; el('kpi').style.display='none'; el('msg').textContent='';
}
['barn','silo','expansion'].forEach(m => el(`tab-${m}`).addEventListener('click', ()=>setMode(m)));

function clearAll(){
  [ids.target, ids.a, ids.b, ids.c].forEach(id => el(id).value = '');
  el('out').style.display='none'; el('kpi').style.display='none'; el('msg').textContent='';
}
function preset(){
  // small friendly demo
  if(mode!=='expansion'){ el(ids.target).value = 1000; } else { el(ids.target).value = 65; }
  el(ids.a).value = 3; el(ids.b).value = 5; el(ids.c).value = 4;
}

function renderDayNode(node, names){
  const slots = node.slots.map((s,i)=>`<tr><td>${i+1}</td><td>${s.tool}</td><td>${s.amount}</td></tr>`).join('');
  const track = [0,1,2].map(i=>`
    <tr>
      <td>${names[i]}</td>
      <td>${node.start[i]}</td>
      <td>${node.adds[i]}</td>
      <td>${node.after[i]}</td>
      <td>${Math.max(0,node.targetEach-node.after[i])}</td>
      <td>${node.targetEach}</td>
      <td>${node.after[i]===node.targetEach?'✓':''}</td>
    </tr>`).join('');
  return `
  <details ${node.day===1?'open':''}>
    <summary>Day ${node.day}<span class="badge">Used: ${node.used}/89</span><span class="badge">End total: ${node.after[0]} each</span></summary>
    <div style="margin-top:8px">
      <div class="subtle">📦 Distribution Slots</div>
      <table><thead><tr><th>Slot</th><th>Tool</th><th>Amount</th></tr></thead>
        <tbody>${slots || `<tr><td colspan="3">No distribution</td></tr>`}</tbody>
        <tfoot><tr><th colspan="2">TOTAL</th><th>${node.used}</th></tr></tfoot>
      </table>

      <div class="subtle" style="margin-top:6px">📊 Daily Tracking (Balanced end-of-day)</div>
      <table>
        <thead><tr><th>Tool</th><th>Start</th><th>Added</th><th>Total</th><th>Remaining</th><th>Target</th><th>Check</th></tr></thead>
        <tbody>${track}</tbody>
      </table>
    </div>
  </details>`;
}

function calculate(){
  const names = TOOLSETS[mode];
  const targetRaw = readNum(ids.target);
  let perTool;
  if(mode==='expansion'){
    perTool = targetRaw; // direct
    if(!(perTool>0)){ el('msg').textContent='Invalid! Please enter the field to perform.'; el('msg').className='msg err'; return; }
  } else {
    perTool = reqFromCapacity(targetRaw);
    if(perTool===null){ el('msg').textContent='Invalid! Please enter the field to perform.'; el('msg').className='msg err'; return; }
  }

  const a = readNum(ids.a), b = readNum(ids.b), c = readNum(ids.c);
  const missing = [a,b,c].some(v => v===null);

  // KPI header with tool names
  const [nameA, nameB, nameC] = TOOLSETS[mode];
  const shortA = missing ? '—' : Math.max(0, perTool - a);
  const shortB = missing ? '—' : Math.max(0, perTool - b);
  const shortC = missing ? '—' : Math.max(0, perTool - c);
  el('kpi-needEach').textContent = perTool;
  el('kpi-a').textContent = `${nameA}: ${shortA}`;
  el('kpi-b').textContent = `${nameB}: ${shortB}`;
  el('kpi-c').textContent = `${nameC}: ${shortC}`;
  el('kpi-rule1').style.display='inline-block'; el('kpi-rule2').style.display='inline-block';
  el('kpi').style.display='flex';

  // Missing-stock policy
  if (missing){
    el('out').style.display='none';
    if(mode==='expansion'){
      el('msg').textContent = `Each tool requires ${perTool}. Enter the initial stock to perform a distribution plan.`;
    } else {
      el('msg').textContent = `Each tool requires ${perTool}. Enter the initial stock to perform a distribution plan.`;
    }
    el('msg').className='msg';
    return;
  }

  // Build and render plan
  const plan = fullPlan([a,b,c], perTool);
  const days = plan.map(p => renderDayNode(p, names)).join('');
  el('days').innerHTML = days;
  el('out').style.display='block';
  el('msg').textContent = `Plan generated in ${plan.length} day(s). Balanced daily.`;
  el('msg').className='msg';
}

/* Wire up */
el('btn-calc').addEventListener('click', calculate);
el('btn-clear').addEventListener('click', clearAll);
el('btn-preset').addEventListener('click', preset);
document.addEventListener('keydown', e=>{
  if(e.key==='Enter'){
    const idsAll=[ids.target,ids.a,ids.b,ids.c];
    if(idsAll.includes(document.activeElement.id)) calculate();
  }
});
setMode('barn'); // init

/* ===== Last but not least ===== */
document.addEventListener("contextmenu", function(e) {
  e.preventDefault();
});
