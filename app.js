const LS_ACTIVE="activeInventory",LS_SOLD="soldInventory",LS_HOLDS="inventoryHolds";const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];const money=(v,d=2)=>new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:d}).format(Number(v)||0);const n=v=>{const x=Number(String(v??"").replace(/[^0-9.-]/g,""));return Number.isFinite(x)?x:0};const read=k=>{try{return JSON.parse(localStorage.getItem(k)||"[]")||[]}catch{return[]}};const write=(k,v)=>localStorage.setItem(k,JSON.stringify(v||[]));const active=()=>read(LS_ACTIVE).length?read(LS_ACTIVE):read("inventory");const sold=()=>read(LS_SOLD).length?read(LS_SOLD):read("sold");const holds=()=>read(LS_HOLDS).length?read(LS_HOLDS):read("holds");const setActive=v=>{write(LS_ACTIVE,v);write("inventory",v)};const setSold=v=>{write(LS_SOLD,v);write("sold",v)};const setHolds=v=>{write(LS_HOLDS,v);write("holds",v)};const val=(r,ks)=>{for(const k of ks){if(r&&r[k]!=null&&String(r[k]).trim()!=="")return n(r[k])}return 0};const title=r=>String(r.title||r.name||r.item||r.description||r.notes||"Untitled item").trim();const platform=r=>String(r.platform||r.marketplace||r.source||r.store||"Mercari").trim();const category=r=>String(r.category||r.type||"Comics").trim();const cost=r=>val(r,["cost","Cost","itemCost","cogs","purchasePrice"]);const price=r=>val(r,["price","list","listPrice","salePrice","soldPrice","sale","amount","total"]);const fees=r=>val(r,["fees","fee","platformFees"]);const ship=r=>val(r,["shipping","ship","shippingCost","labelCost"]);const profit=r=>{for(const k of["profit","netProfit","totalProfit","net"]){if(r&&r[k]!=null&&String(r[k]).trim()!=="")return n(r[k])}return price(r)-cost(r)-fees(r)-ship(r)};const dateOf=r=>{const raw=r.soldDate||r.date||r.Date||r.saleDate||r.addedAt||r.createdAt||"";const d=new Date(raw);return isNaN(d)?null:d};const fmt=d=>d?d.toLocaleDateString("en-US",{month:"short",day:"numeric",year:"2-digit"}):"—";let chart=null,editIndex=null;
function seedIfEmpty(){if(active().length||sold().length)return;setActive([{title:"Harley Quinn x Elvira #6",platform:"DC Comics",category:"Comics",price:25,cost:13.71,addedAt:"2025-06-20"},{title:"Transformers #2",platform:"Image Comics",category:"Comics",price:15,cost:7.47,addedAt:"2025-06-20"},{title:"Spawn #345",platform:"Image Comics",category:"Comics",price:10,cost:4.40,addedAt:"2025-06-19"},{title:"Batman #142",platform:"DC Comics",category:"Comics",price:22,cost:11.30,addedAt:"2025-06-19"},{title:"Invincible #78",platform:"Image Comics",category:"Comics",price:16,cost:7.20,addedAt:"2025-06-18"}]);setSold([{title:"HITMAN #1",platform:"Mercari",price:24.99,cost:11,soldDate:"2025-06-20"},{title:"VOID RIVALS #1",platform:"Mercari",price:18,cost:8.40,soldDate:"2025-06-20"},{title:"SPAWN #345",platform:"Mercari",price:15,cost:6.70,soldDate:"2025-06-19"},{title:"BATMAN #142",platform:"Mercari",price:22,cost:10.50,soldDate:"2025-06-19"}])}
function render(){const a=active(),s=sold(),h=holds();const totalProfit=s.reduce((x,r)=>x+profit(r),0),revenue=s.reduce((x,r)=>x+price(r),0),inv=a.reduce((x,r)=>x+price(r),0),cogs=s.reduce((x,r)=>x+cost(r),0),totalFees=s.reduce((x,r)=>x+fees(r)+ship(r),0);$("#kpiProfit").textContent=money(totalProfit);$("#kpiActive").textContent=a.length;$("#kpiSales").textContent=s.length;$("#kpiInventory").textContent=money(inv);const goal=3350,pct=Math.min(100,Math.round(totalProfit/goal*100));$("#goalRing").style.setProperty("--pct",pct+"%");$("#goalPct").textContent=pct+"%";$("#goalText").textContent=`${money(totalProfit,0)} / ${money(goal,0)}`;$("#inventoryCount").textContent=`(${a.length} items)`;$("#avgProfit").textContent=money(s.length?totalProfit/s.length:0);$("#todaySales").textContent=money(0);$("#todayItems").textContent=0;$("#tickerRecent").textContent=s[0]?`${title(s[0])} • ${money(price(s[0]))} • ${profit(s[0])>=0?"+":""}${money(profit(s[0]))}`:"No sales yet";$("#recentSold").innerHTML=s.slice().sort((a,b)=>(dateOf(b)||0)-(dateOf(a)||0)).slice(0,5).map(r=>`<div class="recent-row"><b>${esc(title(r))}</b><span>${money(price(r))}</span><span>${fmt(dateOf(r))}</span></div>`).join("");renderInventoryRows();renderSoldRows();renderHolds();$("#soldTotal").textContent=s.length;$("#soldRevenue").textContent=money(revenue);$("#soldProfit").textContent=money(totalProfit);$("#soldMargin").textContent=(revenue?Math.round(totalProfit/revenue*100):0)+"%";$("#taxGross").textContent=money(revenue);$("#taxCogs").textContent=money(cogs);$("#taxFees").textContent=money(totalFees);$("#taxProfit").textContent=money(totalProfit);$("#taxRows").innerHTML=s.map(r=>`<tr><td>${fmt(dateOf(r))}</td><td>${esc(title(r))}</td><td>${esc(platform(r))}</td><td>${money(price(r))}</td><td>${money(cost(r))}</td><td>${money(fees(r))}</td><td>${money(ship(r))}</td><td class="${profit(r)>=0?"profit":"loss"}">${money(profit(r))}</td></tr>`).join("");renderHeat();drawChart();updateTime()}
function renderInventoryRows(){const q=($("#inventorySearch")?.value||$("#dashInventorySearch")?.value||"").toLowerCase();const rows=active().map((r,i)=>({r,i})).filter(x=>!q||JSON.stringify(x.r).toLowerCase().includes(q));const html=rows.map(({r,i})=>invRow(r,i)).join("");$("#dashInventoryRows").innerHTML=html;$("#inventoryRows").innerHTML=html}
function invRow(r,i){const p=price(r),c=cost(r),pr=p-c,m=p?Math.round(pr/p*100):0;return `<tr><td><div class="item-cell"><div class="thumb"></div><div>${esc(title(r))}<small>${esc(platform(r))}</small></div></div></td><td>${money(p)}</td><td>${money(c)}</td><td class="${pr>=0?"profit":"loss"}">${pr>=0?"+":""}${money(pr)}</td><td class="margin">${m}%</td><td>${fmt(dateOf(r))}</td><td class="status">Active</td><td><div class="row-actions"><button onclick="editItem(${i})">Edit</button><button onclick="moveToSold(${i})">Sold</button><button onclick="moveToHold(${i})">Hold</button></div></td></tr>`}
function renderSoldRows(){const q=($("#soldSearch")?.value||"").toLowerCase();$("#soldRows").innerHTML=sold().map((r,i)=>({r,i})).filter(x=>!q||JSON.stringify(x.r).toLowerCase().includes(q)).map(({r,i})=>{const p=price(r),pr=profit(r),m=p?Math.round(pr/p*100):0;return `<tr><td><div class="item-cell"><div class="thumb"></div><div>${esc(title(r))}<small>${esc(platform(r))}</small></div></div></td><td>${fmt(dateOf(r))}</td><td>${money(p)}</td><td>${money(cost(r))}</td><td class="${pr>=0?"profit":"loss"}">${money(pr)}</td><td class="margin">${m}%</td><td><div class="row-actions"><button onclick="deleteSold(${i})">Delete</button></div></td></tr>`}).join("")}
function renderHolds(){$("#holdRows").innerHTML=holds().map((r,i)=>`<tr><td>${esc(title(r))}</td><td>${money(price(r))}</td><td>${money(cost(r))}</td><td>${fmt(dateOf(r))}</td><td><div class="row-actions"><button onclick="unhold(${i})">To Inventory</button><button onclick="deleteHold(${i})">Delete</button></div></td></tr>`).join("")}
function drawChart(){if(!window.Chart)return;const by=new Map();sold().forEach(r=>{const d=dateOf(r);if(!d)return;const k=d.toISOString().slice(0,10);if(!by.has(k))by.set(k,{d,profit:0});by.get(k).profit+=profit(r)});let p=0;const rows=[...by.values()].sort((a,b)=>a.d-b.d).map(x=>{p+=x.profit;return{label:x.d.toLocaleDateString("en-US",{month:"short",day:"numeric"}),p}});if(chart)chart.destroy();chart=new Chart($("#growthChart"),{type:"line",data:{labels:rows.map(r=>r.label),datasets:[{label:"Profit",data:rows.map(r=>r.p),borderColor:"#00f5ff",backgroundColor:"rgba(0,245,255,.18)",fill:true,tension:.35,pointRadius:3,pointBackgroundColor:"#58ff83"}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{grid:{display:false},ticks:{color:"rgba(226,232,240,.72)"}},y:{grid:{color:"rgba(255,255,255,.08)"},ticks:{color:"rgba(226,232,240,.72)",callback:v=>"$"+v}}}}})}
function renderHeat(){const box=$("#heatmap");box.innerHTML="";for(let i=0;i<35;i++){const d=document.createElement("div");d.className="heat"+(Math.random()>.42?" on":"");d.style.opacity=.35+Math.random()*.65;box.appendChild(d)}}function esc(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function showPage(id){$$(".page").forEach(p=>p.classList.toggle("active",p.id===id));$$("[data-page]").forEach(b=>b.classList.toggle("active",b.dataset.page===id));$("#menu").classList.remove("open");render()}function moveToHold(i){const a=active(),h=holds();h.push({...a[i],holdDate:new Date().toISOString(),status:"hold"});a.splice(i,1);setActive(a);setHolds(h);render()}function unhold(i){const a=active(),h=holds();a.push({...h[i],addedAt:new Date().toISOString(),status:"active"});h.splice(i,1);setActive(a);setHolds(h);render()}function moveToSold(i){const a=active(),s=sold();s.push({...a[i],soldDate:new Date().toISOString(),status:"sold"});a.splice(i,1);setActive(a);setSold(s);render()}function deleteSold(i){const s=sold();s.splice(i,1);setSold(s);render()}function deleteHold(i){const h=holds();h.splice(i,1);setHolds(h);render()}
window.editItem=i=>{editIndex=i;const r=active()[i];$("#modalTitle").textContent="Edit Item";const f=$("#itemForm");f.title.value=title(r);f.platform.value=platform(r);f.category.value=category(r);f.price.value=price(r);f.cost.value=cost(r);f.notes.value=r.notes||"";$("#itemModal").classList.add("open")};$("#itemForm").onsubmit=e=>{e.preventDefault();const fd=new FormData(e.target),row={title:fd.get("title"),platform:fd.get("platform"),category:fd.get("category"),price:n(fd.get("price")),cost:n(fd.get("cost")),notes:fd.get("notes"),addedAt:new Date().toISOString()};const a=active();if(editIndex!=null)a[editIndex]={...a[editIndex],...row};else a.unshift(row);setActive(a);editIndex=null;$("#itemModal").classList.remove("open");e.target.reset();render()};$("#closeModal").onclick=()=>$("#itemModal").classList.remove("open");$("#addItemBtn").onclick=$("#addItemBtn2").onclick=()=>{editIndex=null;$("#modalTitle").textContent="Add Item";$("#itemForm").reset();$("#itemModal").classList.add("open")};
$$("[data-page]").forEach(b=>b.addEventListener("click",()=>showPage(b.dataset.page)));$("#openMenu").onclick=()=>$("#menu").classList.toggle("open");$("#openCommand").onclick=()=>openCommand();$("#dashInventorySearch").oninput=$("#inventorySearch").oninput=renderInventoryRows;$("#soldSearch").oninput=renderSoldRows;$("#exportBackup").onclick=()=>download("RESELLr-backup.json",JSON.stringify({activeInventory:active(),soldInventory:sold(),inventoryHolds:holds(),exportedAt:new Date().toISOString()},null,2));$("#exportSold").onclick=()=>download("sold.csv",csv(sold()));$("#exportTax").onclick=()=>download("tax.csv",csv(sold()));$("#restoreBackup").onchange=e=>restoreBackupFile(e.target.files[0]);$("#resetAll").onclick=()=>{if(confirm("Full reset all local data?")){setActive([]);setSold([]);setHolds([]);render()}};function download(name,text){const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([text],{type:"text/plain"}));a.download=name;a.click();$("#backupTime").textContent=new Date().toLocaleString()}function csv(rows){return ["Item,Platform,Price,Cost,Fees,Shipping,Profit,Date"].concat(rows.map(r=>[title(r),platform(r),price(r),cost(r),fees(r),ship(r),profit(r),fmt(dateOf(r))].map(x=>`"${String(x).replaceAll('"','""')}"`).join(","))).join("\n")}
function updateTime(){const d=new Date();$("#clock").textContent=d.toLocaleTimeString([],{hour:"numeric",minute:"2-digit"});$("#date").textContent=d.toLocaleDateString()}function openCommand(){renderCommand("");$("#command").classList.add("open");$("#commandInput").focus()}$("#command").onclick=e=>{if(e.target.id==="command")$("#command").classList.remove("open")};$("#commandInput").oninput=e=>renderCommand(e.target.value);function renderCommand(q){q=q.toLowerCase();const items=[...active().map((r,i)=>({icon:"◇",label:title(r),sub:"Inventory",page:"inventory"})),...sold().map(r=>({icon:"$",label:title(r),sub:"Sold",page:"sold"})),...holds().map(r=>({icon:"✓",label:title(r),sub:"Hold",page:"holds"}))].filter(x=>!q||(x.label+x.sub).toLowerCase().includes(q)).slice(0,50);$("#commandResults").innerHTML=items.map(x=>`<div class="cmd-row" onclick="showPage('${x.page}');document.getElementById('command').classList.remove('open')"><span>${x.icon}</span><div>${esc(x.label)}<small>${x.sub}</small></div><span>↵</span></div>`).join("")}
$("#playBtn").onclick=()=>{const a=$("#audio");if(a.paused){a.volume=$("#volume").value;a.play();$("#playBtn").textContent="Ⅱ"}else{a.pause();$("#playBtn").textContent="▶"}};$("#volume").oninput=e=>$("#audio").volume=e.target.value;$("#bgUpload").onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>document.body.style.background=`linear-gradient(rgba(2,6,23,.62),rgba(2,6,23,.78)),url(${r.result}) center/cover fixed`;r.readAsDataURL(f)};$$("[data-bg]").forEach(b=>b.onclick=()=>{document.body.className=b.dataset.bg});setInterval(updateTime,1000);seedIfEmpty();render();




