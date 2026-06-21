
/* ===== v231 rescue script: runs even if app.js crashed ===== */
(function(){
  const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const money=(v,d=2)=>{try{return new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:d}).format(Number(v)||0)}catch(e){return "$"+(Number(v)||0).toFixed(d)}};
  const n=v=>{const x=Number(String(v??"").replace(/[^0-9.-]/g,""));return Number.isFinite(x)?x:0};
  const read=k=>{try{return JSON.parse(localStorage.getItem(k)||"[]")||[]}catch(e){return[]}};
  const write=(k,v)=>localStorage.setItem(k,JSON.stringify(v||[]));
  const active=()=>read("activeInventory").length?read("activeInventory"):read("inventory");
  const sold=()=>read("soldInventory").length?read("soldInventory"):read("sold");
  const holds=()=>read("inventoryHolds").length?read("inventoryHolds"):read("holds");
  const setActive=v=>{write("activeInventory",v);write("inventory",v)};
  const setSold=v=>{write("soldInventory",v);write("sold",v)};
  const setHolds=v=>{write("inventoryHolds",v);write("holds",v)};
  const val=(r,ks)=>{for(const k of ks){if(r&&r[k]!=null&&String(r[k]).trim()!=="")return n(r[k])}return 0};
  const title=r=>String(r?.title||r?.name||r?.item||r?.description||"Untitled item").trim();
  const platform=r=>String(r?.platform||r?.marketplace||r?.source||"Mercari").trim();
  const cost=r=>val(r,["cost","Cost","itemCost","cogs","purchasePrice"]);
  const price=r=>val(r,["price","list","listPrice","salePrice","soldPrice","sale","amount","total"]);
  const fees=r=>val(r,["fees","fee","platformFees"]);
  const ship=r=>val(r,["shipping","ship","shippingCost","labelCost"]);
  const profit=r=>{for(const k of["profit","netProfit","totalProfit","net"]){if(r&&r[k]!=null&&String(r[k]).trim()!=="")return n(r[k])}return price(r)-cost(r)-fees(r)-ship(r)};
  const dateOf=r=>{const raw=r?.soldDate||r?.date||r?.Date||r?.saleDate||r?.addedAt||r?.createdAt||"";const d=new Date(raw);return isNaN(d)?null:d};
  const fmt=d=>d?d.toLocaleDateString("en-US",{month:"short",day:"numeric",year:"2-digit"}):"—";
  const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

  function passHash(v){let h=2166136261;const s=String(v||"");for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return (h>>>0).toString(16)}
  function ensureLogin(){
    if($("#loginScreen")) return;
    const div=document.createElement("div");
    div.id="loginScreen"; div.className="login-screen";
    div.innerHTML=`<div class="login-card"><div class="login-logo-wrap"><img src="assets/branding/login-logo.svg" alt="RESELLr" class="login-logo" onerror="this.style.display='none'"></div><form id="loginForm"><label id="loginLabel">Create passcode</label><input id="loginPass" type="password" maxlength="24" required><button class="login-submit" id="loginSubmit">Create passcode</button><button type="button" class="login-link" id="resetPassBtn">Reset passcode</button><div class="login-message" id="loginMessage"></div></form></div>`;
    document.body.prepend(div);
  }
  function showLogin(){
    ensureLogin();
    const setup=!localStorage.getItem("resellr_pass_hash");
    $("#loginLabel").textContent=setup?"Create passcode":"Enter passcode";
    $("#loginSubmit").textContent=setup?"Create passcode":"Unlock";
    $("#resetPassBtn").style.display=setup?"none":"inline-block";
    $("#loginMessage").textContent="";
    document.body.classList.add("rs-locked");
    $("#loginScreen").classList.add("show");
    setTimeout(()=>$("#loginPass")?.focus(),50);
  }
  function hideLogin(){
    document.body.classList.remove("rs-locked","locked");
    $("#loginScreen")?.classList.remove("show");
  }
  function bindLogin(){
    ensureLogin();
    const form=$("#loginForm");
    if(!form||form.dataset.rescueBound)return;
    form.dataset.rescueBound="1";
    form.addEventListener("submit",e=>{
      e.preventDefault();
      const v=($("#loginPass")?.value||"").trim();
      if(v.length<3){$("#loginMessage").textContent="Use at least 3 characters.";return}
      const hash=localStorage.getItem("resellr_pass_hash");
      if(!hash){
        localStorage.setItem("resellr_pass_hash",passHash(v));
        sessionStorage.setItem("resellr_unlocked","1");
        $("#loginPass").value="";
        hideLogin(); safeRender();
        return;
      }
      if(passHash(v)===hash){
        sessionStorage.setItem("resellr_unlocked","1");
        $("#loginPass").value="";
        hideLogin(); safeRender();
      }else $("#loginMessage").textContent="Wrong passcode.";
    });
    $("#resetPassBtn")?.addEventListener("click",()=>{
      if(confirm("Reset passcode on this device?")){
        localStorage.removeItem("resellr_pass_hash");
        sessionStorage.removeItem("resellr_unlocked");
        showLogin();
      }
    });
  }

  function showPage(id){
    $$(".page").forEach(p=>p.classList.toggle("active",p.id===id));
    $$("[data-page]").forEach(b=>b.classList.toggle("active",b.dataset.page===id));
    $("#menu")?.classList.remove("open");
    safeRender();
  }
  window.showPage=showPage;

  function bindMenu(){
    document.addEventListener("click",e=>{
      const page=e.target.closest&&e.target.closest("[data-page]");
      if(page){
        e.preventDefault(); e.stopPropagation();
        showPage(page.dataset.page);
        return;
      }
      if(e.target.closest&&e.target.closest("#openMenu")){
        e.preventDefault(); $("#menu")?.classList.toggle("open");
      }
    },true);
  }

  function removeGif(){
    localStorage.removeItem("resellr_dashboard_gif");
    $$("#dashboardGifCard,.dashboard-gif-card,#dashboardGifPreview,.dashboard-gif-preview,.dashboard-gif-controls").forEach(el=>el.remove());
  }

  function getSoldFilteredRows(){
    const rows=sold().slice().sort((a,b)=>(dateOf(b)||0)-(dateOf(a)||0));
    const q=($("#soldSearch")?.value||"").toLowerCase();
    return rows.filter(r=>!q||JSON.stringify(r).toLowerCase().includes(q));
  }
  function updateSoldKpis(rows){
    if(!$("#soldTotal"))return;
    const revenue=rows.reduce((x,r)=>x+price(r),0), prof=rows.reduce((x,r)=>x+profit(r),0);
    $("#soldTotal").textContent=rows.length;
    $("#soldRevenue").textContent=money(revenue);
    $("#soldProfit").textContent=money(prof);
    $("#soldMargin").textContent=(revenue?Math.round(prof/revenue*100):0)+"%";
  }
  function renderSoldRows(){
    const base=sold();
    const rows=getSoldFilteredRows().map(r=>({r,i:base.indexOf(r)}));
    updateSoldKpis(rows.map(x=>x.r));
    const tbody=$("#soldRows");
    if(!tbody)return;
    tbody.innerHTML=rows.map(({r,i})=>{
      const p=price(r), pr=profit(r), m=p?Math.round(pr/p*100):0;
      return `<tr><td><div class="item-cell"><div class="thumb"></div><div>${esc(title(r))}<small>${esc(platform(r))}</small></div></div></td><td>${fmt(dateOf(r))}</td><td>${money(p)}</td><td>${money(cost(r))}</td><td class="${pr>=0?"profit":"loss"}">${money(pr)}</td><td class="margin">${m}%</td><td><div class="row-actions"><button type="button" data-sold-rescue="edit" data-index="${i}" class="icon-action" title="Edit sale">$</button><button type="button" data-sold-rescue="move" data-index="${i}" class="icon-action" title="Move back to inventory">▣</button><button type="button" data-sold-rescue="delete" data-index="${i}" class="icon-action delete-btn" title="Delete sold item">×</button></div></td></tr>`;
    }).join("");
  }
  function bindSoldActions(){
    document.addEventListener("click",e=>{
      const btn=e.target.closest&&e.target.closest("[data-sold-rescue]");
      if(!btn)return;
      e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
      const i=Number(btn.dataset.index), rows=sold(), item=rows[i];
      if(!item)return;
      const action=btn.dataset.soldRescue;
      if(action==="edit"){
        const p=prompt(`Edit sold price for "${title(item)}"`, String(price(item)||""));
        if(p===null)return;
        item.price=n(p); item.salePrice=n(p); item.soldPrice=n(p); item.profit=item.price-cost(item)-fees(item)-ship(item);
        setSold(rows); safeRender(); return;
      }
      if(action==="move"){
        const a=active(); a.unshift({...item,status:"active",addedAt:new Date().toISOString()});
        rows.splice(i,1); setSold(rows); setActive(a); safeRender(); showPage("inventory"); return;
      }
      if(action==="delete"){
        if(confirm(`Delete "${title(item)}" from Sold Items?`)){rows.splice(i,1); setSold(rows); safeRender();}
      }
    },true);
  }

  function safeRender(){
    try{ if(typeof window.render==="function" && !window.__rescueRendering){ window.__rescueRendering=true; window.render(); window.__rescueRendering=false; } }catch(e){window.__rescueRendering=false; console.error(e);}
    removeGif();
    renderSoldRows();
  }

  function boot(){
    bindLogin(); bindMenu(); bindSoldActions(); removeGif();
    if(sessionStorage.getItem("resellr_unlocked")==="1") hideLogin(); else showLogin();
    if(!$(".page.active")) showPage("dashboard");
    safeRender();
  }
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",boot); else boot();
  setTimeout(boot,500);
})();
