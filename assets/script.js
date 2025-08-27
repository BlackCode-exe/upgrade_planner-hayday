
/* === JSON i18n/runtime header === */
const CONFIG_PATH  = 'assets/config/app.config.json';
const LOCALE_PATH  = 'assets/spells/';

let APP_CONFIG       = null;
let CURRENT_UI       = {};   // strings dict from JSON
let CURRENT_TOOLSETS = {};   // localized tool names from JSON
const I18N_CACHE     = {};

// Safe JSON fetch with cache-busting
async function __safeFetchJSON(url){
  try{
    const bust = (url.includes('?') ? '&' : '?') + 'v=' + Date.now();
    const r = await fetch(url + bust, { cache: 'no-store' });
    if(!r.ok) throw new Error('HTTP ' + r.status + ' ' + url);
    return await r.json();
  }catch(e){
    console.warn('[i18n] fetch failed', url, e);
    return null;
  }
}

// Text helper
function t(k, fb){
  return (CURRENT_UI && CURRENT_UI[k] != null) ? CURRENT_UI[k] : (fb ?? k);
}

// Tool names from CURRENT_TOOLSETS or fallback to TOOLSETS keys
function getToolNames(mode){
  if (CURRENT_TOOLSETS && CURRENT_TOOLSETS[mode]) return CURRENT_TOOLSETS[mode];
  // Fallback: use base ids (TOOLSETS) if available
  try{
    if (typeof TOOLSETS !== 'undefined' && TOOLSETS[mode]) return TOOLSETS[mode];
  }catch(_){}
  return ['A','B','C'];
}

function localizedToolMap(mode){
  const names = getToolNames(mode);
  const base = (typeof TOOLSETS!=='undefined' && TOOLSETS[mode]) ? TOOLSETS[mode] : [];
  const map = {};
  for (let i=0;i<base.length;i++) map[base[i]] = names[i] || base[i];
  return map;
}