/* ===== v202: restore old single-db-v1 backups + true full reset ===== */
const RESELLR_KEYS=[
  "activeInventory","inventory","inventoryData","items","listings","products",
  "soldInventory","sold","soldItems","soldData","sales","completed",
  "inventoryHolds","holds","holdData","heldItems",
  "resellr_backup","resellrData","resellrDB","RESELLrDB",
  "resellr_reinvest_pct","dashboardPassHash","lastRestoreAt"
];

function setRestoreStatus(msg,type="good"){
  const el=$("#restoreStatus");
  if(el){el.textContent=msg;el.className="restore-status "+type}
  else alert(msg);
}

function parseMaybeJson(v){
  if(Array.isArray(v)) return v;
  if(v && typeof v==="object") return v;
  if(typeof v!=="string") return v;
  const s=v.trim();
  if(!s) return s;
  if((s.startsWith("[")&&s.endsWith("]"))||(s.startsWith("{")&&s.endsWith("}"))){
    try{return JSON.parse(s)}catch(e){return v}
  }
  return v;
}

function kvArray(kv,names){
  for(const name of names){
    if(kv && kv[name]!=null){
      const parsed=parseMaybeJson(kv[name]);
      if(Array.isArray(parsed)) return parsed;
    }
  }
  return [];
}

function normalizeItemV202(r,mode){
  if(!r||typeof r!=="object") return null;
  const out={...r};
  out.title=out.title||out.name||out.item||out.Item||out.description||out.Description||out.notes||out.Notes||"Untitled item";
  out.platform=out.platform||out.marketplace||out.source||out.Platform||out.Marketplace||"Mercari";
  out.category=out.category||out.type||out.Category||out.Type||"Comics";
  out.price=n(out.price??out.list??out.listPrice??out.salePrice??out.soldPrice??out.sale??out.amount??out.total??out.Price??out["List Price"]??out["Sold Price"]);
  out.cost=n(out.cost??out.Cost??out.itemCost??out.cogs??out.purchasePrice);
  out.fees=n(out.fees??out.fee??out.platformFees??out.Fees);
  out.shipping=n(out.shipping??out.ship??out.shippingCost??out.labelCost??out.Shipping);
  out.profit=n(out.profit??out.netProfit??out.totalProfit??out.Profit);
  if(!out.profit && mode==="sold") out.profit=out.price-out.cost-out.fees-out.shipping;
  out.addedAt=out.addedAt||out.createdAt||out.dateAdded||out["Date Added"]||out.date||out.Date||new Date().toISOString();
  if(mode==="sold") out.soldDate=out.soldDate||out.saleDate||out.dateSold||out["Sold Date"]||out.date||out.Date||new Date().toISOString();
  if(mode==="hold") out.holdDate=out.holdDate||out.date||out.Date||new Date().toISOString();
  out.status=mode==="sold"?"sold":mode==="hold"?"hold":"active";
  return out;
}

function extractBackupDataV202(j){
  let source=j||{};
  let kv=null;

  // Your uploaded old backup uses: { app, version:"single-db-v1", payload:{ kv:{ activeInventory:"[...]" } } }
  if(source.payload && source.payload.kv) kv=source.payload.kv;
  else if(source.kv) kv=source.kv;

  if(kv){
    return {
      activeRows:kvArray(kv,["activeInventory","inventory","inventoryData","items","active","listings","products"]).map(x=>normalizeItemV202(x,"active")).filter(Boolean),
      soldRows:kvArray(kv,["soldInventory","soldItems","sold","soldData","sales","soldItemsData","completed"]).map(x=>normalizeItemV202(x,"sold")).filter(Boolean),
      holdRows:kvArray(kv,["inventoryHolds","holds","holdData","heldItems"]).map(x=>normalizeItemV202(x,"hold")).filter(Boolean),
      rawKv:kv
    };
  }

  if(Array.isArray(source)){
    return {activeRows:source.map(x=>normalizeItemV202(x,"active")).filter(Boolean),soldRows:[],holdRows:[],rawKv:null};
  }

  return {
    activeRows:kvArray(source,["activeInventory","inventory","inventoryData","items","active","listings","products"]).map(x=>normalizeItemV202(x,"active")).filter(Boolean),
    soldRows:kvArray(source,["soldInventory","soldItems","sold","soldData","sales","completed"]).map(x=>normalizeItemV202(x,"sold")).filter(Boolean),
    holdRows:kvArray(source,["inventoryHolds","holds","holdData","heldItems"]).map(x=>normalizeItemV202(x,"hold")).filter(Boolean),
    rawKv:null
  };
}

function restoreBackupFile(file){
  if(!file)return;
  const reader=new FileReader();
  reader.onload=()=>{
    try{
      const text=String(reader.result||"");
      let activeRows=[],soldRows=[],holdRows=[],rawKv=null;

      if(file.name.toLowerCase().endsWith(".csv")){
        const parsed=classifyCsvRows(parseCsv(text));
        activeRows=parsed.activeRows;soldRows=parsed.soldRows;holdRows=[];
      }else{
        const data=extractBackupDataV202(JSON.parse(text));
        activeRows=data.activeRows;soldRows=data.soldRows;holdRows=data.holdRows;rawKv=data.rawKv;
      }

      // True reset before restore, so old data cannot fight new data.
      RESELLR_KEYS.forEach(k=>localStorage.removeItem(k));

      setActive(activeRows);
      setSold(soldRows);
      setHolds(holdRows);

      // Preserve useful settings from old single-db backup, but do not let them override item arrays.
      if(rawKv){
        ["resellr_reinvest_pct","dashboardPassHash"].forEach(k=>{
          if(rawKv[k]!=null) localStorage.setItem(k,rawKv[k]);
        });
      }

      localStorage.setItem("lastRestoreAt",new Date().toISOString());
      render();
      setRestoreStatus(`Restored ${activeRows.length} active, ${soldRows.length} sold, ${holdRows.length} holds.`,"good");
    }catch(err){
      console.error(err);
      setRestoreStatus("Restore failed. This file was not recognized as a RESELLr backup or CSV.","bad");
    }
  };
  reader.readAsText(file);
}

function fullResetV202(){
  if(!confirm("Full reset all local RESELLr data on this browser?")) return;
  RESELLR_KEYS.forEach(k=>localStorage.removeItem(k));
  // Also remove any future/older RESELLr-style keys.
  Object.keys(localStorage).forEach(k=>{
    if(/resellr|inventory|sold|hold|dashboardPass|reinvest/i.test(k)) localStorage.removeItem(k);
  });
  setActive([]);setSold([]);setHolds([]);
  render();
  setRestoreStatus("Full reset complete. Active, sold, and holds are cleared.","good");
}

try{$("#restoreBackup").onchange=e=>restoreBackupFile(e.target.files[0])}catch(e){}
try{$("#resetAll").onclick=fullResetV202}catch(e){}



/* ===== v203 login + latest additions + monthly/year filters ===== */
let monthlyChart=null;

