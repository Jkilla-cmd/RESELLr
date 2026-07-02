
const KEY = "resellr_v300_data";
let state = load();
let editin = null;

function load(){
  try{
    const saved = JSON.parse(localStorage.getItem(KEY));
    if(saved) return saved;
  }catch(e){}
  return demoData();
}
function save(){ localStorage.setItem(KEY, JSON.stringify(state)); }
function money(v){ return "$" + (Number(v)||0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2}); }
function n(v){ const x = Number(v); return Number.isFinite(x) ? x : 0; }
function today(){ return new Date().toISOString().slice(0,10); }
function uid(){ return "id_" + Date.now() + "_" + Math.random().toString(16).slice(2); }
function profit(r){ return n(r.price)-n(r.cost)-n(r.fees)-n(r.shipping); }
function costProfit(r){ return n(r.cost)+profit(r); }

function demoData(){
  const now = new Date();
  return {
    theme:"light",
    walletMode:50,
    inventory:[
      {id:uid(),title:"2024 Daredevil 14 NYCC John Tyler Christopher Red Foil Exclusive Variant",platform:"Mercari",category:"Comic",price:45,cost:15,fees:0,shipping:0,notes:"Added from Mercari"},
      {id:uid(),title:"Absolute Batman Annual #1 Signed Variant",platform:"eBay",category:"Comic",price:120,cost:80,fees:0,shipping:0,notes:"Convention signatures"},
      {id:uid(),title:"Tekken Saga #1 Virgin Variant",platform:"Mercari",category:"Comic",price:75,cost:15,fees:0,shipping:0,notes:"Knightstone"}
    ],
    holds:[],
    sold:[
      {id:uid(),title:"Secret Wars #8 CGC 9.8",platform:"eBay",category:"Comic",price:520,cost:360,fees:62,shipping:18,date:new Date(now.getFullYear(),0,18).toISOString().slice(0,10)},
      {id:uid(),title:"GPK Adam Bomb Signed Print",platform:"Mercari",category:"Card",price:160,cost:52,fees:20,shipping:0,date:new Date(now.getFullYear(),2,8).toISOString().slice(0,10)},
      {id:uid(),title:"Batman Variant Bundle",platform:"Private Sale",category:"Comic",price:95,cost:40,fees:0,shipping:0,date:new Date(now.getFullYear(),5,12).toISOString().slice(0,10)}
    ]
  }
}

function walletBalance(){
  return state.sold.reduce((a,r)=>a + costProfit(r)*(state.walletMode/100),0)
       - state.inventory.reduce((a,r)=>a+n(r.cost),0);
}
function reservedProfit(){
  const total = state.sold.reduce((a,r)=>a+profit(r),0);
  const reinvested = state.sold.reduce((a,r)=>a + costProfit(r)*(state.walletMode/100),0);
  return Math.max(0,total-reinvested);
}
function setTheme(t){
  state.theme=t; save();
  document.documentElement.dataset.theme=t;
  document.getElementById("themeToggle").textContent = t==="dark" ? "Light" : "Dark";
}

function showPage(id){
  document.querySelectorAll(".page").forEach(p=>p.classList.remove("active-page"));
  document.getElementById(id).classList.add("active-page");
  document.querySelectorAll(".nav button").forEach(b=>b.classList.toggle("active",b.dataset.page===id));
  const titles = {dashboard:"Dashboard",inventory:"Inventory",holds:"Holds",sold:"Sold",tax:"Tax Reports",settings:"Settings"};
  document.getElementById("pageTitle").textContent = titles[id] || "Dashboard";
}

document.querySelectorAll(".nav button").forEach(b=>b.onclick=()=>showPage(b.dataset.page));
document.getElementById("themeToggle").onclick=()=>setTheme(state.theme==="dark"?"light":"dark");
document.getElementById("walletGlow").onclick=()=>document.getElementById("walletDrawer").classList.toggle("open");
document.getElementById("closeWallet").onclick=()=>document.getElementById("walletDrawer").classList.remove("open");
document.querySelectorAll("[data-mode]").forEach(b=>b.onclick=()=>{state.walletMode=n(b.dataset.mode);save();render();});