/* Apply language */
function applyLang(code){
  const dict = (CURRENT_UI && Object.keys(CURRENT_UI).length) ? CURRENT_UI : {};
  const pick = (k, fb)=> (dict[k] != null) ? dict[k] : (fb ?? k);
  const skip = (node)=> node.closest?.('footer') || node.id === 'btn-theme' || node.closest?.('#btn-theme');

  // data-i18n text nodes
  document.querySelectorAll('[data-i18n]').forEach(node=>{
    if (skip(node)) return;
    const k = node.getAttribute('data-i18n');
    if (dict[k] != null) node.textContent = dict[k];
  });
  // placeholder
  document.querySelectorAll('[data-i18n-placeholder]').forEach(node=>{
    if (skip(node)) return;
    const k = node.getAttribute('data-i18n-placeholder');
    if (dict[k] != null) node.setAttribute('placeholder', dict[k]);
  });
  // title tooltip
  document.querySelectorAll('[data-i18n-title]').forEach(node=>{
    if (skip(node)) return;
    const k = node.getAttribute('data-i18n-title');
    if (dict[k] != null) node.setAttribute('title', dict[k]);
  });
  // aria-label
  document.querySelectorAll('[data-i18n-aria]').forEach(node=>{
    if (skip(node)) return;
    const k = node.getAttribute('data-i18n-aria');
    if (dict[k] != null) node.setAttribute('aria-label', dict[k]);
  });

  // Common labels
  const tb = document.getElementById('tab-barn');      if (tb) tb.textContent = pick('tabs.barn', tb.textContent);
  const ts = document.getElementById('tab-silo');      if (ts) ts.textContent = pick('tabs.silo', ts.textContent);
  const te = document.getElementById('tab-expansion'); if (te) te.textContent = pick('tabs.expansion', te.textContent);
  const ttl = document.getElementById('app-title');    if (ttl) ttl.textContent = pick('title', ttl.textContent);
  const sub = document.getElementById('app-subtitle'); if (sub) sub.textContent = pick('subtitle', sub.textContent);

  const mt  = document.getElementById('materials-title'); if (mt) mt.textContent = pick('materials.title', mt.textContent);
  const hm  = document.getElementById('hint-mode');
  if (hm){
    const hk = (window.mode==='barn') ? 'materials.hint.barn'
             : (window.mode==='silo') ? 'materials.hint.silo'
             : 'materials.hint.expansion';
    hm.textContent = pick(hk, hm.textContent);
  }

  const lblt = document.getElementById('lbl-target');
  const tgt  = document.getElementById('target');
  if (window.mode === 'expansion'){
    if (lblt) lblt.textContent = pick('materials.targetTool', lblt.textContent);
    if (tgt)  tgt.placeholder   = pick('materials.target_ph_exp', tgt.placeholder);
  } else {
    if (lblt) lblt.textContent = pick('materials.target', lblt.textContent);
    if (tgt)  tgt.placeholder   = pick('materials.target_ph', tgt.placeholder);
  }

  const [A,B,C] = getToolNames(window.mode || 'barn');
  const la = document.getElementById('lbl-a'); if (la) la.textContent = A;
  const lb = document.getElementById('lbl-b'); if (lb) lb.textContent = B;
  const lc = document.getElementById('lbl-c'); if (lc) lc.textContent = C;

  const bCalc = document.getElementById('btn-calc');  if (bCalc){ bCalc.textContent = pick('btn.calculate', bCalc.textContent); bCalc.title = pick('btn.calculate', bCalc.title); }
  const bClr  = document.getElementById('btn-clear'); if (bClr) { bClr.textContent  = pick('btn.clear',     bClr.textContent);  bClr.title  = pick('btn.clear_tip',  bClr.title); }
  const bPre  = document.getElementById('btn-preset');if (bPre) { bPre.textContent  = pick('btn.preset',    bPre.textContent);  bPre.title  = pick('btn.preset_tip', bPre.title); }

  const r1 = document.getElementById('kpi-rule1'); if (r1) r1.textContent = pick('kpi.balanced', r1.textContent);
  const r2 = document.getElementById('kpi-rule2'); if (r2) r2.textContent = pick('kpi.cap',       r2.textContent);

  const pt = document.getElementById('plan-title'); if (pt) pt.textContent = pick('plan.title', pt.textContent);
  const ph = document.getElementById('plan-hint');  if (ph) ph.textContent = pick('plan.hint',  ph.textContent);

  const H = (id,key)=>{ const n=document.getElementById(id); if(n) n.textContent = pick(key, n.textContent); };
  H('th-slot','table.slot'); H('th-tool','table.tool'); H('th-amount','table.amount'); H('th-total','table.total');
  H('th-start','table.start'); H('th-added','table.added'); H('th-remaining','table.remaining');
  H('th-target','table.target'); H('th-check','table.check');

  try{
    localStorage.setItem('lang', code);
    const sel = document.getElementById('lang'); if (sel) sel.value = code;
    if (dict.title) document.title = dict.title;
  }catch(_){}

  // Dynamic repaint
  const body = document.getElementById('plan-body') || document.getElementById('days');
  const hasRows = !!(body && body.children && body.children.length > 0);
  if (hasRows){
    try { if (typeof calculate==='function') calculate(); }
    catch(e){ console.warn('recalc after lang switch failed', e); }
  } else {
    try { if (typeof setStatus==='function') setStatus(window.__lastStatusKey || 'msg.enter'); } catch(_){}
  }
}

/* Load language */
async function setLang(code){
  try{ localStorage.setItem('lang', code); }catch(_){}
  let dict = I18N_CACHE[code];
  if (!dict){
    dict = await __safeFetchJSON(LOCALE_PATH + code + '.json');
    if (dict) I18N_CACHE[code] = dict;
  }
  if (dict){
    // accept both flat {"k":"v"} and grouped {"ui":{...},"toolsets":{...}}
    CURRENT_UI       = dict.ui || dict || {};
    CURRENT_TOOLSETS = dict.toolsets || CURRENT_TOOLSETS;
  } else if (I18N_CACHE['en']) {
    CURRENT_UI       = I18N_CACHE['en'].ui || I18N_CACHE['en'] || {};
  }
  applyLang(code);
}