function passHash(v){
  let h=2166136261;
  for(let i=0;i<String(v).length;i++){h^=String(v).charCodeAt(i);h=Math.imul(h,16777619)}
  return (h>>>0).toString(16);
}
function hasPass(){return !!localStorage.getItem("resellr_pass_hash")}
function isUnlocked(){return sessionStorage.getItem("resellr_unlocked")==="1"}
function showLogin(){
  const screen=$("#loginScreen"); if(!screen)return;
  const setup=!hasPass();
  $("#loginSub").textContent=setup?"Create your passcode":"Welcome back";
  $("#loginLabel").textContent=setup?"Create passcode":"Enter passcode";
  $("#loginSubmit").textContent=setup?"Create passcode":"Unlock";
  $("#resetPassBtn").style.display=setup?"none":"inline-block";
  $("#loginMessage").textContent="";
  document.body.classList.add("locked");
  screen.classList.add("show");
  setTimeout(()=>$("#loginPass")?.focus(),80);
}
function hideLogin(){document.body.classList.remove("locked");$("#loginScreen")?.classList.remove("show")}
function initLogin(){
  $("#loginForm")?.addEventListener("submit",e=>{
    e.preventDefault();
    const v=$("#loginPass").value.trim();
    if(v.length<3){$("#loginMessage").textContent="Use at least 3 characters.";return}
    if(!hasPass()){
      localStorage.setItem("resellr_pass_hash",passHash(v));
      sessionStorage.setItem("resellr_unlocked","1");
      $("#loginPass").value="";
      hideLogin();
      render();
      return;
    }
    if(passHash(v)===localStorage.getItem("resellr_pass_hash")){
      sessionStorage.setItem("resellr_unlocked","1");
      $("#loginPass").value="";
      hideLogin();
      render();
    }else $("#loginMessage").textContent="Wrong passcode.";
  });
  $("#resetPassBtn")?.addEventListener("click",()=>{
    const phrase=prompt("Type RESET to clear your passcode on this device.");
    if(phrase==="RESET"){localStorage.removeItem("resellr_pass_hash");sessionStorage.removeItem("resellr_unlocked");showLogin()}
  });
  if(!isUnlocked()) showLogin();
}

function getYears(rows){
  const yrs=[...new Set(rows.map(r=>dateOf(r)?.getFullYear()).filter(Boolean))].sort((a,b)=>b-a);
  return yrs.length?yrs:[new Date().getFullYear()];
}
function fillSelect(sel,vals,labelAll){
  if(!sel)return;
  const cur=sel.value;
  sel.innerHTML=(labelAll?`<option value="all">${labelAll}</option>`:"")+vals.map(v=>`<option value="${v}">${v}</option>`).join("");
  if([...sel.options].some(o=>o.value===cur)) sel.value=cur;
}
function monthName(m){return new Date(2026,m-1,1).toLocaleString("en-US",{month:"long"})}
function setupFilters(){
  const yrs=getYears(sold());
  fillSelect($("#soldYearFilter"),yrs,"All Years");
  fillSelect($("#taxYearFilter"),yrs,"All Years");
  const months=Array.from({length:12},(_,i)=>`<option value="${i+1}">${monthName(i+1)}</option>`).join("");
  if($("#soldMonthFilter")&&!$("#soldMonthFilter").options.length) $("#soldMonthFilter").innerHTML='<option value="all">All Months</option>'+months;
  if($("#taxMonthFilter")&&!$("#taxMonthFilter").options.length) $("#taxMonthFilter").innerHTML='<option value="all">All Months</option>'+months;
  fillSelect($("#monthlyYearFilter"),yrs,null);
}
function filterByYearMonth(rows,yearSel,monthSel){
  const y=yearSel?.value||"all", m=monthSel?.value||"all";
  return rows.filter(r=>{
    const d=dateOf(r); if(!d)return false;
    if(y!=="all" && d.getFullYear()!==Number(y))return false;
    if(m!=="all" && d.getMonth()+1!==Number(m))return false;
    return true;
  });
}

const oldRenderV203=render;
render=function(){
  setupFilters();
  oldRenderV203();
  renderMonthlyChart();
  renderSoldRows();
  renderTaxFiltered();
};

renderInventoryRows=function(){
  const q=($("#inventorySearch")?.value||"").toLowerCase();
  const latest=active().slice().sort((a,b)=>(dateOf(b)||0)-(dateOf(a)||0));
  const dashRows=latest.slice(0,5);
  $("#dashInventoryRows").innerHTML=dashRows.map((r,i)=>invRow(r,active().indexOf(r))).join("");
  const rows=latest.map((r,i)=>({r,i:active().indexOf(r)})).filter(x=>!q||JSON.stringify(x.r).toLowerCase().includes(q));
  $("#inventoryRows").innerHTML=rows.map(({r,i})=>invRow(r,i)).join("");
};

renderSoldRows=function(){
  const q=($("#soldSearch")?.value||"").toLowerCase();
  const filtered=filterByYearMonth(sold(),$("#soldYearFilter"),$("#soldMonthFilter"));
  $("#soldRows").innerHTML=filtered.map((r,i)=>({r,i:sold().indexOf(r)})).filter(x=>!q||JSON.stringify(x.r).toLowerCase().includes(q)).map(({r,i})=>{
    const p=price(r),pr=profit(r),m=p?Math.round(pr/p*100):0;
    return `<tr><td><div class="item-cell"><div class="thumb"></div><div>${esc(title(r))}<small>${esc(platform(r))}</small></div></div></td><td>${fmt(dateOf(r))}</td><td>${money(p)}</td><td>${money(cost(r))}</td><td class="${pr>=0?"profit":"loss"}">${money(pr)}</td><td class="margin">${m}%</td><td><div class="row-actions"><button onclick="deleteSold(${i})">Delete</button></div></td></tr>`;
  }).join("");
};

function renderTaxFiltered(){
  const rows=filterByYearMonth(sold(),$("#taxYearFilter"),$("#taxMonthFilter"));
  const revenue=rows.reduce((x,r)=>x+price(r),0), cogs=rows.reduce((x,r)=>x+cost(r),0), totalFees=rows.reduce((x,r)=>x+fees(r)+ship(r),0), prof=rows.reduce((x,r)=>x+profit(r),0);
  $("#taxGross").textContent=money(revenue); $("#taxCogs").textContent=money(cogs); $("#taxFees").textContent=money(totalFees); $("#taxProfit").textContent=money(prof);
  $("#taxRows").innerHTML=rows.map(r=>`<tr><td>${fmt(dateOf(r))}</td><td>${esc(title(r))}</td><td>${esc(platform(r))}</td><td>${money(price(r))}</td><td>${money(cost(r))}</td><td>${money(fees(r))}</td><td>${money(ship(r))}</td><td class="${profit(r)>=0?"profit":"loss"}">${money(profit(r))}</td></tr>`).join("");
}
function renderMonthlyChart(){
  if(!window.Chart||!$("#monthlyProfitChart"))return;
  const year=Number($("#monthlyYearFilter")?.value||new Date().getFullYear());
  const monthRows=Array.from({length:12},(_,i)=>({month:i+1,profit:0,count:0,revenue:0}));
  sold().forEach(r=>{
    const d=dateOf(r); if(!d||d.getFullYear()!==year)return;
    const row=monthRows[d.getMonth()]; row.profit+=profit(r); row.revenue+=price(r); row.count++;
  });
  if(monthlyChart)monthlyChart.destroy();
  monthlyChart=new Chart($("#monthlyProfitChart"),{type:"bar",data:{labels:monthRows.map(x=>monthName(x.month).slice(0,3)),datasets:[{label:"Profit",data:monthRows.map(x=>x.profit),backgroundColor:"rgba(88,255,131,.55)",borderColor:"#58ff83",borderWidth:1},{label:"Items Sold",data:monthRows.map(x=>x.count),backgroundColor:"rgba(0,245,255,.30)",borderColor:"#00f5ff",borderWidth:1,yAxisID:"y1"}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{labels:{color:"rgba(226,232,240,.75)"}}},scales:{x:{ticks:{color:"rgba(226,232,240,.7)"},grid:{display:false}},y:{ticks:{color:"rgba(226,232,240,.7)",callback:v=>"$"+v},grid:{color:"rgba(255,255,255,.08)"}},y1:{position:"right",ticks:{color:"rgba(226,232,240,.7)",precision:0},grid:{drawOnChartArea:false}}}}});
}

["soldYearFilter","soldMonthFilter","taxYearFilter","taxMonthFilter","monthlyYearFilter"].forEach(id=>{
  document.addEventListener("change",e=>{if(e.target&&e.target.id===id)render()},true);
});
document.addEventListener("DOMContentLoaded",initLogin);
if(document.readyState!=="loading") initLogin();


/* ===== v204 fixes: robust row actions + corrected monthly chart ===== */
function getRowArray(type){
  if(type==="active") return active();
  if(type==="sold") return sold();
  if(type==="hold") return holds();
  return [];
}
function saveRowArray(type,arr){
  if(type==="active") setActive(arr);
  if(type==="sold") setSold(arr);
  if(type==="hold") setHolds(arr);
}

function rowAction(type,action,index){
  index=Number(index);
  if(!Number.isFinite(index)) return;
  if(action==="edit"){editItem(index);return}
  if(action==="hold"){moveToHold(index);return}
  if(action==="sold"){moveToSold(index);return}
  if(action==="unhold"){unhold(index);return}
  if(action==="deleteSold"){deleteSold(index);return}
  if(action==="deleteHold"){deleteHold(index);return}
}

invRow=function(r,i){
  const p=price(r),c=cost(r),pr=p-c,m=p?Math.round(pr/p*100):0;
  return `<tr>
    <td><div class="item-cell"><div class="thumb"></div><div>${esc(title(r))}<small>${esc(platform(r))}</small></div></div></td>
    <td>${money(p)}</td>
    <td>${money(c)}</td>
    <td class="${pr>=0?"profit":"loss"}">${pr>=0?"+":""}${money(pr)}</td>
    <td class="margin">${m}%</td>
    <td>${fmt(dateOf(r))}</td>
    <td class="status">Active</td>
    <td><div class="row-actions">
      <button type="button" data-action="edit" data-index="${i}">Edit</button>
      <button type="button" data-action="sold" data-index="${i}">Sold</button>
      <button type="button" data-action="hold" data-index="${i}">Hold</button>
    </div></td>
  </tr>`;
};

renderInventoryRows=function(){
  const all=active();
  const q=($("#inventorySearch")?.value||"").toLowerCase();
  const latest=all.map((r,i)=>({r,i})).sort((a,b)=>(dateOf(b.r)||0)-(dateOf(a.r)||0));
  $("#dashInventoryRows").innerHTML=latest.slice(0,5).map(({r,i})=>invRow(r,i)).join("");
  const rows=latest.filter(x=>!q||JSON.stringify(x.r).toLowerCase().includes(q));
  $("#inventoryRows").innerHTML=rows.map(({r,i})=>invRow(r,i)).join("");
};

renderSoldRows=function(){
  const q=($("#soldSearch")?.value||"").toLowerCase();
  const base=sold();
  const filtered=filterByYearMonth(base,$("#soldYearFilter"),$("#soldMonthFilter"))
    .map(r=>({r,i:base.indexOf(r)}))
    .filter(x=>!q||JSON.stringify(x.r).toLowerCase().includes(q));
  $("#soldRows").innerHTML=filtered.map(({r,i})=>{
    const p=price(r),pr=profit(r),m=p?Math.round(pr/p*100):0;
    return `<tr>
      <td><div class="item-cell"><div class="thumb"></div><div>${esc(title(r))}<small>${esc(platform(r))}</small></div></div></td>
      <td>${fmt(dateOf(r))}</td><td>${money(p)}</td><td>${money(cost(r))}</td>
      <td class="${pr>=0?"profit":"loss"}">${money(pr)}</td><td class="margin">${m}%</td>
      <td><div class="row-actions"><button type="button" data-action="deleteSold" data-index="${i}">Delete</button></div></td>
    </tr>`;
  }).join("");
};