function openModal(item=null, kind="inventory"){
  editing = item ? {id:item.id, kind} : null;
  const form = document.getElementById("itemForm");
  form.reset();
  document.getElementById("modalTitle").textContent = item ? "Edit Item" : "Add Item";
  if(item){
    form.title.value=item.title||"";
    form.platform.value=item.platform||"Mercari";
    form.category.value=item.category||"Comic";
    form.price.value=item.price||"";
    form.cost.value=item.cost||"";
    form.fees.value=item.fees||"";
    form.shipping.value=item.shipping||"";
    form.notes.value=item.notes||"";
  }
  document.getElementById("itemModal").showModal();
}
document.getElementById("addItemBtn").onclick=()=>openModal();
document.getElementById("addItemBtn2").onclick=()=>openModal();
document.getElementById("cancelModal").onclick=()=>document.getElementById("itemModal").close();
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
  if(editing){
    const arr = state[editing.kind];
    const i = arr.findIndex(x=>x.id===editing.id);
    if(i>=0) arr[i] = {...arr[i],...item};
  }else{
    state.inventory.unshift(item);
  }
  save(); document.getElementById("itemModal").close(); render();
};

function moveToHold(id){
  const i=state.inventory.findIndex(x=>x.id===id); if(i<0)return;
  state.holds.unshift(state.inventory.splice(i,1)[0]); save(); render();
}
function moveHoldBack(id){
  const i=state.holds.findIndex(x=>x.id===id); if(i<0)return;
  state.inventory.unshift(state.holds.splice(i,1)[0]); save(); render();
}
function markSold(id){
  const i=state.inventory.findIndex(x=>x.id===id); if(i<0)return;
  const item=state.inventory.splice(i,1)[0];
  const price = prompt("Sold price", item.price || "");
  if(price===null){state.inventory.splice(i,0,item); return;}
  const fees = prompt("Fees", item.fees || 0);
  if(fees===null){state.inventory.splice(i,0,item); return;}
  state.sold.unshift({...item,price:n(price),fees:n(fees),date:today()});
  save(); render();
}
function moveSoldBack(id){
  const i=state.sold.findIndex(x=>x.id===id); if(i<0)return;
  state.inventory.unshift(state.sold.splice(i,1)[0]); save(); render();
}
function delFrom(kind,id){
  if(!confirm("Delete this item?")) return;
  state[kind]=state[kind].filter(x=>x.id!==id); save(); render();
}

function renderKPIs(){
  const invValue=state.inventory.reduce((a,r)=>a+n(r.price),0);
  const cp=state.sold.reduce((a,r)=>a+costProfit(r),0);
  const y=new Date().getFullYear();
  const yr=state.sold.filter(r=>new Date(r.date).getFullYear()===y);
  const yrProfit=yr.reduce((a,r)=>a+profit(r),0);
  const wb=walletBalance();

  kpiInventoryValue.textContent=money(invValue);
  kpiInventoryCount.textContent=`${state.inventory.length} active items`;
  kpiCostProfit.textContent=money(cp);
  kpiWallet.textContent=money(wb);
  sideWallet.textContent=money(wb);
  kpiSalesYear.textContent=yr.length;
  kpiProfitYear.textContent=`${money(yrProfit)} profit`;
  drawerWallet.textContent=money(wb);
  drawerBuying.textContent=money(Math.max(0,wb));
  drawerReserved.textContent=money(reservedProfit());
}

