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