renderHolds=function(){
  $("#holdRows").innerHTML=holds().map((r,i)=>`<tr>
    <td><div class="item-cell"><div class="thumb"></div><div>${esc(title(r))}<small>${esc(platform(r))}</small></div></div></td>
    <td>${money(price(r))}</td><td>${money(cost(r))}</td><td>${fmt(dateOf(r))}</td>
    <td><div class="row-actions">
      <button type="button" data-action="unhold" data-index="${i}">To Inventory</button>
      <button type="button" data-action="deleteHold" data-index="${i}">Delete</button>
    </div></td>
  </tr>`).join("");
};

window.editItem=function(i){
  editIndex=i;
  const r=active()[i];
  $("#modalTitle").textContent="Edit Item";
  const f=$("#itemForm");
  f.title.value=title(r);
  f.platform.value=platform(r).toLowerCase().includes("ebay")?"eBay":platform(r).toLowerCase().includes("private")?"Private Sale":"Mercari";
  const cat=category(r).toLowerCase();
  f.category.value=cat.includes("card")?"Card":cat.includes("other")?"Other":"Comic";
  f.price.value=price(r);
  f.cost.value=cost(r);
  f.notes.value=r.notes||"";
  $("#itemModal").classList.add("open");
};

document.addEventListener("click",function(e){
  const btn=e.target.closest&&e.target.closest("[data-action]");
  if(!btn)return;
  e.preventDefault();
  e.stopPropagation();
  rowAction("active",btn.dataset.action,btn.dataset.index);
},true);

function renderMonthlyChart(){
  if(!window.Chart||!$("#monthlyProfitChart"))return;
  const year=Number($("#monthlyYearFilter")?.value||new Date().getFullYear());
  const monthRows=Array.from({length:12},(_,i)=>({month:i+1,profit:0,count:0,revenue:0}));
  sold().forEach(r=>{
    const d=dateOf(r); if(!d||d.getFullYear()!==year)return;
    const row=monthRows[d.getMonth()];
    row.profit+=profit(r);
    row.revenue+=price(r);
    row.count++;
  });
  if(monthlyChart)monthlyChart.destroy();
  monthlyChart=new Chart($("#monthlyProfitChart"),{
    data:{
      labels:monthRows.map(x=>monthName(x.month).slice(0,3)),
      datasets:[
        {type:"bar",label:"Profit",data:monthRows.map(x=>Number(x.profit.toFixed(2))),backgroundColor:"rgba(88,255,131,.55)",borderColor:"#58ff83",borderWidth:1,borderRadius:6,yAxisID:"y"},
        {type:"line",label:"Items Sold",data:monthRows.map(x=>x.count),borderColor:"#00f5ff",backgroundColor:"rgba(0,245,255,.18)",pointBackgroundColor:"#00f5ff",pointRadius:3,tension:.35,yAxisID:"y1"}
      ]
    },
    options:{
      responsive:true,
      maintainAspectRatio:false,
      interaction:{mode:"index",intersect:false},
      plugins:{
        legend:{labels:{color:"rgba(226,232,240,.75)"}},
        tooltip:{callbacks:{label:ctx=>ctx.dataset.label==="Profit"?" Profit: "+money(ctx.parsed.y):" Items Sold: "+ctx.parsed.y}}
      },
      scales:{
        x:{ticks:{color:"rgba(226,232,240,.7)"},grid:{display:false}},
        y:{beginAtZero:true,ticks:{color:"rgba(226,232,240,.7)",callback:v=>"$"+v},grid:{color:"rgba(255,255,255,.08)"}},
        y1:{beginAtZero:true,position:"right",ticks:{color:"rgba(0,245,255,.8)",precision:0,stepSize:1},grid:{drawOnChartArea:false}}
      }
    }
  });
}


/* ===== v205: move-to-sold modal + monthly chart fix + global search navigation ===== */
let pendingSoldIndex=null;

function openSoldModal(i){
  pendingSoldIndex=Number(i);
  const r=active()[pendingSoldIndex];
  if(!r)return;
  const f=$("#soldForm");
  $("#soldItemName").textContent=title(r);
  f.soldPrice.value=price(r)||"";
  f.soldFees.value=fees(r)||"";
  f.soldShipping.value=ship(r)||"";
  f.soldDate.value=new Date().toISOString().slice(0,10);
  $("#soldModal").classList.add("open");
}

moveToSold=function(i){
  openSoldModal(i);
};

$("#cancelSold")?.addEventListener("click",()=>$("#soldModal").classList.remove("open"));

$("#soldForm")?.addEventListener("submit",e=>{
  e.preventDefault();
  const i=pendingSoldIndex;
  const a=active(), s=sold();
  if(!a[i])return;
  const fd=new FormData(e.target);
  const row={
    ...a[i],
    price:n(fd.get("soldPrice")),
    salePrice:n(fd.get("soldPrice")),
    soldPrice:n(fd.get("soldPrice")),
    fees:n(fd.get("soldFees")),
    shipping:n(fd.get("soldShipping")),
    soldDate:fd.get("soldDate")||new Date().toISOString().slice(0,10),
    status:"sold"
  };
  row.profit=row.price-cost(row)-row.fees-row.shipping;
  s.push(row);
  a.splice(i,1);
  setActive(a); setSold(s);
  pendingSoldIndex=null;
  $("#soldModal").classList.remove("open");
  render();
});

function renderMonthlyChart(){
  if(!window.Chart||!$("#monthlyProfitChart"))return;
  const year=Number($("#monthlyYearFilter")?.value||new Date().getFullYear());
  const monthRows=Array.from({length:12},(_,i)=>({month:i+1,profit:0,count:0}));
  sold().forEach(r=>{
    const d=dateOf(r); if(!d||d.getFullYear()!==year)return;
    const row=monthRows[d.getMonth()];
    row.profit+=profit(r);
    row.count++;
  });
  if(monthlyChart)monthlyChart.destroy();
  monthlyChart=new Chart($("#monthlyProfitChart"),{
    data:{
      labels:monthRows.map(x=>monthName(x.month).slice(0,3)),
      datasets:[
        {type:"bar",label:"Profit",data:monthRows.map(x=>Number(x.profit.toFixed(2))),backgroundColor:"rgba(88,255,131,.72)",borderColor:"#58ff83",borderWidth:1,borderRadius:6,yAxisID:"y"},
        {type:"line",label:"Items Sold",data:monthRows.map(x=>x.count),borderColor:"#00f5ff",backgroundColor:"rgba(0,245,255,.18)",pointBackgroundColor:"#00f5ff",pointRadius:3,tension:.25,yAxisID:"y1"}
      ]
    },
    options:{
      responsive:true,
      maintainAspectRatio:false,
      animation:false,
      plugins:{
        legend:{labels:{color:"rgba(226,232,240,.82)"}},
        tooltip:{callbacks:{label:ctx=>ctx.dataset.label==="Profit"?" Profit: "+money(ctx.parsed.y):" Items Sold: "+ctx.parsed.y}}
      },
      scales:{
        x:{ticks:{color:"rgba(226,232,240,.82)"},grid:{display:false}},
        y:{beginAtZero:true,position:"left",ticks:{color:"rgba(226,232,240,.82)",callback:v=>"$"+v},grid:{color:"rgba(255,255,255,.08)"}},
        y1:{beginAtZero:true,position:"right",suggestedMax:Math.max(5,...monthRows.map(x=>x.count))+1,ticks:{color:"rgba(0,245,255,.9)",precision:0,stepSize:1},grid:{drawOnChartArea:false}}
      }
    }
  });
}

function renderHeat(){
  const box=$("#heatmap");
  if(!box)return;
  box.innerHTML="";
  const now=new Date();
  const soldRows=sold();
  for(let i=34;i>=0;i--){
    const d=new Date(now);
    d.setDate(now.getDate()-i);
    const count=soldRows.filter(r=>{const rd=dateOf(r);return rd&&rd.toDateString()===d.toDateString()}).length;
    const cell=document.createElement("div");
    cell.className="heat"+(count?" on":"");
    cell.title=d.toLocaleDateString()+" • "+count+" sale"+(count===1?"":"s");
    cell.style.opacity=count?Math.min(1,.38+count*.18):.25;
    box.appendChild(cell);
  }
  if(!box.nextElementSibling||!box.nextElementSibling.classList.contains("calendar-legend")){
    const note=document.createElement("div");
    note.className="calendar-legend";
    note.textContent="Last 35 days. Brighter bars mean more sold items that day.";
    box.after(note);
  }
}

function goToInventoryItem(query){
  showPage("inventory");
  setTimeout(()=>{
    const input=$("#inventorySearch");
    if(input){input.value=query;renderInventoryRows();}
    const rows=[...document.querySelectorAll("#inventoryRows tr")];
    const first=rows[0];
    if(first){
      first.classList.add("search-hit");
      first.scrollIntoView({behavior:"smooth",block:"center"});
      setTimeout(()=>first.classList.remove("search-hit"),2600);
    }
  },80);
}

function renderCommand(q){
  q=q.toLowerCase();
  const items=[
    ...active().map((r,i)=>({icon:"◇",label:title(r),sub:"Inventory",page:"inventory",query:title(r)})),
    ...sold().map(r=>({icon:"$",label:title(r),sub:"Sold",page:"sold",query:title(r)})),
    ...holds().map(r=>({icon:"✓",label:title(r),sub:"Hold",page:"holds",query:title(r)}))
  ].filter(x=>!q||(x.label+x.sub).toLowerCase().includes(q)).slice(0,50);
  $("#commandResults").innerHTML=items.map((x,idx)=>`<div class="cmd-row" data-cmd-index="${idx}"><span>${x.icon}</span><div>${esc(x.label)}<small>${x.sub}</small></div><span>↵</span></div>`).join("");
  window.__cmdItems=items;
}

document.addEventListener("click",e=>{
  const row=e.target.closest&&e.target.closest("[data-cmd-index]");
  if(!row)return;
  const item=window.__cmdItems?.[Number(row.dataset.cmdIndex)];
  if(!item)return;
  $("#command").classList.remove("open");
  if(item.page==="inventory") goToInventoryItem(item.query);
  else showPage(item.page);
},true);

function loginShouldShow(){
  return !!$("#loginScreen") && sessionStorage.getItem("resellr_unlocked")!=="1";
}
setTimeout(()=>{if(loginShouldShow())showLogin()},300);


