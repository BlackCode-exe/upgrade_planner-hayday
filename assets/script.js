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
function dayRaiseBalanced(cur, targetEach, cap = 89){
  // Enforce hard daily cap and never exceed target ceilings.
  const n = cur.length;
  const sumDef = cur.reduce((s,v)=> s + Math.max(0, targetEach - v), 0);
  if (sumDef === 0) return {adds:[0,0,0], used:0, after:cur.slice(), slots:[]};

  cap = Math.max(0, Math.min(cap, sumDef)); // NEVER exceed 89 or remaining deficit

  const lo = Math.max(...cur);

  // Units needed to end the day at common level T (no decreases)
  const needToReach = (T) =>
    cur.reduce((s,v)=> s + Math.max(0, Math.min(T, targetEach) - v), 0);

  let adds = [0,0,0], used = 0, after = cur.slice();

  // ===== Case A: We can equalize to some T >= lo within the cap =====
  if (needToReach(lo) <= cap){
    // Binary search the highest common level T we can afford today
    let L = lo, R = targetEach, best = lo;
    while (L <= R){
      const mid = (L + R) >> 1;
      if (needToReach(mid) <= cap){ best = mid; L = mid + 1; } else { R = mid - 1; }
    }

    adds = cur.map(v => Math.max(0, Math.min(best, targetEach) - v));
    used = adds.reduce((s,v)=> s + v, 0);

    // Spend any leftover only in multiples of n to keep totals equal
    let room = cap - used;
    const extra = Math.min(Math.floor(room / n), targetEach - best);
    if (extra > 0){
      for (let i=0;i<n;i++) adds[i] += extra;
      used += extra * n;
    }

    after = cur.map((v,i)=> v + adds[i]);
  } else {
    // ===== Case B: Can't reach current max today — raise lower group equally as far as allowed =====
    const lowerIdx = [...Array(n).keys()].filter(i => cur[i] < lo);
    const m = lowerIdx.length;
    const sumLower = lowerIdx.reduce((s,i)=> s + cur[i], 0);

    // Highest equal level x for the lower group given cap:
    // m*x - sumLower <= cap  ⇒  x <= floor((sumLower + cap)/m)
    let x = Math.floor((sumLower + cap) / m);
    x = Math.min(x, lo); // never surpass the current max

    // Base raise to x (keeps lower tools exactly equal)
    lowerIdx.forEach(i => { adds[i] = Math.max(0, x - cur[i]); });
    used = adds.reduce((s,v)=> s + v, 0);

    // Use leftover ONLY in multiples of m (lower-group size) without exceeding lo
    let rem = cap - used;
    if (rem >= m && x < lo){
      const bump = Math.min(Math.floor(rem / m), lo - x);
      if (bump > 0){
        lowerIdx.forEach(i => adds[i] += bump);
        used += bump * m;
        x += bump;
      }
      // Any remainder < m is intentionally not used to preserve equality.
    }

    after = cur.map((v,i)=> v + adds[i]);
  }

  // Safety: clamp any accidental drift
  used = Math.min(used, cap);
  const sumAdds = adds.reduce((s,v)=>s+v,0);
  if (sumAdds > cap){
    // Proportional trim (stable, integer)
    let over = sumAdds - cap;
    for (let i=0; i<n && over>0; i++){
      const cut = Math.min(over, adds[i]);
      adds[i] -= cut; over -= cut;
    }
    after = cur.map((v,i)=> v + adds[i]);
  }

  // Build ≤10-per-slot distribution list, never altering totals
  const names = TOOLSETS[mode];
  const left = adds.slice();
  const slots = [];
  while (left.reduce((s,v)=> s + v, 0) > 0){
    for (let i=0;i<n;i++){
      if (left[i] > 0){
        const take = Math.min(10, left[i]);
        slots.push({tool:names[i], amount:take});
        left[i] -= take;
      }
    }
  }

  return {adds, used, after, slots};
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

// ===== THEME =====
function applyTheme(theme){
  const root = document.documentElement;
  const icon = el('btn-theme')?.querySelector('.icon');

  if (theme === 'dark') {
    root.classList.add('theme-dark');
    if (icon) icon.textContent = '🌙';
  } else {
    root.classList.remove('theme-dark');
    if (icon) icon.textContent = '☀️';
  }
}

function isBlank(x){ return (x==="" || x===null || typeof x==="undefined"); }
function readNum(id){ const v=el(id).value; if(isBlank(v)) return null; const n=+v; return Number.isFinite(n)?Math.max(0,Math.floor(n)):0; }
function allProvided(){ return ![ids.a,ids.b,ids.c].some(id=>isBlank(el(id).value)); }

function setMode(newMode){
  mode = newMode;

  // tabs
  ["barn","silo","expansion"].forEach(m =>
    el(`tab-${m}`).setAttribute("aria-pressed", String(m===mode))
  );

  // labels
  const [A,B,C] = TOOLSETS[mode];
  el('lbl-a').textContent = A; el('lbl-b').textContent = B; el('lbl-c').textContent = C;
  el('hint-mode').textContent =
    mode==='barn' ? 'Barn: Bolt, Plank, Duct Tape.' :
    mode==='silo' ? 'Silo: Nail, Screw, Wood Panel.' :
                    'Expansion: Land Deed, Mallet, Marker Stake.';

  // target label & placeholder
  if (mode==='expansion'){
    el('lbl-target').textContent='Target tool';
    el('target').placeholder='e.g., 45';
  } else {
    el('lbl-target').textContent='Target Capacity';
    el('target').placeholder='e.g., 2750';
  }

  // === Auto-clear inputs on mode change ===
  [ids.target, ids.a, ids.b, ids.c].forEach(id => el(id).value = '');

  // clear outputs
  el('out').style.display='none';
  el('kpi').style.display='none';
  el('msg').textContent='';
}
['barn','silo','expansion'].forEach(m => el(`tab-${m}`).addEventListener('click', ()=>setMode(m)));

function clearAll(){
  [ids.target, ids.a, ids.b, ids.c].forEach(id => el(id).value = '');
  el('out').style.display='none'; el('kpi').style.display='none'; el('msg').textContent='';
}

function preset(){
  if (mode !== 'expansion') {
    // Barn / Silo preset
    el(ids.target).value = 2750;
    el(ids.a).value = 9;
    el(ids.b).value = 12;
    el(ids.c).value = 25;
  } else {
    // Expansion preset
    el(ids.target).value = 45;
    el(ids.a).value = 14;
    el(ids.b).value = 6;
    el(ids.c).value = 10;
  }
}

function renderDayNode(node, names){
  const slots = [...node.slots]
  .sort((a,b) => (a.amount - b.amount) || a.tool.localeCompare(b.tool)) 
  .map((s,i)=> `<tr><td>${i+1}</td><td>${s.tool}</td><td>${s.amount}</td></tr>`)
  .join('');
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
      <div class="subtle" style="font-weight:bold;">📦 Distribution Slots</div>
      <table><thead><tr><th>Slot</th><th>Tool</th><th>Amount</th></tr></thead>
        <tbody>${slots || `<tr><td colspan="3">No distribution</td></tr>`}</tbody>
        <tfoot><tr><th colspan="2">TOTAL</th><th>${node.used}</th></tr></tfoot>
      </table>

      <div class="subtle" style="margin-top:6px; font-weight:bold;">📊 Daily Tracking (Balanced end-of-day)</div>
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
el('kpi-needEach').textContent = perTool;   
el('kpi').style.display = 'flex';

if (!missing) {
  el('kpi-a').textContent = `${nameA}: ${Math.max(0, perTool - a)}`;
  el('kpi-b').textContent = `${nameB}: ${Math.max(0, perTool - b)}`;
  el('kpi-c').textContent = `${nameC}: ${Math.max(0, perTool - c)}`;
  el('kpi-rule1').style.display = 'inline-block';
  el('kpi-rule2').style.display = 'inline-block';
} else {
  el('kpi-a').textContent = '';
  el('kpi-b').textContent = '';
  el('kpi-c').textContent = '';
  el('kpi-rule1').style.display = 'none';
  el('kpi-rule2').style.display = 'none';
}

  // derive the "current capacity" (previous tier) from the entered target capacity
let currentCapacity = null;
if (mode !== 'expansion') {
  const step = (targetRaw <= 1000) ? 25 : 50;
  currentCapacity = targetRaw - step;
}

// Missing-stock policy
if (missing) {
  el('out').style.display = 'none';
  if (mode === 'expansion') {
    el('msg').innerHTML =
  `Each tool requires <b>${perTool} items</b> to unlock the land.` +
  `<div style="color:yellow;">Enter the initial stock to perform distribution.</div>`;
  } else {
    el('msg').innerHTML =
  `Each tool requires <b>${perTool} items to upgrade from capacity ${currentCapacity}.</b>` +
  `<div style="color:yellow;">Enter the initial stock to perform distribution.</div>`;
  }
  el('msg').className = 'msg';
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

// Theme toggle
(function initTheme(){
  const saved = localStorage.getItem('theme') || 'light';
  applyTheme(saved);

  const tbtn = el('btn-theme');
  if (tbtn) {
    tbtn.addEventListener('click', () => {
      const isDark = document.documentElement.classList.contains('theme-dark');
      const next = isDark ? 'light' : 'dark';
      localStorage.setItem('theme', next);
      applyTheme(next);
    });
  }
})();
setMode('barn'); // init

/* ===== Last but not least ===== */
document.addEventListener("contextmenu", function(e) {
  e.preventDefault();
});
