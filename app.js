
const KEY = "resellr_v300_data";
let state = load();
let editing = null;
let inventorySort = {key:"addedAt", dir:"desc"};
let soldSort = {key:"date", dir:"desc"};

/* ---------- helpers ---------- */
function n(v){ const x = Number(v); return Number.isFinite(x) ? x : 0; }
function money(v){ const x=n(v); const sign=x<0?"-":""; return sign+"$"+Math.abs(x).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2}); }
function pad2(x){ return String(x).padStart(2,"0"); }
function localDateStr(d){ return `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`; }
function today(){ return localDateStr(new Date()); }
function parseLocalDate(dateStr){
  if(!dateStr) return new Date(NaN);
  const s = String(dateStr).slice(0,10);
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if(!m) return new Date(dateStr);
  return new Date(Number(m[1]), Number(m[2])-1, Number(m[3]));
}
function uid(){ return "id_" + Date.now() + "_" + Math.random().toString(16).slice(2); }
function profit(r){ return n(r.price)-n(r.cost)-n(r.fees)-n(r.shipping); }
function costProfit(r){ return n(r.cost)+profit(r); }
function sameMonth(d,ref){ return d.getFullYear()===ref.getFullYear() && d.getMonth()===ref.getMonth(); }
function attrSafe(obj){ return JSON.stringify(obj).replace(/'/g,"&#39;"); }
function timeAgo(ts){
  const s=Math.max(0,Math.floor((Date.now()-ts)/1000));
  if(s<60) return "just now";
  const m=Math.floor(s/60); if(m<60) return m+"m ago";
  const h=Math.floor(m/60); if(h<24) return h+"h ago";
  const d=Math.floor(h/24); return d+"d ago";
}

/* ---------- persistence ---------- */
function load(){
  try{
    const saved = JSON.parse(localStorage.getItem(KEY));
    if(saved){
      saved.inventory = saved.inventory || [];
      saved.holds = saved.holds || [];
      saved.sold = saved.sold || [];
      saved.history = saved.history || [];
      saved.activity = saved.activity || [];
      saved.transactions = saved.transactions || [];
      saved.userName = saved.userName || "";
      saved.monthlyGoal = Number.isFinite(saved.monthlyGoal) ? saved.monthlyGoal : 300;
      saved.walletMode = Number.isFinite(saved.walletMode) ? saved.walletMode : 50;
      saved.theme = saved.theme || "light";
      saved.sidebarCollapsed = !!saved.sidebarCollapsed;
      return saved;
    }
  }catch(e){}
  return demoData();
}
function save(){ try{ localStorage.setItem(KEY, JSON.stringify(state)); }catch(e){} }

function synthHistory(final, days, startRatio){
  const start = final*startRatio;
  const arr=[];
  for(let i=0;i<days;i++){
    const t = days<=1 ? 1 : i/(days-1);
    const base = start + (final-start)*t;
    const wobble = base*0.02*Math.sin(i*1.6);
    arr.push(Math.max(0, base+wobble));
  }
  arr[arr.length-1]=final;
  return arr;
}

function demoData(){
  const now = new Date();
  const iso = (offsetDays)=>{ const d=new Date(now); d.setDate(d.getDate()-offsetDays); return localDateStr(d); };
  const inventory=[
    {id:uid(),title:"2024 Daredevil 14 NYCC John Tyler Christopher Red Foil Exclusive Variant",platform:"Mercari",category:"Comic",price:45,cost:15,fees:0,shipping:0,notes:"Added from Mercari",addedAt:Date.now()-1000*60*60*26},
    {id:uid(),title:"Absolute Batman Annual #1 Signed Variant",platform:"eBay",category:"Comic",price:120,cost:80,fees:0,shipping:0,notes:"Convention signatures",addedAt:Date.now()-1000*60*60*24*4},
    {id:uid(),title:"Tekken Saga #1 Virgin Variant",platform:"Mercari",category:"Comic",price:75,cost:15,fees:0,shipping:0,notes:"Knightstone",addedAt:Date.now()-1000*60*60*24*9},
    {id:uid(),title:"2016 Pokemon Generations Meowstic Holo",platform:"Mercari",category:"Card",price:10,cost:2,fees:0,shipping:0,notes:"",addedAt:Date.now()-1000*60*60*24*2},
    {id:uid(),title:"Ultimate Spider-Man #1 2nd Print",platform:"eBay",category:"Comic",price:35,cost:12,fees:0,shipping:0,notes:"",addedAt:Date.now()-1000*60*60*24*13}
  ];
  const holds=[
    {id:uid(),title:"GPK Adam Bomb Signed Print",platform:"Private Sale",category:"Card",price:150,cost:52,fees:0,shipping:0,notes:"Buyer deciding",heldAt:Date.now()-1000*60*60*24*3}
  ];
  const sold=[
    {id:uid(),title:"Secret Wars #8 CGC 9.8",platform:"eBay",category:"Comic",price:520,cost:360,fees:62,shipping:18,date:iso(165)},
    {id:uid(),title:"GPK Adam Bomb Signed Print",platform:"Mercari",category:"Card",price:160,cost:52,fees:20,shipping:0,date:iso(116)},
    {id:uid(),title:"Batman Variant Bundle",platform:"Private Sale",category:"Comic",price:95,cost:40,fees:0,shipping:0,date:iso(20)},
    {id:uid(),title:"Amazing Spider-Man #300 Facsimile",platform:"Mercari",category:"Comic",price:145,cost:60,fees:14,shipping:0,date:iso(1)},
    {id:uid(),title:"1st Edition Charizard Reprint",platform:"eBay",category:"Card",price:210,cost:90,fees:22,shipping:8,date:iso(6)},
    {id:uid(),title:"TMNT #1 Mirage Reprint",platform:"Mercari",category:"Comic",price:65,cost:28,fees:6,shipping:0,date:iso(45)}
  ];
  const invValue = inventory.reduce((a,r)=>a+n(r.price),0);
  const cp = sold.reduce((a,r)=>a+costProfit(r),0);
  const wallet = cp*0.5 - inventory.reduce((a,r)=>a+n(r.cost),0);
  const salesYTD = sold.filter(r=>parseLocalDate(r.date).getFullYear()===now.getFullYear()).length;
  const days=30;
  const invArr=synthHistory(invValue,days,0.82);
  const cpArr=synthHistory(cp,days,0.65);
  const wArr=synthHistory(wallet,days,0.7);
  const sArr=synthHistory(salesYTD,days,0.55).map(v=>Math.round(v));
  const history=[];
  for(let i=0;i<days;i++){
    const d=new Date(now); d.setDate(d.getDate()-(days-1-i));
    history.push({date:localDateStr(d),invValue:invArr[i],costProfit:cpArr[i],wallet:wArr[i],sales:sArr[i]});
  }
  const activity=[
    {text:"Sold Amazing Spider-Man #300",sub:"Mercari • +$71.00 Profit",color:"blue",icon:"$",ts:Date.now()-1000*60*60*1},
    {text:"Bought Batman #125",sub:"eBay • $68.00",color:"gold",icon:"+",ts:Date.now()-1000*60*60*3},
    {text:"Moved 1 item to Holds",sub:"GPK Adam Bomb Signed Print • $150.00",color:"green",icon:"◇",ts:Date.now()-1000*60*60*5},
    {text:"Imported 8 new listings",sub:"eBay",color:"violet",icon:"⇵",ts:Date.now()-1000*60*60*7}
  ];
  return { theme:"light", walletMode:50, userName:"", monthlyGoal:300, lastBackupAt:null, sidebarCollapsed:false, inventory, holds, sold, history, activity };
}

/* ---------- activity log ---------- */
function logActivity(text, sub, color, icon){
  state.activity = state.activity || [];
  state.activity.unshift({text, sub, color:color||"gold", icon:icon||"•", ts:Date.now()});
  state.activity = state.activity.slice(0,30);
}

/* ---------- stash math ----------
   Stash Balance is a running lifetime ledger:
   money IN = cost+profit recovered from every sale (at your chosen reinvestment %)
   money OUT = cost of every item you've ever bought, whether it's currently in
               Inventory, on Hold, or already Sold (the cash left your stash the
               moment you bought it, regardless of what happened to the item since)
   If the balance goes negative, that's money that came from your personal account. */
function totalSpentAllTime(){
  return [...state.inventory, ...state.holds, ...state.sold].reduce((a,r)=>a+n(r.cost),0);
}
function totalEarnedAllTime(){
  // 100% of cost+profit recovered from every sale, lifetime.
  return state.sold.reduce((a,r)=>a + costProfit(r),0);
}
function txnTotal(type){
  return (state.transactions||[]).reduce((a,t)=> a + (t.type===type ? n(t.amount) : 0), 0);
}
function walletBalance(){
  // The Stash mirrors your real hobby bank account:
  // + every sale's cost+profit   - every item's cost
  // + deposits you log           - withdrawals you log
  // - business expenses (supplies, shipping materials, subscriptions, etc.)
  return totalEarnedAllTime() - totalSpentAllTime() + txnTotal("deposit") - txnTotal("withdraw") - txnTotal("expense");
}
function expensesForYear(year){
  return (state.transactions||[]).filter(t=>{
    if(t.type!=="expense" || !t.date) return false;
    return year==="all" || parseLocalDate(t.date).getFullYear()===Number(year);
  });
}
function personalInvestment(){
  return Math.max(0, -walletBalance());
}
/* The reinvestment % (walletMode) is purely a planning guide -- it never changes
   the Stash Balance. It shows what share of each new sale you PLAN to put back
   vs keep for yourself. */
function plannedKeepThisMonth(){
  const now = new Date();
  const monthSales = state.sold.filter(r=>{
    if(!r.date) return false;
    const d = parseLocalDate(r.date);
    return sameMonth(d, now);
  });
  const monthCP = monthSales.reduce((a,r)=>a + costProfit(r),0);
  return monthCP * (1 - state.walletMode/100);
}
function reservedProfit(){
  return plannedKeepThisMonth();
}

/* ---------- theme ---------- */
function setTheme(t){
  state.theme=t;
  document.documentElement.dataset.theme=t;
  const span=themeToggle.querySelector("span");
  if(span) span.textContent = t==="dark" ? "Switch to Light Mode" : "Switch to Dark Mode";
}
themeToggle.onclick=()=>{ setTheme(state.theme==="dark"?"light":"dark"); render(); };

/* ---------- sidebar collapse ---------- */
const appShell = document.querySelector(".app-shell");
function applySidebarState(){
  appShell.classList.toggle("sb-collapsed", !!state.sidebarCollapsed);
  sidebarToggle.title = state.sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar";
}
sidebarToggle.onclick=()=>{
  state.sidebarCollapsed = !state.sidebarCollapsed;
  applySidebarState();
  save();
};
applySidebarState();

/* ---------- navigation ---------- */
function showPage(id){
  document.querySelectorAll(".page").forEach(p=>p.classList.remove("active-page"));
  const el=document.getElementById(id);
  if(el) el.classList.add("active-page");
  document.querySelectorAll(".nav button").forEach(b=>b.classList.toggle("active",b.dataset.page===id));
  if(id==="dashboard"){ renderKPIs(); renderCharts(); }
}
document.querySelectorAll("[data-page]").forEach(b=>b.onclick=()=>showPage(b.dataset.page));
alertsBell.onclick=()=>showPage("alerts");
customizeBtn.onclick=()=>alert("Customize layout — coming soon!");
document.addEventListener("keydown",e=>{
  if((e.metaKey||e.ctrlKey) && e.key.toLowerCase()==="k"){ e.preventDefault(); globalSearch.focus(); }
  if(e.key==="Escape") avatarDropdown.hidden=true;
});

/* ---------- avatar dropdown ---------- */
avatarBtn.onclick=(e)=>{
  e.stopPropagation();
  avatarDropdown.hidden = !avatarDropdown.hidden;
};
avatarSettingsItem.onclick=()=>{
  avatarDropdown.hidden = true;
  showPage("settings");
};
logoutMenuBtn.onclick=()=>{
  avatarDropdown.hidden = true;
  if(typeof firebase === "undefined" || !firebase.auth){ window.location.href="signin.html"; return; }
  firebase.auth().signOut().then(()=>{ window.location.href="signin.html"; });
};
document.addEventListener("click",(e)=>{
  if(!e.target.closest(".avatar-menu")) avatarDropdown.hidden = true;
});

/* ---------- item modal ---------- */
let modalKind = "inventory";
function openModal(item=null, kind="inventory", opts={}){
  editing = item ? {id:item.id, kind, moveFrom:opts.moveFrom||null} : null;
  modalKind = kind;
  const form = document.getElementById("itemForm");
  form.reset();
  const isSaleFlow = kind==="sold";
  dateField.style.display = isSaleFlow ? "" : "none";
  document.getElementById("modalTitle").textContent = !item ? "Add Item" : (opts.moveFrom ? "Mark as Sold" : "Edit Item");
  if(item){
    form.title.value=item.title||"";
    form.platform.value=item.platform||"Mercari";
    form.category.value=item.category||"Comic";
    form.price.value=item.price||"";
    form.cost.value=item.cost||"";
    form.fees.value=item.fees||"";
    form.shipping.value=item.shipping||"";
    form.notes.value=item.notes||"";
    if(isSaleFlow) form.date.value = item.date || today();
  } else if(isSaleFlow){
    form.date.value = today();
  }
  stashWarning.hidden = true;
  document.getElementById("itemModal").showModal();
  updateStashWarning();
}
document.getElementById("addItemBtn2").onclick=()=>openModal();
document.getElementById("cancelModal").onclick=()=>document.getElementById("itemModal").close();
function updateStashWarning(){
  // Only relevant when logging a brand-new purchase into Inventory --
  // editing an existing item or marking something sold doesn't spend fresh cash.
  if(editing || modalKind!=="inventory"){ stashWarning.hidden=true; return; }
  const cost = n(costInput.value);
  if(!cost){ stashWarning.hidden=true; return; }
  const available = Math.max(0, walletBalance());
  if(cost > available){
    const shortfall = cost - available;
    stashWarning.hidden = false;
    stashWarning.textContent = available > 0
      ? `This would use ${money(shortfall)} from your personal funds \u2014 your Stash only has ${money(available)} available.`
      : `Your Stash is empty right now \u2014 this ${money(cost)} would come entirely from your personal funds.`;
  } else {
    stashWarning.hidden = true;
  }
}
costInput.addEventListener("input", updateStashWarning);

/* ---------- bookmarklet paste ---------- */
function guessCategory(title){
  const t = title||"";
  if(/pokemon|tcg|panini|topps|psa|bgs|graded|slab|card game|yugioh|magic: the gathering|\bmtg\b/i.test(t)) return "Card";
  if(/comic|cgc|variant|#\d|annual|issue/i.test(t)) return "Comic";
  return "Comic";
}
async function pasteListing(){
  let raw = null;
  try{
    if(navigator.clipboard && navigator.clipboard.readText){
      raw = await navigator.clipboard.readText();
    }
  }catch(e){ raw = null; }
  if(!raw || !raw.trim().startsWith("{")){
    raw = prompt("Clipboard access was blocked by your browser. Paste the copied listing here:");
  }
  if(!raw) return;
  let data;
  try{ data = JSON.parse(raw); }
  catch(e){ alert("That doesn't look like a listing copied by the Comix Stash bookmarklet. Click the bookmarklet on a Mercari or eBay listing page first, then try again."); return; }
  if(!data.title){ alert("No title was found in that listing. You can still add it manually."); return; }

  openModal(null);
  const form = document.getElementById("itemForm");
  form.title.value = data.title || "";
  form.platform.value = /mercari/i.test(data.platform) ? "Mercari" : /ebay/i.test(data.platform) ? "eBay" : "Mercari";
  form.category.value = guessCategory(data.title);
  form.price.value = data.price || "";
  form.notes.value = data.sourceUrl ? `Imported from ${data.sourceUrl}` : "";
}
document.getElementById("pasteListingBtn").onclick=pasteListing;
document.getElementById("pasteListingBtn2").onclick=pasteListing;
document.getElementById("itemForm").onsubmit=(e)=>{
  e.preventDefault();
  const fd = new FormData(e.target);
  const item = {
    id: editing?.id || uid(),
    title: String(fd.get("title")||"").trim(),
    platform: fd.get("platform"),
    category: fd.get("category"),
    price: n(fd.get("price")),
    cost: n(fd.get("cost")),
    fees: n(fd.get("fees")),
    shipping: n(fd.get("shipping")),
    notes: fd.get("notes")||""
  };
  if(modalKind==="sold") item.date = fd.get("date") || today();

  if(editing){
    if(editing.moveFrom && editing.moveFrom!==editing.kind){
      const src = state[editing.moveFrom];
      const i = src.findIndex(x=>x.id===editing.id);
      const orig = i>=0 ? src.splice(i,1)[0] : {};
      const merged = {...orig, ...item};
      state[editing.kind].unshift(merged);
      if(editing.kind==="sold"){
        const p = profit(merged);
        logActivity(`Sold ${merged.title}`, `${merged.platform} • ${p>=0?"+":""}${money(p)} profit`, "blue", "$");
      }
    }else{
      const arr = state[editing.kind];
      const i = arr.findIndex(x=>x.id===editing.id);
      if(i>=0) arr[i] = {...arr[i],...item};
    }
  }else{
    item.addedAt = Date.now();
    state.inventory.unshift(item);
    logActivity(`Listed ${item.title}`, `${item.platform} • ${money(item.price)}`, "gold", "+");
    inventoryPage = 1;
  }
  save(); document.getElementById("itemModal").close(); render();
};

/* ---------- item movement ---------- */
function moveToHold(id){
  const i=state.inventory.findIndex(x=>x.id===id); if(i<0)return;
  const item = state.inventory.splice(i,1)[0];
  item.heldAt = Date.now();
  state.holds.unshift(item);
  logActivity(`Moved 1 item to Holds`, `${item.title} • ${money(n(item.price))}`, "green", "◇");
  save(); render();
}
function moveHoldBack(id){
  const i=state.holds.findIndex(x=>x.id===id); if(i<0)return;
  state.inventory.unshift(state.holds.splice(i,1)[0]); save(); render();
}
function markSold(id){
  const item = state.inventory.find(x=>x.id===id);
  if(!item) return;
  openModal(item, "sold", {moveFrom:"inventory"});
}
function moveSoldBack(id){
  const i=state.sold.findIndex(x=>x.id===id); if(i<0)return;
  state.inventory.unshift(state.sold.splice(i,1)[0]); save(); render();
}
function delFrom(kind,id){
  if(!confirm("Delete this item?")) return;
  state[kind]=state[kind].filter(x=>x.id!==id); save(); render();
}

/* ---------- history + trends ---------- */
function ensureHistory(){
  const t = today();
  const snap = {
    date:t,
    invValue: state.inventory.reduce((a,r)=>a+n(r.price),0),
    costProfit: state.sold.reduce((a,r)=>a+costProfit(r),0),
    wallet: walletBalance(),
    sales: state.sold.filter(r=>parseLocalDate(r.date).getFullYear()===new Date().getFullYear()).length
  };
  if(!state.history) state.history=[];
  const last = state.history[state.history.length-1];
  if(last && last.date===t){ Object.assign(last,snap); }
  else { state.history.push(snap); if(state.history.length>90) state.history=state.history.slice(-90); }
}
function computeTrend(key, daysBack){
  const hist = state.history||[];
  if(hist.length<2) return null;
  const idx = Math.max(0, hist.length-1-daysBack);
  const startVal = hist[idx][key];
  const endVal = hist[hist.length-1][key];
  if(idx===hist.length-1) return null;
  if(!startVal) return endVal ? null : 0;
  return ((endVal-startVal)/Math.abs(startVal))*100;
}
function renderTrend(el, pct, label){
  if(pct===null || !Number.isFinite(pct)){ el.textContent="New"; el.className="trend flat"; return; }
  const arrow = pct>=0 ? "↗" : "↘";
  el.textContent = `${arrow} ${Math.abs(pct).toFixed(1)}% ${label}`;
  el.className = "trend " + (pct>0.05?"up":pct<-0.05?"down":"flat");
}

/* ---------- sparklines ---------- */
function drawSparkline(canvas, values, color){
  if(!canvas) return;
  const dpr = devicePixelRatio||1;
  const w = canvas.clientWidth||84, h = canvas.clientHeight||32;
  canvas.width=w*dpr; canvas.height=h*dpr;
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr,0,0,dpr,0,0);
  ctx.clearRect(0,0,w,h);
  const vals = values.length ? values : [0,0];
  const max=Math.max(...vals), min=Math.min(...vals);
  const range = (max-min)||1;
  ctx.beginPath();
  vals.forEach((v,i)=>{
    const x = i/(Math.max(1,vals.length-1))*(w-4)+2;
    const y = h-4-((v-min)/range)*(h-8);
    i? ctx.lineTo(x,y): ctx.moveTo(x,y);
  });
  ctx.strokeStyle=color; ctx.lineWidth=2; ctx.lineJoin="round"; ctx.lineCap="round"; ctx.stroke();
  ctx.lineTo(w-2,h); ctx.lineTo(2,h); ctx.closePath();
  const grad=ctx.createLinearGradient(0,0,0,h);
  grad.addColorStop(0,color+"33"); grad.addColorStop(1,color+"00");
  ctx.fillStyle=grad; ctx.fill();
}

/* ---------- KPIs ---------- */
function renderKPIs(){
  const invValue=state.inventory.reduce((a,r)=>a+n(r.price),0);
  const cp=state.sold.reduce((a,r)=>a+costProfit(r),0);
  const y=new Date().getFullYear();
  const yr=state.sold.filter(r=>parseLocalDate(r.date).getFullYear()===y);
  const yrProfit=yr.reduce((a,r)=>a+profit(r),0);
  const wb=walletBalance();

  kpiInventoryValue.textContent=money(invValue);
  kpiInventoryCount.textContent=`${state.inventory.length} item${state.inventory.length===1?"":"s"}`;
  kpiCostProfit.textContent=money(cp);
  kpiWallet.textContent=money(wb);
  kpiSalesYear.textContent=yr.length;
  kpiProfitYear.textContent=`${money(yrProfit)} profit`;

  const hist=state.history||[];
  drawSparkline(sparkInv, hist.map(h=>h.invValue), "#d9922c");
  drawSparkline(sparkCP, hist.map(h=>h.costProfit), "#7c5cff");
  drawSparkline(sparkWallet, hist.map(h=>h.wallet), "#2ea862");
  drawSparkline(sparkSales, hist.map(h=>h.sales), "#3b82f6");

  renderTrend(trendInv, computeTrend("invValue",30), "vs last 30 days");
  renderTrend(trendCP, computeTrend("costProfit",30), "vs last 30 days");
  renderTrend(trendWallet, computeTrend("wallet",30), "vs last 30 days");
  renderTrend(trendSales, computeTrend("sales",365), "vs last year");
}

/* ---------- filters / year selects ---------- */
function setYearOptions(select, years, opts={}){
  const cy=new Date().getFullYear();
  let html = opts.allOption?`<option value="all">All Years</option>`:"";
  html += years.map(y=>`<option value="${y}">${y}</option>`).join("");
  const prev = select.value;
  if(select.innerHTML!==html) select.innerHTML=html;
  if(prev && [...select.options].some(o=>o.value===prev)) select.value=prev;
  else select.value = opts.allOption ? "all" : String(cy);
}
function ensureFilters(){
  const cy=new Date().getFullYear();
  const soldYears=[...new Set(state.sold.map(r=>parseLocalDate(r.date).getFullYear()))];
  const years=[...new Set([cy,...soldYears])].sort((a,b)=>b-a);
  setYearOptions(growthYear, years, {allOption:true});
  setYearOptions(monthlyYear, years);
  setYearOptions(snapYear, years, {allOption:true});
  setYearOptions(taxYear, years, {allOption:true});
  setYearOptions(soldYear, years, {allOption:true});
  const monthOpts = `<option value="all">All Months</option>`+["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].map((m,i)=>`<option value="${i}">${m}</option>`).join("");
  if(!snapMonth.innerHTML) snapMonth.innerHTML = monthOpts;
  if(!soldMonth.innerHTML) soldMonth.innerHTML = monthOpts;
  const ghtml = `<option value="all">All Years</option>` + years.map(y=>`<option value="${y}">${y===cy?"This Year":y}</option>`).join("");
  if(globalYear.innerHTML!==ghtml) globalYear.innerHTML=ghtml;
  globalYear.value = growthYear.value;
}
growthYear.onchange = snapYear.onchange = snapMonth.onchange = monthlyYear.onchange = taxYear.onchange = render;
soldYear.onchange = soldMonth.onchange = ()=>{ soldPage=1; render(); };

function bindSortHeaders(tableId, sortState, pageResetFn){
  document.querySelectorAll(`#${tableId} thead th[data-sort]`).forEach(th=>{
    th.onclick=()=>{
      const key = th.dataset.sort;
      if(sortState.key===key){ sortState.dir = sortState.dir==="asc" ? "desc" : "asc"; }
      else{ sortState.key=key; sortState.dir = (key==="title"||key==="platform") ? "asc" : "desc"; }
      pageResetFn();
      render();
    };
  });
}
function updateSortIndicators(tableId, sortState){
  document.querySelectorAll(`#${tableId} thead th[data-sort]`).forEach(th=>{
    const active = th.dataset.sort===sortState.key;
    th.classList.toggle("sorted", active);
    const arrow = th.querySelector(".sort-arrow");
    if(arrow) arrow.textContent = active ? (sortState.dir==="asc" ? "▲" : "▼") : "";
  });
}
bindSortHeaders("inventory", inventorySort, ()=>{ inventoryPage=1; });
bindSortHeaders("sold", soldSort, ()=>{ soldPage=1; });
globalYear.onchange = ()=>{
  growthYear.value=globalYear.value;
  if([...monthlyYear.options].some(o=>o.value===globalYear.value)) monthlyYear.value=globalYear.value;
  if([...snapYear.options].some(o=>o.value===globalYear.value)) snapYear.value=globalYear.value;
  render();
};
function getTaxRows(){
  return taxYear.value && taxYear.value!=="all"
    ? state.sold.filter(r=>parseLocalDate(r.date).getFullYear()===n(taxYear.value))
    : [...state.sold];
}
function getSoldRows(){
  let rows=[...state.sold];
  if(soldYear.value && soldYear.value!=="all") rows=rows.filter(r=>parseLocalDate(r.date).getFullYear()===n(soldYear.value));
  if(soldMonth.value && soldMonth.value!=="all") rows=rows.filter(r=>parseLocalDate(r.date).getMonth()===n(soldMonth.value));
  return rows;
}

/* ---------- sold snapshot ---------- */
function renderSnapshot(){
  let rows=[...state.sold];
  if(snapYear.value && snapYear.value!=="all") rows=rows.filter(r=>parseLocalDate(r.date).getFullYear()===n(snapYear.value));
  if(snapMonth.value && snapMonth.value!=="all") rows=rows.filter(r=>parseLocalDate(r.date).getMonth()===n(snapMonth.value));
  const income=rows.reduce((a,r)=>a+n(r.price),0);
  const totalProfit=rows.reduce((a,r)=>a+profit(r),0);
  snapItems.textContent=rows.length;
  snapIncome.textContent=money(income);
  snapCP.textContent=money(rows.reduce((a,r)=>a+costProfit(r),0));
  snapProfit.textContent=money(totalProfit);
  snapAvg.textContent=money(rows.length ? income/rows.length : 0);
  snapMargin.textContent = income>0 ? `${((totalProfit/income)*100).toFixed(1)}%` : "0%";

  const groups={Mercari:{c:0,v:0},eBay:{c:0,v:0},Private:{c:0,v:0},Other:{c:0,v:0}};
  rows.forEach(r=>{
    const key = /mercari/i.test(r.platform)?"Mercari": /ebay/i.test(r.platform)?"eBay": /private/i.test(r.platform)?"Private":"Other";
    groups[key].c++; groups[key].v+=n(r.price);
  });
  const total=rows.length||1;
  const colorMap={Mercari:"var(--orange)",eBay:"var(--blue)",Private:"var(--green)",Other:"#a1a8b3"};
  const order=["Mercari","eBay","Private","Other"].filter(k=>groups[k].c>0);
  platformStack.innerHTML = order.length ? order.map(k=>`<span title="${k}: ${groups[k].c} item${groups[k].c===1?'':'s'} (${(groups[k].c/total*100).toFixed(1)}%) • ${money(groups[k].v)}" style="width:${(groups[k].c/total*100).toFixed(2)}%;background:${colorMap[k]}"></span>`).join("") : `<span style="width:100%;background:var(--line)"></span>`;
  platformLegend.innerHTML = order.length ? order.map(k=>`<div class="p-row"><i class="dot" style="background:${colorMap[k]}"></i>${k} <small>${groups[k].c} (${(groups[k].c/total*100).toFixed(1)}%)</small><b>${money(groups[k].v)}</b></div>`).join("") : `<div class="p-row"><small>No sales yet in this range.</small></div>`;

  const taxRows = getTaxRows();
  taxIncome.textContent=money(taxRows.reduce((a,r)=>a+n(r.price),0));
  taxCost.textContent=money(taxRows.reduce((a,r)=>a+n(r.cost),0));
  taxFees.textContent=money(taxRows.reduce((a,r)=>a+n(r.fees),0));
  const grossProfit = taxRows.reduce((a,r)=>a+profit(r),0);
  taxProfit.textContent=money(grossProfit);
  const yearExpenses = expensesForYear(taxYear.value||"all").reduce((a,t)=>a+n(t.amount),0);
  taxExpenses.textContent=money(yearExpenses);
  taxNet.textContent=money(grossProfit - yearExpenses);
}

/* ---------- tables ---------- */
const ROW_ICONS = {
  edit: '<svg viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>',
  hold: '<svg viewBox="0 0 24 24"><path d="M6 3h12v18l-6-4-6 4V3Z"/></svg>',
  sell: '<svg viewBox="0 0 24 24"><path d="M20.59 13.41 12 22l-9-9 8.59-8.59A2 2 0 0 1 13 4h5a2 2 0 0 1 2 2v5a2 2 0 0 1-.41 1.41Z"/><circle cx="16.5" cy="7.5" r="1"/></svg>',
  trash: '<svg viewBox="0 0 24 24"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>',
  restore: '<svg viewBox="0 0 24 24"><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 3v6h6"/></svg>',
  search: '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>',
  box: '<svg viewBox="0 0 24 24"><path d="M3 8l9-5 9 5-9 5-9-5Z"/><path d="M3 8v8l9 5 9-5V8"/></svg>',
  check: '<svg viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>',
  star: '<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01Z"/></svg>'
};
function emptyState(icon, title, sub, colspan){
  return `<tr><td colspan="${colspan}" class="empty-state-cell"><div class="empty-state"><div class="empty-state-icon">${ROW_ICONS[icon]}</div><b>${title}</b><p>${sub}</p></div></td></tr>`;
}
function categoryPill(cat){
  const c = cat || "Other";
  const styles = {
    Comic: "background:var(--sky-bg);color:var(--sky-ic)",
    Card: "background:var(--violet-bg);color:var(--violet-ic)",
    Other: "background:var(--surface2);color:var(--muted)"
  };
  return `<span class="cat-pill" style="${styles[c]||styles.Other}">${c}</span>`;
}
function rowTitle(r){return `<strong>${r.title}</strong>${categoryPill(r.category)}`}
function marginPct(r){
  const price = n(r.price);
  if(!price) return null;
  return Math.round((profit(r)/price)*100);
}
function profitCell(r){
  const m = marginPct(r);
  return `${money(profit(r))}${m!==null?`<small class="margin-chip">${m}%</small>`:""}`;
}
function checkComps(kind, id){
  const item = (state[kind]||[]).find(x=>x.id===id);
  if(!item) return;
  const url = "https://www.ebay.com/sch/i.html?_nkw=" + encodeURIComponent(item.title) + "&LH_Sold=1&LH_Complete=1";
  window.open(url, "_blank", "noopener");
}
function ageDays(ts){ return ts ? Math.floor((Date.now()-ts)/86400000) : null; }
function ageChip(ts, warnAt){
  const d = ageDays(ts);
  if(d===null) return `<span class="age-chip">—</span>`;
  const label = d<1 ? "Today" : d===1 ? "1 day" : `${d} days`;
  return `<span class="age-chip${warnAt && d>warnAt ? ' warn':''}">${label}</span>`;
}
const INV_PAGE_SIZE = 25;
const SOLD_PAGE_SIZE = 25;
let inventoryPage = 1;
let soldPage = 1;
function sortRows(rows, sortState){
  const {key, dir} = sortState;
  const mult = dir==="asc" ? 1 : -1;
  return [...rows].sort((a,b)=>{
    let av, bv;
    if(key==="title" || key==="platform"){
      av=(a[key]||"").toLowerCase(); bv=(b[key]||"").toLowerCase();
      return av<bv ? -1*mult : av>bv ? 1*mult : 0;
    }
    if(key==="date"){ av=parseLocalDate(a.date).getTime()||0; bv=parseLocalDate(b.date).getTime()||0; }
    else if(key==="addedAt"){ av=a.addedAt||0; bv=b.addedAt||0; }
    else if(key==="profit"){ av=profit(a); bv=profit(b); }
    else { av=n(a[key]); bv=n(b[key]); }
    return (av-bv)*mult;
  });
}
function sortedInventory(){
  return sortRows(state.inventory, inventorySort);
}
function renderRows(){
  const invSorted = sortedInventory();
  const totalPages = Math.max(1, Math.ceil(invSorted.length / INV_PAGE_SIZE));
  if(inventoryPage>totalPages) inventoryPage=totalPages;
  if(inventoryPage<1) inventoryPage=1;
  const start = (inventoryPage-1)*INV_PAGE_SIZE;
  const pageItems = invSorted.slice(start, start+INV_PAGE_SIZE);

  inventoryRows.innerHTML=pageItems.map(r=>`<tr id="row-inventory-${r.id}">
    <td>${rowTitle(r)}</td><td data-label="Platform">${r.platform}</td><td data-label="Price">${money(r.price)}</td><td data-label="Cost">${money(r.cost)}</td><td data-label="Profit" class="${profit(r)>=0?'profit':'loss'}">${profitCell(r)}</td>
    <td data-label="Listed">${ageChip(r.addedAt, 45)}</td>
    <td><div class="row-actions"><button class="icon-btn" onclick='openModal(${attrSafe(r)},"inventory")' title="Edit">${ROW_ICONS.edit}</button><button class="icon-btn" onclick="checkComps('inventory','${r.id}')" title="Check eBay sold comps">${ROW_ICONS.search}</button><button class="icon-btn" onclick="moveToHold('${r.id}')" title="Move to Holds">${ROW_ICONS.hold}</button><button class="icon-btn" onclick="markSold('${r.id}')" title="Mark Sold">${ROW_ICONS.sell}</button><button class="icon-btn" onclick="delFrom('inventory','${r.id}')" title="Delete">${ROW_ICONS.trash}</button></div></td>
  </tr>`).join("") || emptyState("box","No active inventory yet","Add your first item or paste a listing from the bookmarklet to get started.",7);

  const count = invSorted.length;
  const shownStart = count ? start+1 : 0;
  const shownEnd = Math.min(count, start+INV_PAGE_SIZE);
  invPageInfo.textContent = count ? `Showing ${shownStart}\u2013${shownEnd} of ${count} items` : "No items";
  invPageTotal.textContent = totalPages;
  invCountBadge.textContent = `${count} item${count===1?"":"s"}`;
  const invTotalCost = invSorted.reduce((a,r)=>a+n(r.cost),0);
  const invTotalValue = invSorted.reduce((a,r)=>a+n(r.price),0);
  invTotalsBadge.textContent = count ? `Total cost ${money(invTotalCost)} \u00b7 Total value ${money(invTotalValue)}` : "";
  const optsHtml = Array.from({length:totalPages},(_,i)=>`<option value="${i+1}">${i+1}</option>`).join("");
  if(invPageSelect.innerHTML!==optsHtml) invPageSelect.innerHTML=optsHtml;
  invPageSelect.value = String(inventoryPage);
  invPrevBtn.disabled = inventoryPage<=1;
  invNextBtn.disabled = inventoryPage>=totalPages;
  updateSortIndicators("inventory", inventorySort);

  holdsCountBadge.textContent = `${state.holds.length} on hold`;
  const holdsTotalCost = state.holds.reduce((a,r)=>a+n(r.cost),0);
  const holdsTotalValue = state.holds.reduce((a,r)=>a+n(r.price),0);
  holdsTotalsBadge.textContent = state.holds.length ? `Total cost ${money(holdsTotalCost)} \u00b7 Total value ${money(holdsTotalValue)}` : "";
  holdRows.innerHTML=state.holds.map(r=>`<tr id="row-holds-${r.id}">
    <td>${rowTitle(r)}</td><td data-label="Platform">${r.platform}</td><td data-label="Price">${money(r.price)}</td><td data-label="Cost">${money(r.cost)}</td>
    <td data-label="On Hold">${ageChip(r.heldAt, 14)}</td>
    <td><div class="row-actions"><button class="icon-btn" onclick="checkComps('holds','${r.id}')" title="Check eBay sold comps">${ROW_ICONS.search}</button><button class="icon-btn" onclick="moveHoldBack('${r.id}')" title="Move back to Inventory">${ROW_ICONS.restore}</button><button class="icon-btn" onclick="delFrom('holds','${r.id}')" title="Delete">${ROW_ICONS.trash}</button></div></td>
  </tr>`).join("") || emptyState("hold","Nothing on hold","Items you set aside for a buyer's decision will show up here.",6);

  const soldSorted = sortRows(getSoldRows(), soldSort);
  const soldTotalPages = Math.max(1, Math.ceil(soldSorted.length / SOLD_PAGE_SIZE));
  if(soldPage>soldTotalPages) soldPage=soldTotalPages;
  if(soldPage<1) soldPage=1;
  const soldStart = (soldPage-1)*SOLD_PAGE_SIZE;
  const soldPageItems = soldSorted.slice(soldStart, soldStart+SOLD_PAGE_SIZE);

  soldRows.innerHTML=soldPageItems.map(r=>`<tr id="row-sold-${r.id}">
    <td>${rowTitle(r)}</td><td data-label="Date">${r.date||""}</td><td data-label="Platform">${r.platform}</td><td data-label="Sold Price">${money(r.price)}</td><td data-label="Cost">${money(r.cost)}</td><td data-label="Fees">${money(r.fees)}</td><td data-label="Profit" class="${profit(r)>=0?'profit':'loss'}">${profitCell(r)}</td>
    <td><div class="row-actions"><button class="icon-btn" onclick='openModal(${attrSafe(r)},"sold")' title="Edit">${ROW_ICONS.edit}</button><button class="icon-btn" onclick="moveSoldBack('${r.id}')" title="Move back to Inventory">${ROW_ICONS.restore}</button><button class="icon-btn" onclick="delFrom('sold','${r.id}')" title="Delete">${ROW_ICONS.trash}</button></div></td>
  </tr>`).join("") || emptyState("check","No sold items match this filter","Once you mark something sold, it'll show up here.",8);

  const soldCount = soldSorted.length;
  const soldShownStart = soldCount ? soldStart+1 : 0;
  const soldShownEnd = Math.min(soldCount, soldStart+SOLD_PAGE_SIZE);
  soldPageInfo.textContent = soldCount ? `Showing ${soldShownStart}\u2013${soldShownEnd} of ${soldCount} items` : "No items";
  soldCountBadge.textContent = `${soldCount} item${soldCount===1?"":"s"} sold`;
  soldPageTotal.textContent = soldTotalPages;
  const soldOptsHtml = Array.from({length:soldTotalPages},(_,i)=>`<option value="${i+1}">${i+1}</option>`).join("");
  if(soldPageSelect.innerHTML!==soldOptsHtml) soldPageSelect.innerHTML=soldOptsHtml;
  soldPageSelect.value = String(soldPage);
  soldPrevBtn.disabled = soldPage<=1;
  soldNextBtn.disabled = soldPage>=soldTotalPages;
  updateSortIndicators("sold", soldSort);
}
invPrevBtn.onclick=()=>{ if(inventoryPage>1){ inventoryPage--; renderRows(); } };
invNextBtn.onclick=()=>{ inventoryPage++; renderRows(); };
invPageSelect.onchange=()=>{ inventoryPage=n(invPageSelect.value)||1; renderRows(); };
soldPrevBtn.onclick=()=>{ if(soldPage>1){ soldPage--; renderRows(); } };
soldNextBtn.onclick=()=>{ soldPage++; renderRows(); };
soldPageSelect.onchange=()=>{ soldPage=n(soldPageSelect.value)||1; renderRows(); };
function yearStats(year){
  const rows = state.sold.filter(r=>r.date && parseLocalDate(r.date).getFullYear()===year);
  const totalProfit = rows.reduce((a,r)=>a+profit(r),0);
  const revenue = rows.reduce((a,r)=>a+n(r.price),0);
  return {
    count: rows.length,
    profit: totalProfit,
    revenue,
    avgSale: rows.length ? revenue/rows.length : 0
  };
}
function yoyDelta(cur, prev){
  if(!prev) return `<small class="yoy-delta muted">\u2014</small>`;
  const pct = Math.round(((cur-prev)/Math.abs(prev))*100);
  const up = pct>=0;
  return `<small class="yoy-delta ${up?'profit':'loss'}">${up?'\u2197':'\u2198'} ${Math.abs(pct)}%</small>`;
}
function renderYoY(){
  const selected = taxYear.value && taxYear.value!=="all" ? n(taxYear.value) : new Date().getFullYear();
  const prev = selected - 1;
  const cur = yearStats(selected), last = yearStats(prev);
  yoyTitle.textContent = `${selected} vs ${prev}`;
  if(!cur.count && !last.count){
    yoyBody.innerHTML = `<p class="muted">No sales in either year yet.</p>`;
    return;
  }
  yoyBody.innerHTML = `
    <div class="yoy-grid">
      <div><small>Items Sold</small><b>${cur.count}</b>${yoyDelta(cur.count,last.count)}<span class="yoy-prev">${prev}: ${last.count}</span></div>
      <div><small>Revenue</small><b>${money(cur.revenue)}</b>${yoyDelta(cur.revenue,last.revenue)}<span class="yoy-prev">${prev}: ${money(last.revenue)}</span></div>
      <div><small>Profit</small><b>${money(cur.profit)}</b>${yoyDelta(cur.profit,last.profit)}<span class="yoy-prev">${prev}: ${money(last.profit)}</span></div>
      <div><small>Avg Sale</small><b>${money(cur.avgSale)}</b>${yoyDelta(cur.avgSale,last.avgSale)}<span class="yoy-prev">${prev}: ${money(last.avgSale)}</span></div>
    </div>`;
}

function renderCategoryBreakdown(){
  const rows = getTaxRows();
  const cats={};
  rows.forEach(r=>{
    const key=r.category||"Other";
    cats[key]=cats[key]||{count:0,profit:0,income:0};
    cats[key].count++; cats[key].profit+=profit(r); cats[key].income+=n(r.price);
  });
  const maxProfit=Math.max(1,...Object.values(cats).map(c=>Math.abs(c.profit)));
  const catOrder=Object.keys(cats).sort((a,b)=>cats[b].profit-cats[a].profit);
  categoryBreakdown.innerHTML = catOrder.length ? catOrder.map(k=>{
    const c=cats[k];
    const pct=Math.max(4,(Math.abs(c.profit)/maxProfit)*100);
    return `<div class="cat-row"><span class="cat-name">${k}</span><span class="cat-bar"><span style="width:${pct}%;background:${c.profit>=0?'var(--green)':'var(--red)'}"></span></span><span class="cat-count">${c.count} sold • ${money(c.income)}</span><span class="cat-profit ${c.profit>=0?'profit':'loss'}">${money(c.profit)}</span></div>`;
  }).join("") : `<p class="muted">No sales yet to break down by category.</p>`;

  const plats={};
  rows.forEach(r=>{
    const key = /mercari/i.test(r.platform)?"Mercari": /ebay/i.test(r.platform)?"eBay": /private/i.test(r.platform)?"Private Sale":(r.platform||"Other");
    plats[key]=plats[key]||{count:0,profit:0,income:0};
    plats[key].count++; plats[key].profit+=profit(r); plats[key].income+=n(r.price);
  });
  const maxP=Math.max(1,...Object.values(plats).map(c=>Math.abs(c.profit)));
  const platOrder=Object.keys(plats).sort((a,b)=>plats[b].income-plats[a].income);
  platformBreakdown.innerHTML = platOrder.length ? platOrder.map(k=>{
    const c=plats[k];
    const pct=Math.max(4,(Math.abs(c.profit)/maxP)*100);
    return `<div class="cat-row"><span class="cat-name">${k}</span><span class="cat-bar"><span style="width:${pct}%;background:${c.profit>=0?'var(--blue)':'var(--red)'}"></span></span><span class="cat-count">${c.count} sold • ${money(c.income)}</span><span class="cat-profit ${c.profit>=0?'profit':'loss'}">${money(c.profit)}</span></div>`;
  }).join("") : `<p class="muted">No sales yet to break down by platform.</p>`;
}

/* ---------- activity ---------- */
function renderActivity(){
  const items=[...(state.activity||[])].sort((a,b)=>b.ts-a.ts).slice(0,4);
  activityList.innerHTML = items.length ? items.map(x=>`
    <div class="activity-item">
      <div class="activity-dot ${x.color||'gold'}">${x.icon||'•'}</div>
      <div><strong>${x.text}</strong>${x.sub?`<small>${x.sub}</small>`:""}</div>
      <span class="when">${timeAgo(x.ts)}</span>
    </div>`).join("") : `<p class="muted">No activity yet — add or sell an item to see it here.</p>`;
}

/* ---------- alerts ---------- */
function computeAlerts(){
  const list=[];
  const wb=walletBalance();
  if(wb<0) list.push({level:"warn",title:"Stash balance is negative",text:`Your stash is at ${money(wb)}. Adjust your reinvestment mode or sell held inventory to recover.`});
  const staleHolds = state.holds.filter(h=>h.heldAt && (Date.now()-h.heldAt)/86400000>14);
  if(staleHolds.length) list.push({level:"warn",title:`${staleHolds.length} item${staleHolds.length===1?"":"s"} on hold over 14 days`,text:"Revisit these holds — move them back to inventory or make a decision."});
  const zeroCost = state.inventory.filter(r=>!n(r.cost)).length;
  if(zeroCost) list.push({level:"info",title:`${zeroCost} inventory item${zeroCost===1?"":"s"} missing a cost`,text:"Add cost data so profit and wallet math stay accurate."});
  const zeroCostSold = state.sold.filter(r=>!n(r.cost)).length;
  if(zeroCostSold) list.push({level:"info",title:`${zeroCostSold} sold item${zeroCostSold===1?"":"s"} missing a cost`,text:"Missing cost data can understate your tax report totals."});
  if(!list.length) list.push({level:"ok",title:"Everything looks good",text:"No alerts right now — keep listing!"});
  return list;
}
function renderAlerts(){
  const list=computeAlerts();
  const active=list.filter(a=>a.level!=="ok");
  alertBadge.hidden = active.length===0; alertBadge.textContent=active.length;
  bellBadge.hidden = active.length===0; bellBadge.textContent=active.length;
  alertsList.innerHTML=list.map(a=>`<div class="alert-row ${a.level}"><div class="a-icon">${a.level==="warn"?"!":a.level==="ok"?"✓":"i"}</div><div><b>${a.title}</b><p>${a.text}</p></div></div>`).join("");
}

/* ---------- wallet pages ---------- */
/* ---------- stash transactions ---------- */
let txnKind = "withdraw";
function openTxnModal(kind){
  txnKind = kind;
  const titles = {withdraw:"Withdraw from Stash", deposit:"Deposit into Stash", expense:"Log a Business Expense"};
  const hints = {
    withdraw:"Money you're taking out to keep — moves from the Stash to your pocket.",
    deposit:"Personal money you're adding to the Stash to spend on inventory.",
    expense:"Supplies, shipping materials, subscriptions — business costs paid from the Stash. Counted in your tax report too."
  };
  txnModalTitle.textContent = titles[kind];
  txnModalHint.textContent = hints[kind];
  txnCategory.hidden = kind!=="expense";
  txnAmount.value = "";
  txnNote.value = "";
  txnModal.showModal();
  txnAmount.focus();
}
depositBtn.onclick = ()=>openTxnModal("deposit");
withdrawBtn.onclick = ()=>openTxnModal("withdraw");
expenseBtn.onclick = ()=>openTxnModal("expense");
cancelTxnModal.onclick = ()=>txnModal.close();
txnForm.onsubmit = (e)=>{
  const amount = n(txnAmount.value);
  if(!(amount>0)){ e.preventDefault(); return; }
  const txn = {
    id: uid(), type: txnKind, amount,
    note: txnNote.value.trim(), date: today(), ts: Date.now()
  };
  if(txnKind==="expense") txn.category = txnCategory.value;
  state.transactions.push(txn);
  const verbs = {withdraw:"Withdrew ", deposit:"Deposited ", expense:"Expense "};
  logActivity(
    verbs[txnKind] + money(amount),
    txnKind==="expense" ? (txnCategory.value + (txn.note ? " \u00b7 " + txn.note : ""))
      : (txn.note || (txnKind==="withdraw" ? "Moved to pocket" : "Personal funds added")),
    txnKind==="deposit" ? "mint" : "peach", "wallet"
  );
  save(); render();
};
reconcileBtn.onclick = ()=>{
  const current = walletBalance();
  const input = prompt(`Your Stash currently shows ${money(current)}.\n\nEnter your actual bank balance for this hobby, and I'll add one adjustment transaction to make the Stash match it exactly:`);
  if(input===null) return;
  const target = parseFloat(String(input).replace(/[^0-9.\-]/g,""));
  if(!Number.isFinite(target)){ alert("That doesn't look like a number."); return; }
  const diff = target - current;
  if(Math.abs(diff) < 0.005){ alert("Already matching — nothing to adjust."); return; }
  state.transactions.push({
    id: uid(), type: diff>0 ? "deposit" : "withdraw", amount: Math.abs(diff),
    note: "Balance sync to bank", date: today(), ts: Date.now()
  });
  logActivity("Synced Stash to bank balance", money(target), "sky", "wallet");
  save(); render();
};
function deleteTxn(id){
  const t = state.transactions.find(x=>x.id===id);
  if(!t) return;
  if(!confirm(`Delete this ${t.type} of ${money(t.amount)}? The Stash balance will change accordingly.`)) return;
  state.transactions = state.transactions.filter(x=>x.id!==id);
  save(); render();
}
function renderTxns(){
  const txns = [...(state.transactions||[])].sort((a,b)=>(b.ts||0)-(a.ts||0));
  if(!txns.length){
    txnList.innerHTML = `<p class="muted">No deposits, withdrawals, or expenses yet. Use the buttons above when money moves — or "Sync to Bank" to set your starting balance.</p>`;
    return;
  }
  const labels = {deposit:"Deposit", withdraw:"Withdrawal", expense:"Expense"};
  txnList.innerHTML = txns.map(t=>`
    <div class="txn-row">
      <span class="txn-badge ${t.type}">${t.type==="deposit" ? "+" : "\u2212"}</span>
      <div class="txn-body">
        <b>${labels[t.type]||t.type} \u00b7 ${money(t.amount)}${t.type==="expense" && t.category ? ` \u00b7 ${t.category}` : ""}</b>
        <small>${t.date||""}${t.note ? " \u00b7 " + t.note : ""}</small>
      </div>
      <button class="icon-btn" onclick="deleteTxn('${t.id}')" title="Delete">${ROW_ICONS.trash}</button>
    </div>`).join("");
}

function renderWallet(){
  const wb=walletBalance();
  const buying=Math.max(0,wb);
  const reserved=reservedProfit();
  const personal=personalInvestment();
  [rwAvailable,reAvailable].forEach(el=>el.textContent=money(wb));
  [rwBuying,reBuying].forEach(el=>el.textContent=money(buying));
  drawerWallet.textContent=money(wb);
  drawerBuying.textContent=money(buying);
  drawerReserved.textContent=money(reserved);

  rwPersonalNote.hidden = personal<=0;
  rwPersonal.textContent = money(personal);
  personalInvestCard.hidden = personal<=0;
  drawerPersonal.textContent = money(personal);

  const thisMonth=new Date();
  const spent = [...state.inventory,...state.holds,...state.sold]
    .filter(r=>r.addedAt && sameMonth(new Date(r.addedAt),thisMonth))
    .reduce((a,r)=>a+n(r.cost),0);
  [rwSpent,reSpent].forEach(el=>el.textContent=money(spent));
  document.querySelectorAll("[data-mode]").forEach(b=>b.classList.toggle("active", n(b.dataset.mode)===state.walletMode));
}
document.querySelectorAll("[data-mode]").forEach(b=>b.onclick=()=>{ state.walletMode=n(b.dataset.mode); save(); render(); });

function renderTopComic(){
  const comics = state.sold.filter(r=>r.category==="Comic");
  if(!comics.length){
    topComicCard.innerHTML = `<p class="muted">No comics sold yet — your top sale will show up here once you do.</p>`;
    return;
  }
  const top = comics.reduce((best,r)=> profit(r)>profit(best) ? r : best, comics[0]);
  const p = profit(top);
  topComicCard.innerHTML = `
    <div class="top-comic-icon">${ROW_ICONS.star}</div>
    <div class="top-comic-body">
      <div class="top-comic-title">${top.title}</div>
      <div class="top-comic-profit ${p>=0?'profit':'loss'}">${money(p)} profit</div>
      <div class="top-comic-meta">${top.platform} • ${top.date||""} • sold for ${money(top.price)}</div>
    </div>`;
}

/* ---------- charts ---------- */
function fmtShort(v){ return v>=1000 ? "$"+(v/1000).toFixed(v%1000?1:0)+"K" : "$"+Math.round(v); }
function niceCeil(v){
  if(v<=0) return 10;
  const pow=Math.pow(10,Math.floor(Math.log10(v)));
  const rel=v/pow;
  let m; if(rel<=1)m=1; else if(rel<=2)m=2; else if(rel<=5)m=5; else m=10;
  return m*pow;
}
function drawSmoothPath(ctx, pts){
  if(!pts.length) return;
  if(pts.length===1){ ctx.moveTo(pts[0].x,pts[0].y); ctx.lineTo(pts[0].x,pts[0].y); return; }
  ctx.moveTo(pts[0].x, pts[0].y);
  if(pts.length===2){ ctx.lineTo(pts[1].x, pts[1].y); return; }
  for(let i=0;i<pts.length-1;i++){
    const p0 = pts[i-1] || pts[i];
    const p1 = pts[i];
    const p2 = pts[i+1];
    const p3 = pts[i+2] || p2;
    const cp1x = p1.x + (p2.x-p0.x)/6, cp1y = p1.y + (p2.y-p0.y)/6;
    const cp2x = p2.x - (p3.x-p1.x)/6, cp2y = p2.y - (p3.y-p1.y)/6;
    ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
  }
}
function themeVar(name, fallback){
  const v = getComputedStyle(document.documentElement).getPropertyValue(name);
  return (v && v.trim()) || fallback;
}
function drawLineChart(canvas, series, colors, labels, opts={}){
  const w=canvas.clientWidth, h=canvas.clientHeight;
  if(!w||!h) return null;
  const dpr=devicePixelRatio||1;
  canvas.width=w*dpr; canvas.height=h*dpr;
  const ctx=canvas.getContext("2d");
  ctx.setTransform(dpr,0,0,dpr,0,0);
  ctx.clearRect(0,0,w,h);
  const padL=42,padR=8,padT=10,padB=22;
  const max=Math.max(1,...series.flat(),opts.goal||0);
  const niceMax=niceCeil(max*1.05);
  const gridColor=themeVar("--line","#e7eaef"), mutedColor=themeVar("--muted","#6b7480");
  ctx.strokeStyle=gridColor; ctx.fillStyle=mutedColor; ctx.font="11px Inter, sans-serif"; ctx.lineWidth=1;
  const steps=4;
  for(let i=0;i<=steps;i++){
    const y=padT+(h-padT-padB)*(1-i/steps);
    ctx.beginPath();ctx.moveTo(padL,y);ctx.lineTo(w-padR,y);ctx.stroke();
    ctx.fillText(fmtShort(niceMax*i/steps),2,y+4);
  }
  const len=series[0].length;
  const lbls = labels && labels.length===len ? labels : Array.from({length:len},(_,i)=>String(i+1));
  const skip = Math.max(1, Math.ceil(len/12));
  lbls.forEach((lab,i)=>{
    if(i%skip!==0 && i!==len-1) return;
    const x=padL+(w-padL-padR)*(i/Math.max(1,len-1));
    ctx.fillStyle=mutedColor;
    ctx.fillText(lab, x-9, h-6);
  });
  series.forEach((s,si)=>{
    const pts = s.map((v,i)=>({
      x: padL+(w-padL-padR)*(i/Math.max(1,s.length-1)),
      y: padT+(h-padT-padB)*(1-Math.max(0,v)/niceMax)
    }));
    ctx.beginPath();
    drawSmoothPath(ctx, pts);
    ctx.strokeStyle=colors[si]; ctx.lineWidth=2.5; ctx.lineJoin="round"; ctx.lineCap="round"; ctx.stroke();
    if(opts.dots){
      ctx.fillStyle=colors[si];
      s.forEach((v,i)=>{
        const x=padL+(w-padL-padR)*(i/Math.max(1,s.length-1));
        const y=padT+(h-padT-padB)*(1-Math.max(0,v)/niceMax);
        ctx.beginPath(); ctx.arc(x,y,2.6,0,Math.PI*2); ctx.fill();
      });
    }
  });
  if(opts.goal>0){
    const gy=padT+(h-padT-padB)*(1-opts.goal/niceMax);
    ctx.setLineDash([4,4]); ctx.strokeStyle="#c9432f"; ctx.lineWidth=1.5;
    ctx.beginPath(); ctx.moveTo(padL,gy); ctx.lineTo(w-padR,gy); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle="#c9432f"; ctx.textAlign="right"; ctx.fillText(`${money(opts.goal)} Goal`, w-padR, gy-6); ctx.textAlign="left";
  }
  const meta={padL,padR,padT,padB,niceMax,w,h,len};
  canvas._chartMeta=meta;
  return meta;
}
function monthlySeries(year){
  const income=Array(12).fill(0), cost=Array(12).fill(0), profitArr=Array(12).fill(0), counts=Array(12).fill(0), costProfitArr=Array(12).fill(0);
  state.sold.forEach(r=>{
    const d=parseLocalDate(r.date); if(d.getFullYear()!==year) return;
    const m=d.getMonth();
    income[m]+=n(r.price); cost[m]+=n(r.cost); profitArr[m]+=profit(r); counts[m]++; costProfitArr[m]+=costProfit(r);
  });
  return {income,cost,profitArr,counts,costProfitArr};
}
const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
function monthSpanSeries(){
  const now = new Date();
  const validDates = state.sold.map(r=>parseLocalDate(r.date)).filter(d=>!isNaN(d));
  let startY = now.getFullYear(), startM = 0;
  if(validDates.length){
    const minD = new Date(Math.min(...validDates.map(d=>d.getTime())));
    startY = minD.getFullYear(); startM = minD.getMonth();
  }
  const endY = now.getFullYear(), endM = 11;
  const months=[];
  let y=startY, m=startM;
  while(y<endY || (y===endY && m<=endM)){
    months.push({y,m});
    m++; if(m>11){ m=0; y++; }
  }
  const idxOf = new Map(months.map((mm,i)=>[`${mm.y}-${mm.m}`,i]));
  const income=months.map(()=>0), cost=months.map(()=>0), profitArr=months.map(()=>0);
  state.sold.forEach(r=>{
    const d=parseLocalDate(r.date); if(isNaN(d)) return;
    const idx=idxOf.get(`${d.getFullYear()}-${d.getMonth()}`);
    if(idx===undefined) return;
    income[idx]+=n(r.price); cost[idx]+=n(r.cost); profitArr[idx]+=profit(r);
  });
  const labels = months.map(mm=>`${MONTH_NAMES[mm.m]} '${String(mm.y).slice(2)}`);
  const tipLabels = months.map(mm=>`${MONTH_NAMES[mm.m]} ${mm.y}`);
  return {income,cost,profitArr,labels,tipLabels};
}
function drawGrowthChart(){
  const yearSel = growthYear.value;
  const cum = arr=>{ let s=0; return arr.map(v=>s+=v); };
  let incomeC,costC,profitC,labels,tipLabels;
  if(yearSel==="all"){
    const s=monthSpanSeries();
    incomeC=cum(s.income); costC=cum(s.cost); profitC=cum(s.profitArr);
    labels=s.labels; tipLabels=s.tipLabels;
  }else{
    const year=n(yearSel)||new Date().getFullYear();
    const {income,cost,profitArr}=monthlySeries(year);
    incomeC=cum(income); costC=cum(cost); profitC=cum(profitArr);
    labels=MONTH_NAMES; tipLabels=MONTH_NAMES.map(m=>`${m} ${year}`);
  }
  const meta = drawLineChart(growthChart, [incomeC,costC,profitC], ["#e8a33d","#3f7fc9","#3f9d63"], labels);
  growthChart._series = {incomeC,costC,profitC,tipLabels};
  return meta;
}
function renderCharts(){
  drawGrowthChart();
  const year = n(monthlyYear.value)||new Date().getFullYear();
  const {profitArr,counts,costProfitArr} = monthlySeries(year);
  drawLineChart(monthlyChart, [profitArr,costProfitArr], ["#3f9d63","#7c5cff"], MONTH_NAMES, {dots:true, goal: state.monthlyGoal||300});
  monthlyChart._monthlyData = {profitArr,counts,costProfitArr,year,goal:state.monthlyGoal||300};
}
growthChart.addEventListener("mousemove", e=>{
  const meta=growthChart._chartMeta, s=growthChart._series;
  if(!meta||!s) return;
  const rect=growthChart.getBoundingClientRect();
  const x=e.clientX-rect.left;
  let idx=Math.round((x-meta.padL)/((meta.w-meta.padL-meta.padR)/Math.max(1,meta.len-1)));
  idx=Math.max(0,Math.min(meta.len-1,idx));
  growthTip.innerHTML=`<b>${s.tipLabels[idx]}</b>
    <div><span>Total Income</span><span>${money(s.incomeC[idx])}</span></div>
    <div><span>Cost of Sold</span><span>${money(s.costC[idx])}</span></div>
    <div><span>Profit</span><span>${money(s.profitC[idx])}</span></div>`;
  const tipX = meta.padL+(meta.w-meta.padL-meta.padR)*(idx/Math.max(1,meta.len-1));
  const tipY = meta.padT+(meta.h-meta.padT-meta.padB)*(1-s.incomeC[idx]/meta.niceMax);
  growthTip.style.left=tipX+"px";
  growthTip.style.top=Math.max(0,tipY-70)+"px";
  growthTip.hidden=false;
});
growthChart.addEventListener("mouseleave",()=>growthTip.hidden=true);

monthlyChart.addEventListener("mousemove", e=>{
  const meta=monthlyChart._chartMeta, d=monthlyChart._monthlyData;
  if(!meta||!d) return;
  const rect=monthlyChart.getBoundingClientRect();
  const x=e.clientX-rect.left;
  let idx=Math.round((x-meta.padL)/((meta.w-meta.padL-meta.padR)/Math.max(1,meta.len-1)));
  idx=Math.max(0,Math.min(meta.len-1,idx));
  const val=d.profitArr[idx], cnt=d.counts[idx], cp=d.costProfitArr[idx];
  const diff=val-d.goal;
  monthlyTip.innerHTML=`<b>${MONTH_NAMES[idx]} ${d.year}</b>
    <div><span>Profit</span><span>${money(val)}</span></div>
    <div><span>Cost + Profit</span><span>${money(cp)}</span></div>
    <div><span>Items Sold</span><span>${cnt}</span></div>
    <div><span>${diff>=0?"Above Goal":"Below Goal"}</span><span>${diff>=0?"+":""}${money(diff)}</span></div>`;
  const tipX = meta.padL+(meta.w-meta.padL-meta.padR)*(idx/Math.max(1,meta.len-1));
  const topVal = Math.max(val,cp);
  const tipY = meta.padT+(meta.h-meta.padT-meta.padB)*(1-Math.max(0,topVal)/meta.niceMax);
  monthlyTip.style.left=tipX+"px";
  monthlyTip.style.top=Math.max(0,tipY-100)+"px";
  monthlyTip.hidden=false;
});
monthlyChart.addEventListener("mouseleave",()=>monthlyTip.hidden=true);

/* ---------- header / status / footer ---------- */
function checkStorageHealthy(){
  try{ localStorage.setItem("__rz_test","1"); localStorage.removeItem("__rz_test"); return true; }
  catch(e){ return false; }
}
function pulseFor(regex){
  const now=new Date();
  const avg=arr=>arr.length?arr.reduce((a,r)=>a+n(r.price),0)/arr.length:0;
  const thisMonth=state.sold.filter(r=>regex.test(r.platform) && sameMonth(parseLocalDate(r.date),now));
  const prevDate=new Date(now.getFullYear(),now.getMonth()-1,1);
  const prevMonth=state.sold.filter(r=>regex.test(r.platform) && sameMonth(parseLocalDate(r.date),prevDate));
  if(!thisMonth.length || !prevMonth.length) return null;
  const a=avg(thisMonth), b=avg(prevMonth);
  if(!b) return null;
  return ((a-b)/b)*100;
}
function setPulse(el,label,pct){
  if(pct===null || !Number.isFinite(pct)){ el.textContent=`${label} —`; el.style.color=""; return; }
  el.textContent=`${label} ${pct>=0?"+":""}${pct.toFixed(2)}%`;
  el.style.color = pct>=0 ? "#4fd487" : "#f27d7d";
}
function renderHeader(){
  const h=new Date().getHours();
  const part = h<12?"Morning":h<18?"Afternoon":"Evening";
  const name=(state.userName||"").trim();
  greeting.textContent = `Good ${part}${name?`, ${name}.`:"."}`;
  avatarInitial.textContent = name? name[0].toUpperCase() : "?";
  avatarDropdownName.textContent = name || "Account";
  if(document.activeElement!==userNameInput) userNameInput.value = state.userName||"";
  if(document.activeElement!==goalInput) goalInput.value = state.monthlyGoal||300;

  const healthy = checkStorageHealthy();
  dbHealthText.textContent = healthy ? "Healthy" : "Unavailable";
  systemsDot.style.background = healthy ? "#22c55e" : "#dc2626";

  if(state.lastBackupAt){
    lastBackupLine.textContent = `Last exported ${timeAgo(state.lastBackupAt)}.`;
    lastBackupFooter.textContent = `Last Backup: ${timeAgo(state.lastBackupAt)}`;
  }else{
    lastBackupLine.textContent = "No backup exported yet.";
    lastBackupFooter.textContent = "Last Backup: never";
  }

  setPulse(pulseMC,"MC",pulseFor(/mercari/i));
  setPulse(pulseEBAY,"EBAY",pulseFor(/ebay/i));
  setPulse(pulsePRVT,"PRVT",pulseFor(/private/i));
}
pulseMC.title="Your avg. Mercari sale price vs last month";
pulseEBAY.title="Your avg. eBay sale price vs last month";
pulsePRVT.title="Your avg. Private Sale price vs last month";

function updateClock(){
  const now=new Date();
  const time=now.toLocaleTimeString(undefined,{hour:"numeric",minute:"2-digit"});
  const date=now.toLocaleDateString(undefined,{month:"short",day:"numeric",year:"numeric"});
  footerClock.textContent=`${time} · ${date}`;
}
setInterval(()=>{ updateClock(); renderHeader(); }, 30000);

userNameInput.oninput=()=>{ state.userName=userNameInput.value; save(); renderHeader(); };
goalInput.oninput=()=>{ state.monthlyGoal=n(goalInput.value)||300; save(); renderCharts(); };

/* ---------- account / auth ---------- */
if(typeof firebase !== "undefined" && firebase.auth){
  firebase.auth().onAuthStateChanged(user=>{
    if(user && accountEmail) accountEmail.textContent = user.email || "—";
    if(user && avatarDropdownEmail) avatarDropdownEmail.textContent = user.email || "—";
  });
}
if(logoutBtn){
  logoutBtn.onclick=()=>{
    if(typeof firebase === "undefined" || !firebase.auth){ window.location.href="signin.html"; return; }
    firebase.auth().signOut().then(()=>{ window.location.href="signin.html"; });
  };
}

/* ---------- PWA ---------- */
if("serviceWorker" in navigator){
  window.addEventListener("load", ()=>{
    navigator.serviceWorker.register("sw.js").catch(()=>{});
  });
}

/* ---------- inactivity auto-logout ---------- */
(function(){
  const INACTIVITY_MS = window.__INACTIVITY_MS || 5*60*1000; // 5 minutes (test hook overridable)
  let lastActivity = Date.now();
  function markActivity(){ lastActivity = Date.now(); }
  ["mousemove","mousedown","keydown","touchstart","scroll","wheel"].forEach(evt=>{
    document.addEventListener(evt, markActivity, {passive:true});
  });
  const checkEvery = Math.min(30000, Math.max(500, Math.floor(INACTIVITY_MS/3)));
  setInterval(()=>{
    if(Date.now() - lastActivity < INACTIVITY_MS) return;
    if(typeof firebase === "undefined" || !firebase.auth){ window.location.href="signin.html"; return; }
    firebase.auth().signOut().then(()=>{ window.location.href="signin.html"; })
      .catch(()=>{ window.location.href="signin.html"; });
  }, checkEvery);
})();

/* ---------- search ---------- */
let searchHighlightTimer;
const KIND_LABEL = {inventory:"Inventory", holds:"Holds", sold:"Sold"};
function computeMatches(q){
  const out=[];
  ["inventory","holds","sold"].forEach(kind=>{
    state[kind].forEach(r=>{
      if((r.title||"").toLowerCase().includes(q)) out.push({...r, _kind:kind});
    });
  });
  return out;
}
function jumpToItem(kind, id){
  const item = (state[kind]||[]).find(x=>x.id===id);
  if(!item) return;
  if(kind==="inventory"){
    const sorted = sortedInventory();
    const idx = sorted.findIndex(x=>x.id===id);
    if(idx>=0){ inventoryPage = Math.floor(idx/INV_PAGE_SIZE)+1; renderRows(); }
  }
  if(kind==="sold"){
    soldYear.value="all"; soldMonth.value="all";
    const sorted = getSoldRows().sort((a,b)=> parseLocalDate(b.date) - parseLocalDate(a.date));
    const idx = sorted.findIndex(x=>x.id===id);
    if(idx>=0){ soldPage = Math.floor(idx/SOLD_PAGE_SIZE)+1; renderRows(); }
  }
  showPage(kind);
  requestAnimationFrame(()=>{
    const rowEl = document.getElementById(`row-${kind}-${id}`);
    if(rowEl){
      rowEl.scrollIntoView({behavior:"smooth", block:"center"});
      clearTimeout(searchHighlightTimer);
      document.querySelectorAll("tr.row-highlight").forEach(el=>el.classList.remove("row-highlight"));
      void rowEl.offsetWidth;
      rowEl.classList.add("row-highlight");
      searchHighlightTimer=setTimeout(()=>rowEl.classList.remove("row-highlight"), 2200);
    }
  });
}
const SEARCH_RESULT_LIMIT = 40;
function renderSearchResults(){
  const q=globalSearch.value.toLowerCase().trim();
  if(!q){ searchResults.hidden=true; searchResults.innerHTML=""; return; }
  const matches=computeMatches(q);
  if(!matches.length){
    searchResults.innerHTML = `<div class="search-empty">No matches for "${globalSearch.value}"</div>`;
    searchResults.hidden=false;
    return;
  }
  const shown = matches.slice(0, SEARCH_RESULT_LIMIT);
  searchResults.innerHTML =
    `<div class="search-results-head">${matches.length} match${matches.length===1?"":"es"}</div>` +
    shown.map(r=>`<div class="search-result-item" data-kind="${r._kind}" data-id="${r.id}"><span class="sr-kind">${KIND_LABEL[r._kind]}</span><span class="sr-title">${r.title}</span><span class="sr-price">${money(r.price)}</span></div>`).join("") +
    (matches.length>SEARCH_RESULT_LIMIT ? `<div class="search-more">+${matches.length-SEARCH_RESULT_LIMIT} more — refine your search</div>` : "");
  searchResults.hidden=false;
  searchResults.querySelectorAll(".search-result-item").forEach(el=>{
    el.onclick=()=>{
      jumpToItem(el.dataset.kind, el.dataset.id);
      searchResults.hidden=true;
    };
  });
}
function doSearch(){
  const q=globalSearch.value.toLowerCase().trim();
  if(!q) return;
  const matches=computeMatches(q);
  if(!matches.length) return;
  jumpToItem(matches[0]._kind, matches[0].id);
  searchResults.hidden=true;
}
globalSearch.oninput=renderSearchResults;
globalSearch.addEventListener("focus", ()=>{ if(globalSearch.value.trim()) renderSearchResults(); });
globalSearch.addEventListener("keydown", e=>{
  if(e.key==="Enter"){ e.preventDefault(); doSearch(); }
  if(e.key==="Escape"){ searchResults.hidden=true; globalSearch.blur(); }
});
document.addEventListener("click", e=>{
  if(!e.target.closest(".search-wrap")) searchResults.hidden=true;
});

/* ---------- import / export ---------- */
function normalizeItem(r, kind){
  const id = r.id || r._id || uid();
  const title = r.title || r.item || "Untitled item";
  const category = r.category || r.type || "Other";
  const platform = r.platform || r.source || "";
  const price = n(r.price ?? r.salePrice ?? r.soldPrice ?? r.value);
  const out = {
    id, title, platform, category,
    price, cost:n(r.cost), fees:n(r.fees), shipping:n(r.shipping),
    notes: r.notes || ""
  };
  if(kind==="sold"){
    out.date = String(r.date || r.soldDate || r.addedAt || today()).slice(0,10);
  }
  if(r.addedAt) out.addedAt = typeof r.addedAt==="number" ? r.addedAt : Date.parse(r.addedAt) || Date.now();
  if(r.heldAt) out.heldAt = typeof r.heldAt==="number" ? r.heldAt : Date.parse(r.heldAt) || Date.now();
  return out;
}
function normalizeState(raw){
  const legacy = Array.isArray(raw.activeInventory) || Array.isArray(raw.soldInventory) || Array.isArray(raw.inventoryHolds);
  const invSrc = legacy ? raw.activeInventory : raw.inventory;
  const holdSrc = legacy ? raw.inventoryHolds : raw.holds;
  const soldSrc = legacy ? raw.soldInventory : raw.sold;
  const seen = new Set();
  function convert(list, kind){
    return (Array.isArray(list) ? list : []).map(r=>{
      const item = normalizeItem(r, kind);
      while(seen.has(item.id)) item.id = uid();
      seen.add(item.id);
      return item;
    });
  }
  return {
    theme: raw.theme || state.theme || "light",
    walletMode: Number.isFinite(raw.walletMode) ? raw.walletMode : (state.walletMode ?? 50),
    userName: raw.userName || state.userName || "",
    monthlyGoal: Number.isFinite(raw.monthlyGoal) ? raw.monthlyGoal : (state.monthlyGoal || 300),
    lastBackupAt: state.lastBackupAt || null,
    history: [],
    activity: state.activity || [],
    transactions: Array.isArray(raw.transactions) ? raw.transactions : (state.transactions || []),
    inventory: convert(invSrc,"inventory"),
    holds: convert(holdSrc,"holds"),
    sold: convert(soldSrc,"sold")
  };
}
exportBtn.onclick=()=>{
  const blob=new Blob([JSON.stringify(state,null,2)],{type:"application/json"});
  const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download="comix-stash-data.json"; a.click();
  state.lastBackupAt=Date.now(); save(); renderHeader();
};
exportXlsBtn.onclick=()=>{
  if(typeof XLSX==="undefined"){ alert("The spreadsheet library didn't load (no internet connection?). Try again once you're online."); return; }
  const rows = getTaxRows().slice().sort((a,b)=> parseLocalDate(b.date) - parseLocalDate(a.date));
  if(!rows.length){ alert("No sold items found for that year."); return; }
  const data = rows.map(r=>({
    "Date Sold": r.date || "",
    "Title": r.title || "",
    "Category": r.category || "",
    "Platform": r.platform || "",
    "Sold Price": n(r.price),
    "Cost": n(r.cost),
    "Fees": n(r.fees),
    "Shipping": n(r.shipping),
    "Profit": profit(r),
    "Cost + Profit": costProfit(r)
  }));
  const totalsRow = {
    "Date Sold": "TOTAL", "Title":"", "Category":"", "Platform":"",
    "Sold Price": rows.reduce((a,r)=>a+n(r.price),0),
    "Cost": rows.reduce((a,r)=>a+n(r.cost),0),
    "Fees": rows.reduce((a,r)=>a+n(r.fees),0),
    "Shipping": rows.reduce((a,r)=>a+n(r.shipping),0),
    "Profit": rows.reduce((a,r)=>a+profit(r),0),
    "Cost + Profit": rows.reduce((a,r)=>a+costProfit(r),0)
  };
  data.push(totalsRow);
  const ws = XLSX.utils.json_to_sheet(data);
  ws["!cols"] = [{wch:11},{wch:42},{wch:10},{wch:12},{wch:11},{wch:10},{wch:9},{wch:10},{wch:11},{wch:13}];
  const wb = XLSX.utils.book_new();
  const label = taxYear.value==="all" ? "All Years" : taxYear.value;
  XLSX.utils.book_append_sheet(wb, ws, "Sold " + label);

  const exp = expensesForYear(taxYear.value||"all").slice().sort((a,b)=> parseLocalDate(b.date) - parseLocalDate(a.date));
  if(exp.length){
    const expData = exp.map(t=>({
      "Date": t.date || "",
      "Category": t.category || "Other",
      "Note": t.note || "",
      "Amount": n(t.amount)
    }));
    expData.push({ "Date":"TOTAL", "Category":"", "Note":"", "Amount": exp.reduce((a,t)=>a+n(t.amount),0) });
    const wsExp = XLSX.utils.json_to_sheet(expData);
    wsExp["!cols"] = [{wch:11},{wch:16},{wch:40},{wch:11}];
    XLSX.utils.book_append_sheet(wb, wsExp, "Expenses " + label);
  }
  XLSX.writeFile(wb, `comix-stash-tax-report-${taxYear.value==="all"?"all-years":taxYear.value}.xlsx`);
};
importFile.onchange=e=>{
  const f=e.target.files[0]; if(!f)return;
  const reader=new FileReader();
  reader.onload=()=>{
    let raw;
    try{ raw = JSON.parse(reader.result); }
    catch(err){ alert("That file isn't valid JSON. Please choose a Comix Stash export file."); e.target.value=""; return; }
    const hasCurrent = Array.isArray(raw.inventory) || Array.isArray(raw.holds) || Array.isArray(raw.sold);
    const hasLegacy = Array.isArray(raw.activeInventory) || Array.isArray(raw.soldInventory) || Array.isArray(raw.inventoryHolds);
    if(!hasCurrent && !hasLegacy){ alert("This doesn't look like a Comix Stash backup file."); e.target.value=""; return; }
    const imported = normalizeState(raw);
    const total = imported.inventory.length + imported.holds.length + imported.sold.length;
    if(!confirm(`Import ${total} item(s) (${imported.inventory.length} active, ${imported.holds.length} on hold, ${imported.sold.length} sold) and replace your current data? This can't be undone.`)){
      e.target.value=""; return;
    }
    state = imported;
    logActivity(`Imported ${total} items`, "From backup file", "violet", "⇵");
    save(); render();
    e.target.value="";
  };
  reader.onerror=()=>alert("Couldn't read that file.");
  reader.readAsText(f);
};
seedBtn.onclick=()=>{ state=demoData(); save(); render(); };
clearBtn.onclick=()=>{
  if(confirm("Clear all Comix Stash data?")){
    state={theme:state.theme,walletMode:50,userName:state.userName,monthlyGoal:state.monthlyGoal||300,lastBackupAt:state.lastBackupAt,inventory:[],holds:[],sold:[],history:[],activity:[]};
    save(); render();
  }
};

/* ---------- render loop ---------- */
function render(){
  setTheme(state.theme||"light");
  ensureHistory();
  ensureFilters();
  renderKPIs();
  renderSnapshot();
  renderRows();
  renderCategoryBreakdown();
  renderYoY();
  renderActivity();
  renderAlerts();
  renderCharts();
  renderWallet();
  renderTopComic();
  renderTxns();
  renderHeader();
  save();
}
let resizeTimer;
window.addEventListener("resize", ()=>{ clearTimeout(resizeTimer); resizeTimer=setTimeout(render,150); });

updateClock();
render();