/* ===== v206: clean monthly profit chart - no line overlay ===== */
function renderMonthlyChart(){
  if(!window.Chart || !$("#monthlyProfitChart")) return;

  const year = Number($("#monthlyYearFilter")?.value || new Date().getFullYear());
  const monthRows = Array.from({length:12},(_,i)=>({month:i+1,profit:0,count:0}));

  sold().forEach(r=>{
    const d = dateOf(r);
    if(!d || d.getFullYear() !== year) return;
    const row = monthRows[d.getMonth()];
    row.profit += profit(r);
    row.count++;
  });

  if(monthlyChart) monthlyChart.destroy();

  monthlyChart = new Chart($("#monthlyProfitChart"),{
    type:"bar",
    data:{
      labels:monthRows.map(x=>monthName(x.month).slice(0,3)),
      datasets:[
        {
          label:"Profit",
          data:monthRows.map(x=>Number(x.profit.toFixed(2))),
          backgroundColor:"rgba(88,255,131,.72)",
          borderColor:"#58ff83",
          borderWidth:1,
          borderRadius:7,
          barPercentage:.58,
          categoryPercentage:.72
        }
      ]
    },
    options:{
      responsive:true,
      maintainAspectRatio:false,
      animation:false,
      plugins:{
        legend:{labels:{color:"rgba(226,232,240,.82)"}},
        tooltip:{
          callbacks:{
            afterLabel:function(ctx){
              const m = ctx.dataIndex;
              return "Items sold: " + monthRows[m].count;
            },
            label:function(ctx){
              return " Profit: " + money(ctx.parsed.y);
            }
          }
        }
      },
      scales:{
        x:{
          ticks:{color:"rgba(226,232,240,.82)"},
          grid:{display:false}
        },
        y:{
          beginAtZero:true,
          ticks:{
            color:"rgba(226,232,240,.82)",
            callback:v=>"$"+v
          },
          grid:{color:"rgba(255,255,255,.08)"}
        }
      }
    }
  });
}



/* ===== v207: dashboard range, latest sold, monthly line, menu check, lock, comps, tax sort ===== */
function inRangeBySelect(r){
  const d=dateOf(r);
  if(!d)return false;
  const range=($("#rangeSelect")?.value||"ALL").toUpperCase();
  const now=new Date();
  if(range==="ALL")return true;
  if(range==="YTD")return d.getFullYear()===now.getFullYear();
  if(range==="30D"){
    const cutoff=new Date(now);
    cutoff.setDate(now.getDate()-30);
    return d>=cutoff;
  }
  return true;
}

function sortedSoldDesc(rows=sold()){
  return rows.slice().sort((a,b)=>(dateOf(b)||0)-(dateOf(a)||0));
}

drawChart=function(){
  if(!window.Chart)return;
  const canvas=$("#growthChart");
  if(!canvas)return;

  const by=new Map();
  sortedSoldDesc().filter(inRangeBySelect).forEach(r=>{
    const d=dateOf(r);
    if(!d)return;
    const k=d.toISOString().slice(0,10);
    if(!by.has(k))by.set(k,{d,profit:0,income:0,count:0});
    const b=by.get(k);
    b.profit+=profit(r);
    b.income+=price(r);
    b.count++;
  });

  let cumulativeProfit=0;
  const rows=[...by.values()].sort((a,b)=>a.d-b.d).map(x=>{
    cumulativeProfit+=x.profit;
    return {
      label:x.d.toLocaleDateString("en-US",{month:"short",day:"numeric"}),
      profit:Number(cumulativeProfit.toFixed(2)),
      income:Number(x.income.toFixed(2)),
      count:x.count
    };
  });

  if(chart)chart.destroy();
  chart=new Chart(canvas,{
    type:"line",
    data:{
      labels:rows.map(r=>r.label),
      datasets:[
        {
          label:"Cumulative profit",
          data:rows.map(r=>r.profit),
          borderColor:"#00f5ff",
          backgroundColor:"rgba(0,245,255,.15)",
          fill:true,
          tension:.32,
          pointRadius:2,
          pointBackgroundColor:"#58ff83"
        }
      ]
    },
    options:{
      responsive:true,
      maintainAspectRatio:false,
      animation:false,
      plugins:{
        legend:{display:false},
        tooltip:{callbacks:{label:ctx=>" Profit: "+money(ctx.parsed.y)}}
      },
      scales:{
        x:{grid:{display:false},ticks:{color:"rgba(226,232,240,.72)",maxTicksLimit:8}},
        y:{beginAtZero:true,grid:{color:"rgba(255,255,255,.08)"},ticks:{color:"rgba(226,232,240,.72)",callback:v=>"$"+v}}
      }
    }
  });
};

renderMonthlyChart=function(){
  if(!window.Chart||!$("#monthlyProfitChart"))return;
  const year=Number($("#monthlyYearFilter")?.value||new Date().getFullYear());
  const monthRows=Array.from({length:12},(_,i)=>({month:i+1,profit:0,count:0}));

  sold().forEach(r=>{
    const d=dateOf(r); 
    if(!d||d.getFullYear()!==year)return;
    const row=monthRows[d.getMonth()];
    row.profit+=profit(r);
    row.count++;
  });

  if(monthlyChart)monthlyChart.destroy();
  monthlyChart=new Chart($("#monthlyProfitChart"),{
    type:"line",
    data:{
      labels:monthRows.map(x=>monthName(x.month).slice(0,3)),
      datasets:[
        {
          label:"Monthly profit",
          data:monthRows.map(x=>Number(x.profit.toFixed(2))),
          borderColor:"#58ff83",
          backgroundColor:"rgba(88,255,131,.14)",
          fill:true,
          tension:.32,
          pointRadius:4,
          pointBackgroundColor:"#58ff83",
          pointBorderColor:"#07111f",
          pointBorderWidth:2
        }
      ]
    },
    options:{
      responsive:true,
      maintainAspectRatio:false,
      animation:false,
      plugins:{
        legend:{labels:{color:"rgba(226,232,240,.82)"}},
        tooltip:{
          callbacks:{
            label:ctx=>" Profit: "+money(ctx.parsed.y),
            afterLabel:ctx=>"Items sold: "+monthRows[ctx.dataIndex].count
          }
        }
      },
      scales:{
        x:{ticks:{color:"rgba(226,232,240,.82)"},grid:{display:false}},
        y:{beginAtZero:true,ticks:{color:"rgba(226,232,240,.82)",callback:v=>"$"+v},grid:{color:"rgba(255,255,255,.08)"}}
      }
    }
  });
};

function openComps(i){
  const r=active()[Number(i)];
  if(!r)return;
  const q=encodeURIComponent(title(r));
  window.open(`https://www.ebay.com/sch/i.html?_nkw=${q}&LH_Sold=1&LH_Complete=1`,"_blank");
}

invRow=function(r,i){
  const p=price(r),c=cost(r),pr=p-c,m=p?Math.round(pr/p*100):0;
  return `<tr>
    <td><div class="item-cell"><div class="thumb"></div><div>${esc(title(r))}<small>${esc(platform(r))}</small></div></div></td>
    <td>${money(p)}</td>
    <td>${money(c)}</td>
    <td class="${pr>=0?"profit":"loss"}">${pr>=0?"+":""}${money(pr)}</td>
    <td class="margin">${m}%</td>
    <td>${fmt(dateOf(r))}</td>
    <td class="status">Active</td>
    <td><div class="row-actions">
      <button type="button" data-action="edit" data-index="${i}">Edit</button>
      <button type="button" data-action="sold" data-index="${i}">Sold</button>
      <button type="button" data-action="comps" data-index="${i}" class="comps-btn">Comps</button>
      <button type="button" data-action="hold" data-index="${i}">Hold</button>
    </div></td>
  </tr>`;
};

function renderTaxFiltered(){
  const rows=filterByYearMonth(sold(),$("#taxYearFilter"),$("#taxMonthFilter")).sort((a,b)=>(dateOf(b)||0)-(dateOf(a)||0));
  const revenue=rows.reduce((x,r)=>x+price(r),0), cogs=rows.reduce((x,r)=>x+cost(r),0), totalFees=rows.reduce((x,r)=>x+fees(r)+ship(r),0), prof=rows.reduce((x,r)=>x+profit(r),0);
  $("#taxGross").textContent=money(revenue); $("#taxCogs").textContent=money(cogs); $("#taxFees").textContent=money(totalFees); $("#taxProfit").textContent=money(prof);
  $("#taxRows").innerHTML=rows.map(r=>`<tr><td>${fmt(dateOf(r))}</td><td>${esc(title(r))}</td><td>${esc(platform(r))}</td><td>${money(price(r))}</td><td>${money(cost(r))}</td><td>${money(fees(r))}</td><td>${money(ship(r))}</td><td class="${profit(r)>=0?"profit":"loss"}">${money(profit(r))}</td></tr>`).join("");
}

function updateBackgroundChecks(selected){
  const current=selected||localStorage.getItem("resellr_bg")||document.body.className||"ambient";
  document.querySelectorAll(".menu [data-bg]").forEach(btn=>{
    btn.classList.toggle("selected-bg",btn.dataset.bg===current);
    const clean=btn.textContent.replace(/\s*✓\s*$/,"");
    btn.textContent=clean;
  });
}

document.addEventListener("click",function(e){
  const actionBtn=e.target.closest&&e.target.closest("[data-action]");
  if(actionBtn&&actionBtn.dataset.action==="comps"){
    e.preventDefault();
    e.stopPropagation();
    openComps(actionBtn.dataset.index);
    return;
  }

  const bg=e.target.closest&&e.target.closest(".menu [data-bg]");
  if(bg){
    localStorage.setItem("resellr_bg",bg.dataset.bg);
    updateBackgroundChecks(bg.dataset.bg);
    setTimeout(()=>updateBackgroundChecks(bg.dataset.bg),30);
  }

  if(e.target&&e.target.id==="lockAppBtn"){
    e.preventDefault();
    sessionStorage.removeItem("resellr_unlocked");
    showLogin();
  }
},true);

document.addEventListener("change",function(e){
  if(e.target&&e.target.id==="rangeSelect"){
    drawChart();
  }
},true);

// Patch render so dashboard recently sold is newest first and range chart updates.
const oldRenderV207=render;
render=function(){
  oldRenderV207();

  const newest=sortedSoldDesc();
  $("#recentSold").innerHTML=newest.slice(0,5).map(r=>`<div class="recent-row"><b>${esc(title(r))}</b><span>${money(price(r))}</span><span>${fmt(dateOf(r))}</span></div>`).join("");
  $("#tickerRecent").textContent=newest[0]?`${title(newest[0])} • ${money(price(newest[0]))} • ${profit(newest[0])>=0?"+":""}${money(profit(newest[0]))}`:"No sales yet";
  drawChart();
  renderMonthlyChart();
  renderTaxFiltered();
  updateBackgroundChecks();
};

// Apply saved background at startup.
(function(){
  const bg=localStorage.getItem("resellr_bg");
  if(bg)document.body.className=bg;
  setTimeout(updateBackgroundChecks,100);
})();


/* ===== v208: sold filtered totals + latest sold first + inventory KPI totals ===== */
function getSoldFilteredRows(){
  const q=($("#soldSearch")?.value||"").toLowerCase();
  return filterByYearMonth(sold(),$("#soldYearFilter"),$("#soldMonthFilter"))
    .slice()
    .sort((a,b)=>(dateOf(b)||0)-(dateOf(a)||0))
    .filter(r=>!q||JSON.stringify(r).toLowerCase().includes(q));
}