function ensureFilters(){
  const years=[...new Set(state.sold.map(r=>new Date(r.date).getFullYear()))].sort((a,b)=>b-a);
  const yopts=`<option value="all">All Years</option>`+years.map(y=>`<option>${y}</option>`).join("");
  if(snapYear.innerHTML!==yopts) snapYear.innerHTML=yopts;
  if(monthlyYear.innerHTML!==years.map(y=>`<option>${y}</option>`).join("")) monthlyYear.innerHTML=years.map(y=>`<option>${y}</option>`).join("");
  if(!snapMonth.innerHTML){
    snapMonth.innerHTML=`<option value="all">All Months</option>`+["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].map((m,i)=>`<option value="${i}">${m}</option>`).join("");
  }
}
snapYear.onchange=snapMonth.onchange=render;
monthlyYear.onchange=render;

function renderSnapshot(){
  ensureFilters();
  let rows=[...state.sold];
  if(snapYear.value && snapYear.value!=="all") rows=rows.filter(r=>new Date(r.date).getFullYear()===n(snapYear.value));
  if(snapMonth.value && snapMonth.value!=="all") rows=rows.filter(r=>new Date(r.date).getMonth()===n(snapMonth.value));
  snapItems.textContent=rows.length;
  snapIncome.textContent=money(rows.reduce((a,r)=>a+n(r.price),0));
  snapCP.textContent=money(rows.reduce((a,r)=>a+costProfit(r),0));
  snapProfit.textContent=money(rows.reduce((a,r)=>a+profit(r),0));
  snapMercari.textContent=money(rows.filter(r=>/mercari/i.test(r.platform)).reduce((a,r)=>a+n(r.price),0));
  snapEbay.textContent=money(rows.filter(r=>/ebay/i.test(r.platform)).reduce((a,r)=>a+n(r.price),0));
  snapPrivate.textContent=money(rows.filter(r=>/private/i.test(r.platform)).reduce((a,r)=>a+n(r.price),0));
  taxIncome.textContent=money(state.sold.reduce((a,r)=>a+n(r.price),0));
  taxCost.textContent=money(state.sold.reduce((a,r)=>a+n(r.cost),0));
  taxFees.textContent=money(state.sold.reduce((a,r)=>a+n(r.fees),0));
  taxProfit.textContent=money(state.sold.reduce((a,r)=>a+profit(r),0));
}

function rowTitle(r){return `<strong>${r.title}</strong><small>${r.category||""}</small>`}
function renderRows(){
  inventoryRows.innerHTML=state.inventory.map(r=>`<tr>
    <td>${rowTitle(r)}</td><td>${r.platform}</td><td>${money(r.price)}</td><td>${money(r.cost)}</td><td class="${profit(r)>=0?'profit':'loss'}">${money(profit(r))}</td>
    <td><div class="row-actions"><button class="icon-btn" onclick='openModal(${JSON.stringify(r)},"inventory")'>✎</button><button class="icon-btn" onclick="moveToHold('${r.id}')">◇</button><button class="icon-btn" onclick="markSold('${r.id}')">$</button><button class="icon-btn" onclick="delFrom('inventory','${r.id}')">×</button></div></td>
  </tr>`).join("");
  holdRows.innerHTML=state.holds.map(r=>`<tr>
    <td>${rowTitle(r)}</td><td>${r.platform}</td><td>${money(r.price)}</td><td>${money(r.cost)}</td>
    <td><div class="row-actions"><button class="icon-btn" onclick="moveHoldBack('${r.id}')">▣</button><button class="icon-btn" onclick="delFrom('holds','${r.id}')">×</button></div></td>
  </tr>`).join("");
  soldRows.innerHTML=state.sold.map(r=>`<tr>
    <td>${rowTitle(r)}</td><td>${r.date||""}</td><td>${r.platform}</td><td>${money(r.price)}</td><td>${money(r.cost)}</td><td>${money(r.fees)}</td><td class="${profit(r)>=0?'profit':'loss'}">${money(profit(r))}</td>
    <td><div class="row-actions"><button class="icon-btn" onclick='openModal(${JSON.stringify(r)},"sold")'>✎</button><button class="icon-btn" onclick="moveSoldBack('${r.id}')">▣</button><button class="icon-btn" onclick="delFrom('sold','${r.id}')">×</button></div></td>
  </tr>`).join("");
}

function renderActivity(){
  const items=[
    ...state.sold.slice(0,3).map(r=>({type:"$",text:`Sold ${r.title}`,date:r.date})),
    ...state.inventory.slice(0,2).map(r=>({type:"+",text:`Listed ${r.title}`,date:"Active"}))
  ];
  activityList.innerHTML=items.map(x=>`<div class="activity-item"><div class="activity-dot">${x.type}</div><div><strong>${x.text}</strong><small>${x.date}</small></div><span></span></div>`).join("");
}

function drawLine(canvas, data, labels, colors){
  const ctx=canvas.getContext("2d"), w=canvas.clientWidth, h=canvas.clientHeight, dpr=devicePixelRatio||1;
  canvas.width=w*dpr; canvas.height=h*dpr; ctx.scale(dpr,dpr);
  ctx.clearRect(0,0,w,h);
  ctx.strokeStyle=getComputedStyle(document.documentElement).getPropertyValue("--line"); ctx.lineWidth=1;
  for(let i=0;i<5;i++){let y=20+(h-45)*i/4;ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke();}
  const max=Math.max(1,...data.flat());
  data.forEach((series,si)=>{
    ctx.strokeStyle=colors[si];ctx.lineWidth=3;ctx.beginPath();
    series.forEach((v,i)=>{let x=12+(w-24)*i/Math.max(1,series.length-1), y=h-28-(h-58)*(v/max); i?ctx.lineTo(x,y):ctx.moveTo(x,y);});
    ctx.stroke();
  });
}
function renderCharts(){
  const months=Array.from({length:12},(_,i)=>i);
  const income=months.map(m=>state.sold.filter(r=>new Date(r.date).getMonth()===m).reduce((a,r)=>a+n(r.price),0));
  const cp=months.map(m=>state.sold.filter(r=>new Date(r.date).getMonth()===m).reduce((a,r)=>a+costProfit(r),0));
  const inv=months.map(()=>state.inventory.reduce((a,r)=>a+n(r.price),0));
  drawLine(growthChart,[inv,cp,income],months,["#d9a441","#4f8f5f","#3f7fc9"]);
  const prof=months.map(m=>state.sold.filter(r=>new Date(r.date).getMonth()===m).reduce((a,r)=>a+profit(r),0));
  drawLine(monthlyChart,[prof],months,["#4f8f5f"]);
}

globalSearch.oninput=()=>{
  const q=globalSearch.value.toLowerCase().trim();
  if(!q) return;
  const found=[...state.inventory,...state.holds,...state.sold].find(r=>r.title.toLowerCase().includes(q));
  if(found) showPage(state.inventory.includes(found)?"inventory":state.holds.includes(found)?"holds":"sold");
}
exportBtn.onclick=()=>{
  const blob=new Blob([JSON.stringify(state,null,2)],{type:"application/json"});
  const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download="resellr-data.json"; a.click();
}
importFile.onchange=e=>{
  const f=e.target.files[0]; if(!f)return;
  const reader=new FileReader();
  reader.onload=()=>{state=JSON.parse(reader.result); save(); render();};
  reader.readAsText(f);
}
seedBtn.onclick=()=>{state=demoData();save();render();}
clearBtn.onclick=()=>{if(confirm("Clear all RESELLr data?")){state={theme:state.theme,walletMode:50,inventory:[],holds:[],sold:[]};save();render();}}

function render(){
  setTheme(state.theme||"light");
  ensureFilters();
  renderKPIs();
  renderSnapshot();
  renderRows();
  renderActivity();
  renderCharts();
}
render();