/* Bootstrap i18n */
(function initI18N(){
  (async () => {
    APP_CONFIG = await __safeFetchJSON(CONFIG_PATH);
    const sel = document.getElementById('lang');
    const saved = (()=>{ try{ return localStorage.getItem('lang'); }catch(_){ return null; }})();
    const fallback = (APP_CONFIG && APP_CONFIG.defaultLang) ? APP_CONFIG.defaultLang : 'en';
    const code = (sel && sel.value) || saved || (navigator.language||'en').slice(0,2) || fallback;
    await setLang(code);
    if (sel){
      sel.value = code;
      sel.addEventListener('change', e=> setLang(e.target.value));
    }
  })();
})();

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

/* ===== Distribution per day  ===== */
function dayRaiseBalanced(cur, targetEach, cap = 89){
  const n = cur.length;
  const sumDef = cur.reduce((s,v)=> s + Math.max(0, targetEach - v), 0);
  if (sumDef === 0) return {adds:[0,0,0], used:0, after:cur.slice(), slots:[]};

  cap = Math.max(0, Math.min(cap, sumDef)); // enforce cap

  const lo = Math.max(...cur);
  const needToReach = (T) =>
    cur.reduce((s,v)=> s + Math.max(0, Math.min(T, targetEach) - v), 0);

  let adds = [0,0,0], used = 0, after = cur.slice();

  if (needToReach(lo) <= cap){
    let L = lo, R = targetEach, best = lo;
    while (L <= R){
      const mid = (L + R) >> 1;
      if (needToReach(mid) <= cap){ best = mid; L = mid + 1; } else { R = mid - 1; }
    }
    adds = cur.map(v => Math.max(0, Math.min(best, targetEach) - v));
    used = adds.reduce((s,v)=> s + v, 0);

    let room = cap - used;
    const extra = Math.min(Math.floor(room / n), targetEach - best);
    if (extra > 0){
      for (let i=0;i<n;i++) adds[i] += extra;
      used += extra * n;
    }
    after = cur.map((v,i)=> v + adds[i]);
  } else {
    const lowerIdx = [...Array(n).keys()].filter(i => cur[i] < lo);
    const m = lowerIdx.length;
    const sumLower = lowerIdx.reduce((s,i)=> s + cur[i], 0);

    let x = Math.floor((sumLower + cap) / m);
    x = Math.min(x, lo);

    lowerIdx.forEach(i => { adds[i] = Math.max(0, x - cur[i]); });
    used = adds.reduce((s,v)=> s + v, 0);

    let rem = cap - used;
    if (rem >= m && x < lo){
      const bump = Math.min(Math.floor(rem / m), lo - x);
      if (bump > 0){
        lowerIdx.forEach(i => adds[i] += bump);
        used += bump * m;
      }
    }
    after = cur.map((v,i)=> v + adds[i]);
  }

  used = Math.min(used, cap);
  const sumAdds = adds.reduce((s,v)=>s+v,0);
  if (sumAdds > cap){
    let over = sumAdds - cap;
    for (let i=0; i<n && over>0; i++){
      const cut = Math.min(over, adds[i]);
      adds[i] -= cut; over -= cut;
    }
    after = cur.map((v,i)=> v + adds[i]);
  }

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

/* ===== UI helpers ===== */
const el = (id)=>document.getElementById(id);
const ids = {target:'target',a:'t0',b:'t1',c:'t2'};

/* ===== THEME  ===== */
function applyTheme(theme){
  const root = document.documentElement;
  const icon = el('btn-theme')?.querySelector('.icon');
  if (theme === 'dark') { root.classList.add('theme-dark'); if (icon) icon.textContent = '🌙'; }
  else { root.classList.remove('theme-dark'); if (icon) icon.textContent = '☀️'; }
}

function isBlank(x){ return (x==="" || x===null || typeof x==="undefined"); }
function readNum(id){ const nEl = el(id); if(!nEl) return null; const v=nEl.value; if(isBlank(v)) return null; const n=+v; return Number.isFinite(n)?Math.max(0,Math.floor(n)):0; }
function allProvided(){ return ![ids.a,ids.b,ids.c].some(id=>{const k=el(id); return !k || isBlank(k.value);}); }

/* ===== Mode switch  ===== */
function setMode(newMode){
  mode = newMode;

  // Guarded tab state
  ["barn","silo","expansion"].forEach(m =>{
    const tab = el(`tab-${m}`);
    if (tab) tab.setAttribute("aria-pressed", String(m===mode));
  });

  // Labels  (localized)
  const [A,B,C] = getToolNames(mode);
  const la = el('lbl-a'), lb = el('lbl-b'), lc = el('lbl-c');
  if (la) la.textContent = A;
  if (lb) lb.textContent = B;
  if (lc) lc.textContent = C;

  // Hint per mode
  const hm = el('hint-mode');
  if (hm){
    hm.textContent =
      mode==='barn' ? t('materials.hint.barn') :
      mode==='silo' ? t('materials.hint.silo') :
                      t('materials.hint.expansion');
  }

  // Target label & placeholder
  const lblt = el('lbl-target');
  const tgt  = el('target');
  if (mode==='expansion'){
    if (lblt) lblt.textContent = t('materials.targetTool');
    if (tgt)  tgt.placeholder  = t('materials.target_ph_exp');
  } else {
    if (lblt) lblt.textContent = t('materials.target');
    if (tgt)  tgt.placeholder  = t('materials.target_ph');
  }

  // Auto-clear inputs
  [ids.target, ids.a, ids.b, ids.c].forEach(id => { const n=el(id); if(n) n.value=''; });

  // Clear outputs
  const o = el('out'); if (o) o.style.display='none';
  const k = el('kpi'); if (k) k.style.display='none';
  const m = el('msg'); if (m) m.textContent='';

  // Re-apply i18n (tab text, buttons, dsb)
  setTimeout(()=> applyLang(currentLangCode()), 0);
}

// Safe attach for tabs (skip if absent)
['barn','silo','expansion'].forEach(m => {
  const tab = el(`tab-${m}`);
  if (tab) tab.addEventListener('click', ()=>setMode(m));
});

/* ===== Clear & Preset  ===== */
function clearAll(){
  [ids.target, ids.a, ids.b, ids.c].forEach(id => { const n=el(id); if(n) n.value=''; });
  const o = el('out'); if (o) o.style.display='none';
  const k = el('kpi'); if (k) k.style.display='none';
  const m = el('msg'); if (m) m.textContent='';
}
function preset(){
  const t = el(ids.target), a = el(ids.a), b = el(ids.b), c = el(ids.c);
  if (!t || !a || !b || !c) return;
  if (mode !== 'expansion') {
    t.value = 2750;
    a.value = 9; b.value = 12; c.value = 25;
  } else {
    t.value = 45;
    a.value = 14; b.value = 6; c.value = 10;
  }
}

/* ===== Render day  ===== */
function renderDayNode(node, names){
const nameMap = localizedToolMap(mode);

  const slots = [...node.slots]
    .sort((a,b) => (a.amount - b.amount) || a.tool.localeCompare(b.tool))
    .map((s,i)=> `<tr><td>${i+1}</td><td>${nameMap[s.tool] || s.tool}</td><td>${s.amount}</td></tr>`)
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
    <summary>${t('plan.day')} ${node.day}
      <span class="badge">${t('plan.used')}: ${node.used}/89</span>
      <span class="badge">${t('plan.endTotal')}: ${node.after[0]} ${t('plan.each')}</span>
    </summary>
    <div style="margin-top:8px">
      <div class="subtle" style="font-weight:bold;">${t('plan.sectionSlots')}</div>
      <table>
        <thead>
          <tr><th>${t('table.slot')}</th><th>${t('table.tool')}</th><th>${t('table.amount')}</th></tr>
        </thead>
        <tbody>${slots || `<tr><td colspan="3">${t('table.noDist')}</td></tr>`}</tbody>
        <tfoot><tr><th colspan="2">${t('table.total')}</th><th>${node.used}</th></tr></tfoot>
      </table>

      <div class="subtle" style="margin-top:6px; font-weight:bold;">${t('plan.sectionTracking')}</div>
      <table>
        <thead>
          <tr>
            <th>${t('table.tool')}</th>
            <th>${t('table.start')}</th>
            <th>${t('table.added')}</th>
            <th>${t('table.total')}</th>
            <th>${t('table.remaining')}</th>
            <th>${t('table.target')}</th>
            <th>${t('table.check')}</th>
          </tr>
        </thead>
        <tbody>${track}</tbody>
      </table>
    </div>
  </details>`;
}

/* ===== Calculate  ===== */
function calculate(){
const names = getToolNames(mode);

  const targetRaw = readNum(ids.target);
  let perTool;
  if(mode==='expansion'){
    perTool = targetRaw;
    if(!(perTool>0)){
      const mg = el('msg'); if (mg){ mg.textContent = t('err.invalid'); mg.className='msg err'; }
      return;
    }
  } else {
    perTool = reqFromCapacity(targetRaw);
    if(perTool===null){
      const mg = el('msg'); if (mg){ mg.textContent = t('err.invalid'); mg.className='msg err'; }
      return;
    }
  }

  const a = readNum(ids.a), b = readNum(ids.b), c = readNum(ids.c);
  const missing = [a,b,c].some(v => v===null);

  // KPI
  const kNeed = el('kpi-needEach'); if (kNeed) kNeed.textContent = perTool ?? '—';
  const kpi = el('kpi'); if (kpi) kpi.style.display = 'flex';
  const r1 = el('kpi-rule1'); if (r1) r1.textContent = t('kpi.balanced');
  const r2 = el('kpi-rule2'); if (r2) r2.textContent = t('kpi.cap');

  const ka = el('kpi-a'), kb = el('kpi-b'), kc = el('kpi-c');
  if (!missing) {
    if (ka) ka.textContent = `${names[0]}: ${Math.max(0, perTool - a)}`;
    if (kb) kb.textContent = `${names[1]}: ${Math.max(0, perTool - b)}`;
    if (kc) kc.textContent = `${names[2]}: ${Math.max(0, perTool - c)}`;
    if (r1) r1.style.display = 'inline-block';
    if (r2) r2.style.display = 'inline-block';
  } else {
    if (ka) ka.textContent = '';
    if (kb) kb.textContent = '';
    if (kc) kc.textContent = '';
    if (r1) r1.style.display = 'none';
    if (r2) r2.style.display = 'none';
  }

  // current capacity (previous tier)
  let currentCapacity = null;
  if (mode !== 'expansion' && Number.isFinite(targetRaw)) {
    const step = (targetRaw <= 1000) ? 25 : 50;
    currentCapacity = targetRaw - step;
  }

  // Missing-stock behavior
  const out = el('out');
  const msg = el('msg');
  if (missing) {
    if (out) out.style.display = 'none';
    if (msg){
      if (mode === 'expansion') {
        msg.innerHTML =
          t('msg.expansionReq').replace('{n}', perTool) +
          `<div style="color: red;">${t('msg.enter')}</div>`;
      } else {
        msg.innerHTML =
          t('msg.upgradeReq').replace('{n}', perTool).replace('{cap}', currentCapacity) +
          `<div style="color:#8B0000;">${t('msg.enter')}</div>`;
      }
      msg.className = 'msg';
    }
    return;
  }

  // Render plan
  const plan = fullPlan([a,b,c], perTool);
  const daysHtml = plan.map(p => renderDayNode(p, names)).join('');
  const days = el('days'); if (days) days.innerHTML = daysHtml;
  if (out) out.style.display='block';
  if (msg){ msg.textContent = t('msg.generated').replace('{d}', plan.length); msg.className='msg'; }
}

/* ===== Wire up  ===== */
(function wireUp(){
  const bc = el('btn-calc');  if (bc) bc.addEventListener('click', calculate);
  const bl = el('btn-clear'); if (bl) bl.addEventListener('click', clearAll);
  const bp = el('btn-preset');if (bp) bp.addEventListener('click', preset);

  document.addEventListener('keydown', e=>{
    if(e.key==='Enter'){
      const active = document.activeElement && document.activeElement.id;
      if ([ids.target,ids.a,ids.b,ids.c].includes(active)) calculate();
    }
  });
})();

// Theme toggle 
(function initTheme(){
  try{
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
  }catch(_){}
})();

/* ===== Init ===== */
(function init(){
  try{ setMode('barn'); }catch(_){}
  document.addEventListener("contextmenu", function(e) { e.preventDefault(); });
})();

/* Language bootstrap */
(function initI18N(){
  const code = currentLang();
  applyLang(code);
  const sel = el('lang');
  if (sel){
    sel.addEventListener('change', e=> applyLang(e.target.value));
  }
})();