function updateSoldKpisFromRows(rows){
  const revenue=rows.reduce((x,r)=>x+price(r),0);
  const prof=rows.reduce((x,r)=>x+profit(r),0);
  $("#soldTotal").textContent=rows.length;
  $("#soldRevenue").textContent=money(revenue);
  $("#soldProfit").textContent=money(prof);
  $("#soldMargin").textContent=(revenue?Math.round(prof/revenue*100):0)+"%";
}

function updateInventoryKpis(){
  const rows=active();
  const listed=rows.reduce((x,r)=>x+price(r),0);
  const totalCost=rows.reduce((x,r)=>x+cost(r),0);
  const potential=listed-totalCost;
  if($("#invTotalActive")) $("#invTotalActive").textContent=rows.length;
  if($("#invTotalValue")) $("#invTotalValue").textContent=money(listed);
  if($("#invTotalCost")) $("#invTotalCost").textContent=money(totalCost);
  if($("#invPotentialProfit")) $("#invPotentialProfit").textContent=money(potential);
}

renderSoldRows=function(){
  const base=sold();
  const rows=getSoldFilteredRows().map(r=>({r,i:base.indexOf(r)}));
  updateSoldKpisFromRows(rows.map(x=>x.r));
  $("#soldRows").innerHTML=rows.map(({r,i})=>{
    const p=price(r),pr=profit(r),m=p?Math.round(pr/p*100):0;
    return `<tr>
      <td><div class="item-cell"><div class="thumb"></div><div>${esc(title(r))}<small>${esc(platform(r))}</small></div></div></td>
      <td>${fmt(dateOf(r))}</td><td>${money(p)}</td><td>${money(cost(r))}</td>
      <td class="${pr>=0?"profit":"loss"}">${money(pr)}</td><td class="margin">${m}%</td>
      <td><div class="row-actions"><button type="button" data-action="deleteSold" data-index="${i}">Delete</button></div></td>
    </tr>`;
  }).join("");
};

const oldRenderV208=render;
render=function(){
  oldRenderV208();
  updateInventoryKpis();
  renderSoldRows();
};

// Make filter/search updates immediately update sold KPIs too.
document.addEventListener("input",function(e){
  if(e.target && e.target.id==="soldSearch") renderSoldRows();
},true);

document.addEventListener("change",function(e){
  if(e.target && (e.target.id==="soldYearFilter" || e.target.id==="soldMonthFilter")) renderSoldRows();
},true);


/* ===== v209: holds KPIs, single global search UI, cost+profit chart lines ===== */
function costPlusProfitSoldRows(rows=sold()){
  return rows.reduce((x,r)=>x+cost(r)+profit(r),0);
}

function updateHoldsKpis(){
  const rows=holds();
  const holdValue=rows.reduce((x,r)=>x+price(r),0);
  const holdCost=rows.reduce((x,r)=>x+cost(r),0);
  const potential=holdValue-holdCost;
  if($("#holdsTotalItems")) $("#holdsTotalItems").textContent=rows.length;
  if($("#holdsTotalValue")) $("#holdsTotalValue").textContent=money(holdValue);
  if($("#holdsTotalCost")) $("#holdsTotalCost").textContent=money(holdCost);
  if($("#holdsPotentialProfit")) $("#holdsPotentialProfit").textContent=money(potential);
}

function updateDashboardCostProfit(){
  if($("#kpiCostProfit")) $("#kpiCostProfit").textContent=money(costPlusProfitSoldRows());
}

drawChart=function(){
  if(!window.Chart)return;
  const canvas=$("#growthChart");
  if(!canvas)return;

  const by=new Map();
  sortedSoldDesc().filter(inRangeBySelect).forEach(r=>{
    const d=dateOf(r);
    if(!d)return;
    const k=d.toISOString().slice(0,10);
    if(!by.has(k))by.set(k,{d,profit:0,costProfit:0,income:0,count:0});
    const b=by.get(k);
    b.profit+=profit(r);
    b.costProfit+=cost(r)+profit(r);
    b.income+=price(r);
    b.count++;
  });

  let cumulativeProfit=0;
  let cumulativeCostProfit=0;
  const rows=[...by.values()].sort((a,b)=>a.d-b.d).map(x=>{
    cumulativeProfit+=x.profit;
    cumulativeCostProfit+=x.costProfit;
    return {
      label:x.d.toLocaleDateString("en-US",{month:"short",day:"numeric"}),
      profit:Number(cumulativeProfit.toFixed(2)),
      costProfit:Number(cumulativeCostProfit.toFixed(2))
    };
  });

  if(chart)chart.destroy();
  chart=new Chart(canvas,{
    type:"line",
    data:{
      labels:rows.map(r=>r.label),
      datasets:[
        {
          label:"Profit",
          data:rows.map(r=>r.profit),
          borderColor:"#00f5ff",
          backgroundColor:"rgba(0,245,255,.12)",
          fill:true,
          tension:.32,
          pointRadius:2,
          pointBackgroundColor:"#00f5ff"
        },
        {
          label:"Cost + Profit",
          data:rows.map(r=>r.costProfit),
          borderColor:"#cf52ff",
          backgroundColor:"rgba(207,82,255,.10)",
          fill:false,
          tension:.32,
          pointRadius:2,
          pointBackgroundColor:"#cf52ff"
        }
      ]
    },
    options:{
      responsive:true,
      maintainAspectRatio:false,
      animation:false,
      plugins:{
        legend:{display:true,labels:{color:"rgba(226,232,240,.82)"}},
        tooltip:{callbacks:{label:ctx=>" "+ctx.dataset.label+": "+money(ctx.parsed.y)}}
      },
      scales:{
        x:{grid:{display:false},ticks:{color:"rgba(226,232,240,.72)",maxTicksLimit:8}},
        y:{beginAtZero:true,grid:{color:"rgba(255,255,255,.08)"},ticks:{color:"rgba(226,232,240,.72)",callback:v=>"$"+v}}
      }
    }
  });
};

renderMonthlyChart=function(){
  if(!window.Chart||!$("#monthlyProfitChart"))return;
  const year=Number($("#monthlyYearFilter")?.value||new Date().getFullYear());
  const monthRows=Array.from({length:12},(_,i)=>({month:i+1,profit:0,costProfit:0,count:0}));

  sold().forEach(r=>{
    const d=dateOf(r);
    if(!d||d.getFullYear()!==year)return;
    const row=monthRows[d.getMonth()];
    row.profit+=profit(r);
    row.costProfit+=cost(r)+profit(r);
    row.count++;
  });

  if(monthlyChart)monthlyChart.destroy();
  monthlyChart=new Chart($("#monthlyProfitChart"),{
    type:"line",
    data:{
      labels:monthRows.map(x=>monthName(x.month).slice(0,3)),
      datasets:[
        {
          label:"Monthly profit",
          data:monthRows.map(x=>Number(x.profit.toFixed(2))),
          borderColor:"#58ff83",
          backgroundColor:"rgba(88,255,131,.14)",
          fill:true,
          tension:.32,
          pointRadius:4,
          pointBackgroundColor:"#58ff83",
          pointBorderColor:"#07111f",
          pointBorderWidth:2
        },
        {
          label:"Cost + Profit",
          data:monthRows.map(x=>Number(x.costProfit.toFixed(2))),
          borderColor:"#cf52ff",
          backgroundColor:"rgba(207,82,255,.08)",
          fill:false,
          tension:.32,
          pointRadius:3,
          pointBackgroundColor:"#cf52ff"
        }
      ]
    },
    options:{
      responsive:true,
      maintainAspectRatio:false,
      animation:false,
      plugins:{
        legend:{labels:{color:"rgba(226,232,240,.82)"}},
        tooltip:{callbacks:{label:ctx=>" "+ctx.dataset.label+": "+money(ctx.parsed.y),afterLabel:ctx=>"Items sold: "+monthRows[ctx.dataIndex].count}}
      },
      scales:{
        x:{ticks:{color:"rgba(226,232,240,.82)"},grid:{display:false}},
        y:{beginAtZero:true,ticks:{color:"rgba(226,232,240,.82)",callback:v=>"$"+v},grid:{color:"rgba(255,255,255,.08)"}}
      }
    }
  });
};

function openCommand(){
  renderCommand("");
  $("#command").classList.add("open");
  // Keep only the top search bar visible. Hide duplicate input and still focus the main search button is not needed.
}

function renderCommand(q){
  q=(q||"").toLowerCase();
  const items=[
    ...active().map((r,i)=>({icon:"◇",label:title(r),sub:"Inventory",page:"inventory",query:title(r)})),
    ...sold().map(r=>({icon:"$",label:title(r),sub:"Sold",page:"sold",query:title(r)})),
    ...holds().map(r=>({icon:"✓",label:title(r),sub:"Hold",page:"holds",query:title(r)}))
  ].filter(x=>!q||(x.label+x.sub).toLowerCase().includes(q)).slice(0,50);
  $("#commandResults").innerHTML=items.map((x,idx)=>`<div class="cmd-row" data-cmd-index="${idx}"><span>${x.icon}</span><div>${esc(x.label)}<small>${x.sub}</small></div><span>↵</span></div>`).join("");
  window.__cmdItems=items;
}

// Make the visible top global search actually filter command results while open.
$("#openCommand")?.addEventListener("click",()=>{
  openCommand();
},true);

document.addEventListener("keydown",function(e){
  if((e.metaKey||e.ctrlKey)&&String(e.key).toLowerCase()==="k"){
    e.preventDefault();
    openCommand();
  }
},true);

const oldRenderV209=render;
render=function(){
  oldRenderV209();
  updateHoldsKpis();
  updateDashboardCostProfit();
  drawChart();
  renderMonthlyChart();
};


/* ===== v210: total income, graph income, inventory pagination, settings, bookmarklet ===== */
let inventoryPage=1;
const inventoryPageSize=25;

function totalIncomeRows(rows=sold()){
  return rows.reduce((x,r)=>x+price(r),0);
}

function updateDashboardIncome(){
  if($("#kpiTotalIncome")) $("#kpiTotalIncome").textContent=money(totalIncomeRows());
}

drawChart=function(){
  if(!window.Chart)return;
  const canvas=$("#growthChart");
  if(!canvas)return;

  const by=new Map();
  sortedSoldDesc().filter(inRangeBySelect).forEach(r=>{
    const d=dateOf(r);
    if(!d)return;
    const k=d.toISOString().slice(0,10);
    if(!by.has(k))by.set(k,{d,income:0,profit:0,costProfit:0});
    const b=by.get(k);
    b.income+=price(r);
    b.profit+=profit(r);
    b.costProfit+=cost(r)+profit(r);
  });

  let cumIncome=0,cumProfit=0,cumCostProfit=0;
  const rows=[...by.values()].sort((a,b)=>a.d-b.d).map(x=>{
    cumIncome+=x.income;
    cumProfit+=x.profit;
    cumCostProfit+=x.costProfit;
    return {
      label:x.d.toLocaleDateString("en-US",{month:"short",day:"numeric"}),
      income:Number(cumIncome.toFixed(2)),
      profit:Number(cumProfit.toFixed(2)),
      costProfit:Number(cumCostProfit.toFixed(2))
    };
  });

  if(chart)chart.destroy();
  chart=new Chart(canvas,{
    type:"line",
    data:{
      labels:rows.map(r=>r.label),
      datasets:[
        {label:"Total Income",data:rows.map(r=>r.income),borderColor:"#ffb31a",backgroundColor:"rgba(255,179,26,.10)",fill:false,tension:.32,pointRadius:2,pointBackgroundColor:"#ffb31a"},
        {label:"Profit",data:rows.map(r=>r.profit),borderColor:"#00f5ff",backgroundColor:"rgba(0,245,255,.12)",fill:true,tension:.32,pointRadius:2,pointBackgroundColor:"#00f5ff"},
        {label:"Cost + Profit",data:rows.map(r=>r.costProfit),borderColor:"#cf52ff",backgroundColor:"rgba(207,82,255,.08)",fill:false,tension:.32,pointRadius:2,pointBackgroundColor:"#cf52ff"}
      ]
    },
    options:{
      responsive:true,
      maintainAspectRatio:false,
      animation:false,
      plugins:{
        legend:{display:true,labels:{color:"rgba(226,232,240,.82)"}},
        tooltip:{callbacks:{label:ctx=>" "+ctx.dataset.label+": "+money(ctx.parsed.y)}}
      },
      scales:{
        x:{grid:{display:false},ticks:{color:"rgba(226,232,240,.72)",maxTicksLimit:8}},
        y:{beginAtZero:true,grid:{color:"rgba(255,255,255,.08)"},ticks:{color:"rgba(226,232,240,.72)",callback:v=>"$"+v}}
      }
    }
  });
};

function renderInventoryPager(total){
  const pager=$("#inventoryPager");
  if(!pager)return;
  const pages=Math.max(1,Math.ceil(total/inventoryPageSize));
  if(inventoryPage>pages) inventoryPage=pages;
  const start=total?((inventoryPage-1)*inventoryPageSize)+1:0;
  const end=Math.min(total,inventoryPage*inventoryPageSize);
  let btns=`<button type="button" data-inv-page="prev" ${inventoryPage<=1?"disabled":""}>‹</button>`;
  const maxButtons=7;
  let first=Math.max(1,inventoryPage-3);
  let last=Math.min(pages,first+maxButtons-1);
  first=Math.max(1,last-maxButtons+1);
  for(let p=first;p<=last;p++){
    btns+=`<button type="button" data-inv-page="${p}" class="${p===inventoryPage?"active":""}">${p}</button>`;
  }
  btns+=`<button type="button" data-inv-page="next" ${inventoryPage>=pages?"disabled":""}>›</button>`;
  pager.innerHTML=`<span>Showing ${start}-${end} of ${total}</span><div class="pager-buttons">${btns}</div>`;
}

renderInventoryRows=function(){
  const all=active();
  const q=($("#inventorySearch")?.value||"").toLowerCase();
  const latest=all.map((r,i)=>({r,i})).sort((a,b)=>(dateOf(b.r)||0)-(dateOf(a.r)||0));
  $("#dashInventoryRows").innerHTML=latest.slice(0,5).map(({r,i})=>invRow(r,i)).join("");

  const filtered=latest.filter(x=>!q||JSON.stringify(x.r).toLowerCase().includes(q));
  const total=filtered.length;
  const start=(inventoryPage-1)*inventoryPageSize;
  const pageRows=filtered.slice(start,start+inventoryPageSize);
  $("#inventoryRows").innerHTML=pageRows.map(({r,i})=>invRow(r,i)).join("");
  renderInventoryPager(total);
};

document.addEventListener("click",function(e){
  const btn=e.target.closest&&e.target.closest("[data-inv-page]");
  if(!btn)return;
  e.preventDefault();
  const total=active().filter(r=>!($("#inventorySearch")?.value||"").toLowerCase()||JSON.stringify(r).toLowerCase().includes(($("#inventorySearch")?.value||"").toLowerCase())).length;
  const pages=Math.max(1,Math.ceil(total/inventoryPageSize));
  const val=btn.dataset.invPage;
  if(val==="prev") inventoryPage=Math.max(1,inventoryPage-1);
  else if(val==="next") inventoryPage=Math.min(pages,inventoryPage+1);
  else inventoryPage=Number(val)||1;
  renderInventoryRows();
},true);

document.addEventListener("input",function(e){
  if(e.target&&e.target.id==="inventorySearch"){
    inventoryPage=1;
    renderInventoryRows();
  }
},true);

function getBookmarkletCode(){
  return `javascript:(()=>{try{const title=(document.querySelector('[data-testid="ItemName"],h1,[class*="title" i]')?.innerText||document.title||'').trim();const desc=(document.querySelector('[data-testid="ItemDescription"],[class*="description" i],meta[name="description"]')?.innerText||document.querySelector('meta[name="description"]')?.content||'').trim();const priceText=(document.body.innerText.match(/\\$\\s?\\d+(?:\\.\\d{2})?/)||[''])[0];const price=Number(priceText.replace(/[^0-9.]/g,''))||0;const payload={title,notes:desc,price,platform:location.hostname.includes('ebay')?'eBay':location.hostname.includes('mercari')?'Mercari':'Mercari',category:'Comic',addedAt:new Date().toISOString(),sourceUrl:location.href};localStorage.setItem('resellr_bookmarklet_item',JSON.stringify(payload));alert('Saved to RESELLr. Open RESELLr and click Import Bookmarklet Item in Settings.');}catch(e){alert('RESELLr bookmarklet failed: '+e.message)}})()`;
}

function setupBookmarklet(){
  const code=getBookmarkletCode();
  const link=$("#bookmarkletLink");
  if(link) link.href=code;
  if($("#bookmarkletCode")) $("#bookmarkletCode").value=code;

  if(!$("#importBookmarkletBtn") && link){
    const btn=document.createElement("button");
    btn.id="importBookmarkletBtn";
    btn.textContent="Import Bookmarklet Item";
    btn.style.marginTop="12px";
    link.parentElement.appendChild(btn);
    btn.addEventListener("click",()=>{
      const raw=localStorage.getItem("resellr_bookmarklet_item");
      if(!raw){alert("No bookmarklet item found yet.");return}
      try{
        const item=JSON.parse(raw);
        const rows=active();
        rows.unshift(item);
        setActive(rows);
        localStorage.removeItem("resellr_bookmarklet_item");
        alert("Bookmarklet item added to inventory.");
        showPage("inventory");
        render();
      }catch(e){alert("Could not import bookmarklet item.");}
    });
  }
}

document.addEventListener("click",function(e){
  if(e.target&&e.target.id==="settingsLockBtn"){
    e.preventDefault();
    sessionStorage.removeItem("resellr_unlocked");
    showLogin();
  }
},true);

const oldShowPageV210=showPage;
showPage=function(id){
  oldShowPageV210(id);
  if(id==="settings") setupBookmarklet();
};

const oldRenderV210=render;
render=function(){
  oldRenderV210();
  updateDashboardIncome();
  drawChart();
  renderInventoryRows();
  setupBookmarklet();
};
setTimeout(setupBookmarklet,300);


/* ===== v211: bookmarklet import fixed by URL transfer ===== */
function getAppBaseUrl(){
  return location.origin + location.pathname;
}

function getBookmarkletCode(){
  const target = getAppBaseUrl();
  return `javascript:(()=>{try{const pick=s=>document.querySelector(s);const txt=e=>e?(e.innerText||e.textContent||e.content||'').trim():'';let title=txt(pick('[data-testid="ItemName"],h1,[class*="title" i]'));if(!title)title=(document.title||'').replace(/\\s*\\|.*$/,'').trim();let desc=txt(pick('[data-testid="ItemDescription"],[class*="description" i],meta[name="description"]'));let priceText='';const all=document.body.innerText||'';const m=all.match(/\\$\\s?\\d[\\d,]*(?:\\.\\d{2})?/);if(m)priceText=m[0];const price=Number(priceText.replace(/[^0-9.]/g,''))||0;const platform=location.hostname.includes('ebay')?'eBay':location.hostname.includes('mercari')?'Mercari':'Mercari';const payload={title,notes:desc,price,platform,category:'Comic',sourceUrl:location.href,addedAt:new Date().toISOString()};const data=encodeURIComponent(btoa(unescape(encodeURIComponent(JSON.stringify(payload)))));window.open('${target}?importItem='+data,'_blank');}catch(e){alert('RESELLr bookmarklet failed: '+e.message)}})()`;
}

function readImportItemFromUrl(){
  try{
    const params=new URLSearchParams(location.search);
    const raw=params.get("importItem");
    if(!raw)return null;
    const json=decodeURIComponent(escape(atob(decodeURIComponent(raw))));
    return JSON.parse(json);
  }catch(e){
    console.error(e);
    return null;
  }
}

function importItemObject(item,showAlert=true){
  if(!item||!item.title){
    if(showAlert) alert("No bookmarklet item found.");
    return false;
  }
  const rows=active();
  rows.unshift({
    title:item.title||"Untitled item",
    notes:item.notes||"",
    price:n(item.price),
    cost:n(item.cost),
    platform:item.platform||"Mercari",
    category:item.category||"Comic",
    sourceUrl:item.sourceUrl||"",
    addedAt:item.addedAt||new Date().toISOString(),
    status:"active"
  });
  setActive(rows);
  render();
  if(showAlert) alert("Bookmarklet item added to inventory.");
  return true;
}

function importFromUrlThenClean(){
  const item=readImportItemFromUrl();
  if(!item)return false;
  const ok=importItemObject(item,true);
  if(ok){
    history.replaceState({},document.title,location.origin+location.pathname);
    showPage("inventory");
  }
  return ok;
}

function setupBookmarklet(){
  const code=getBookmarkletCode();
  const link=$("#bookmarkletLink");
  if(link) link.href=code;
  if($("#bookmarkletCode")) $("#bookmarkletCode").value=code;

  if(!$("#importBookmarkletBtn") && link){
    const btn=document.createElement("button");
    btn.id="importBookmarkletBtn";
    btn.textContent="Import Bookmarklet Item";
    btn.style.marginTop="12px";
    link.parentElement.appendChild(btn);
    btn.addEventListener("click",()=>{
      if(importFromUrlThenClean()) return;
      const raw=localStorage.getItem("resellr_bookmarklet_item");
      if(!raw){alert("No bookmarklet item found. Use the bookmarklet on a Mercari/eBay item page first.");return}
      try{
        const item=JSON.parse(raw);
        if(importItemObject(item,true)){
          localStorage.removeItem("resellr_bookmarklet_item");
          showPage("inventory");
        }
      }catch(e){alert("Could not import bookmarklet item.");}
    });
  }

  const manual=$("#importFromUrlBtn");
  if(manual && !manual.dataset.bound){
    manual.dataset.bound="1";
    manual.addEventListener("click",()=>{
      if(!importFromUrlThenClean()) alert("No item data found in the RESELLr URL.");
    });
  }
}

// Auto-import when bookmarklet opens RESELLr with ?importItem=
setTimeout(()=>{if(readImportItemFromUrl()) importFromUrlThenClean();},500);
setTimeout(setupBookmarklet,800);


/* ===== v212: cleaner Mercari bookmarklet title + simple notes ===== */
function getBookmarkletCode(){
  const target = getAppBaseUrl();
  return `javascript:(()=>{try{
    const pick=s=>document.querySelector(s);
    const txt=e=>e?(e.innerText||e.textContent||e.content||'').trim():'';
    const clean=s=>String(s||'').replace(/\\s+/g,' ').replace(/\\s*[|•].*$/,'').trim();

    let title='';
    const h1=pick('h1');
    if(h1) title=clean(txt(h1));

    if(!title){
      const candidates=[...document.querySelectorAll('[data-testid="ItemName"],[class*="title" i]')].map(e=>clean(txt(e))).filter(Boolean);
      title=candidates.sort((a,b)=>b.length-a.length)[0]||'';
    }

    if(!title) title=clean(document.title);

    let priceText='';
    const all=document.body.innerText||'';
    const priceMatches=[...all.matchAll(/\\$\\s?\\d[\\d,]*(?:\\.\\d{2})?/g)].map(m=>m[0]);
    if(priceMatches.length) priceText=priceMatches[0];
    const price=Number(priceText.replace(/[^0-9.]/g,''))||0;

    const platform=location.hostname.includes('ebay')?'eBay':location.hostname.includes('mercari')?'Mercari':'Mercari';
    const payload={
      title:title,
      notes:'Added from '+platform,
      price:price,
      platform:platform,
      category:'Comic',
      sourceUrl:location.href,
      addedAt:new Date().toISOString()
    };
    const data=encodeURIComponent(btoa(unescape(encodeURIComponent(JSON.stringify(payload)))));
    window.open('${target}?importItem='+data,'_blank');
  }catch(e){alert('RESELLr bookmarklet failed: '+e.message)}})()`;
}

function importItemObject(item,showAlert=true){
  if(!item||!item.title){
    if(showAlert) alert("No bookmarklet item found.");
    return false;
  }

  const platform=item.platform||"Mercari";
  const rows=active();
  rows.unshift({
    title:String(item.title||"Untitled item").replace(/\s+/g," ").trim(),
    notes:item.notes || ("Added from " + platform),
    price:n(item.price),
    cost:n(item.cost),
    platform:platform,
    category:item.category||"Comic",
    sourceUrl:item.sourceUrl||"",
    addedAt:item.addedAt||new Date().toISOString(),
    status:"active"
  });
  setActive(rows);
  render();
  if(showAlert) alert("Bookmarklet item added to inventory.");
  return true;
}

setTimeout(setupBookmarklet,500);



/* ===== v213: delete inventory + fixed global search + useful top icons ===== */
function deleteInventoryItem(i){
  i=Number(i);
  const rows=active();
  if(!rows[i])return;
  if(!confirm("Delete this inventory item?"))return;
  rows.splice(i,1);
  setActive(rows);
  render();
}

invRow=function(r,i){
  const p=price(r),c=cost(r),pr=p-c,m=p?Math.round(pr/p*100):0;
  return `<tr>
    <td><div class="item-cell"><div class="thumb"></div><div>${esc(title(r))}<small>${esc(platform(r))}</small></div></div></td>
    <td>${money(p)}</td>
    <td>${money(c)}</td>
    <td class="${pr>=0?"profit":"loss"}">${pr>=0?"+":""}${money(pr)}</td>
    <td class="margin">${m}%</td>
    <td>${fmt(dateOf(r))}</td>
    <td class="status">Active</td>
    <td><div class="row-actions">
      <button type="button" data-action="edit" data-index="${i}">Edit</button>
      <button type="button" data-action="sold" data-index="${i}">Sold</button>
      <button type="button" data-action="comps" data-index="${i}" class="comps-btn">Comps</button>
      <button type="button" data-action="hold" data-index="${i}">Hold</button>
      <button type="button" data-action="deleteInventory" data-index="${i}" class="delete-btn">Delete</button>
    </div></td>
  </tr>`;
};

document.addEventListener("click",function(e){
  const btn=e.target.closest&&e.target.closest("[data-action]");
  if(!btn)return;
  if(btn.dataset.action==="deleteInventory"){
    e.preventDefault();
    e.stopPropagation();
    deleteInventoryItem(btn.dataset.index);
  }
},true);

function openCommand(){
  renderCommand("");
  $("#command").classList.add("open");
  const input=$("#commandInput");
  if(input){
    input.value="";
    input.style.display="block";
    setTimeout(()=>input.focus(),40);
  }
}

function renderCommand(q){
  q=(q||"").toLowerCase().trim();
  const items=[
    ...active().map((r,i)=>({icon:"◇",label:title(r),sub:"Inventory",page:"inventory",query:title(r)})),
    ...sold().map(r=>({icon:"$",label:title(r),sub:"Sold",page:"sold",query:title(r)})),
    ...holds().map(r=>({icon:"✓",label:title(r),sub:"Hold",page:"holds",query:title(r)}))
  ].filter(x=>!q||(x.label+" "+x.sub).toLowerCase().includes(q)).slice(0,60);
  $("#commandResults").innerHTML=items.map((x,idx)=>`<div class="cmd-row" data-cmd-index="${idx}"><span>${x.icon}</span><div>${esc(x.label)}<small>${x.sub}</small></div><span>↵</span></div>`).join("");
  window.__cmdItems=items;
}

$("#commandInput")?.addEventListener("input",e=>renderCommand(e.target.value));
$("#openCommand")?.addEventListener("click",e=>{e.preventDefault();openCommand();},true);

document.addEventListener("keydown",function(e){
  if((e.metaKey||e.ctrlKey)&&String(e.key).toLowerCase()==="k"){
    e.preventDefault();
    openCommand();
  }
  if(e.key==="Escape"){
    $("#command")?.classList.remove("open");
  }
},true);

function setupBookmarklet(){
  const code=getBookmarkletCode();
  const link=$("#bookmarkletLink");
  if(link) link.href=code;
  if($("#bookmarkletCode")) $("#bookmarkletCode").value=code;
}

$("#quickExportBtn")?.addEventListener("click",e=>{
  e.preventDefault();
  $("#exportBackup")?.click();
});
$("#quickSettingsBtn")?.addEventListener("click",e=>{
  e.preventDefault();
  showPage("settings");
});

const oldRenderV213=render;
render=function(){
  oldRenderV213();
  setupBookmarklet();
};
setTimeout(setupBookmarklet,500);


/* ===== v215: login text cleanup + spend recommendation ===== */
function updateSpendRecommendation(){
  const now=new Date();
  const monthRows=sold().filter(r=>{
    const d=dateOf(r);
    return d && d.getFullYear()===now.getFullYear() && d.getMonth()===now.getMonth();
  });
  const monthSales=monthRows.reduce((x,r)=>x+price(r),0);
  const monthProfit=monthRows.reduce((x,r)=>x+profit(r),0);

  // Simple reseller cash rule: reinvest about 50% of gross sales, set aside 20% of profit.
  const inventorySpend=monthSales * 0.50;
  const setAside=Math.max(0,monthProfit * 0.20);

  if($("#spendRecommend")) $("#spendRecommend").textContent=money(inventorySpend,0);
  if($("#spendRecommendText")) $("#spendRecommendText").textContent=`inventory · keep ${money(setAside,0)} aside`;
}

function showLogin(){
  const screen=$("#loginScreen"); if(!screen)return;
  const setup=!hasPass();
  $("#loginSub").textContent="";
  $("#loginLabel").textContent=setup?"Create passcode":"Enter passcode";
  $("#loginSubmit").textContent=setup?"Create passcode":"Unlock";
  $("#resetPassBtn").style.display=setup?"none":"inline-block";
  $("#loginMessage").textContent="";
  document.body.classList.add("locked");
  screen.classList.add("show");
  setTimeout(()=>$("#loginPass")?.focus(),80);
}

const oldRenderV215=render;
render=function(){
  oldRenderV215();
  updateSpendRecommendation();
};


/* ===== v216: sold fix + compact action icons + monthly spend progress ===== */
function updateSpendRecommendation(){
  const now=new Date();
  const monthRows=sold().filter(r=>{
    const d=dateOf(r);
    return d && d.getFullYear()===now.getFullYear() && d.getMonth()===now.getMonth();
  });
  const monthSales=monthRows.reduce((x,r)=>x+price(r),0);
  const monthProfit=monthRows.reduce((x,r)=>x+profit(r),0);

  const inventoryPct=50;
  const asidePct=20;
  const inventorySpend=monthSales * (inventoryPct/100);
  const setAside=Math.max(0,monthProfit * (asidePct/100));

  const year=now.getFullYear(), month=now.getMonth();
  const daysInMonth=new Date(year,month+1,0).getDate();
  const monthPct=Math.min(100,Math.round((now.getDate()/daysInMonth)*100));

  if($("#spendRecommend")) $("#spendRecommend").textContent=money(inventorySpend,0);
  if($("#spendRecommendText")) $("#spendRecommendText").textContent=`inventory · keep ${money(setAside,0)} aside`;
  if($("#monthProgressPct")) $("#monthProgressPct").textContent=monthPct+"%";
  if($("#monthProgressBar")) $("#monthProgressBar").style.width=monthPct+"%";
  if($("#inventorySplitPct")) $("#inventorySplitPct").textContent=inventoryPct+"%";
  if($("#asideSplitPct")) $("#asideSplitPct").textContent=asidePct+"%";
  if($("#inventorySplitBar")) $("#inventorySplitBar").style.width=inventoryPct+"%";
  if($("#asideSplitBar")) $("#asideSplitBar").style.width=asidePct+"%";
}

invRow=function(r,i){
  const p=price(r),c=cost(r),pr=p-c,m=p?Math.round(pr/p*100):0;
  return `<tr>
    <td><div class="item-cell"><div class="thumb"></div><div>${esc(title(r))}<small>${esc(platform(r))}</small></div></div></td>
    <td>${money(p)}</td>
    <td>${money(c)}</td>
    <td class="${pr>=0?"profit":"loss"}">${pr>=0?"+":""}${money(pr)}</td>
    <td class="margin">${m}%</td>
    <td>${fmt(dateOf(r))}</td>
    <td class="status">Active</td>
    <td><div class="row-actions">
      <button type="button" data-action="edit" data-index="${i}" class="icon-action" title="Edit">✎</button>
      <button type="button" data-action="sold" data-index="${i}" class="icon-action" title="Move to sold">$</button>
      <button type="button" data-action="comps" data-index="${i}" class="icon-action comps-btn" title="eBay sold comps">↗</button>
      <button type="button" data-action="hold" data-index="${i}" class="icon-action" title="Move to holds">◇</button>
      <button type="button" data-action="deleteInventory" data-index="${i}" class="icon-action delete-btn" title="Delete">×</button>
    </div></td>
  </tr>`;
};

function handleInventoryAction(action,index){
  index=Number(index);
  if(action==="edit"){editItem(index);return true;}
  if(action==="sold"){openSoldModal(index);return true;}
  if(action==="comps"){openComps(index);return true;}
  if(action==="hold"){moveToHold(index);return true;}
  if(action==="deleteInventory"){deleteInventoryItem(index);return true;}
  return false;
}

document.addEventListener("click",function(e){
  const btn=e.target.closest&&e.target.closest("[data-action]");
  if(!btn)return;
  if(handleInventoryAction(btn.dataset.action,btn.dataset.index)){
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
  }
},true);

const oldRenderV216=render;
render=function(){
  oldRenderV216();
  updateSpendRecommendation();
};
