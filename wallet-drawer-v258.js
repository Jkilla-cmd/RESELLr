
(function(){
  function qs(s){return document.querySelector(s)}
  function money(v){return "$"+(Number(v)||0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}
  function read(k,d){try{return JSON.parse(localStorage.getItem(k)||d)}catch(e){return JSON.parse(d)}}
  const svg=`<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7.5h13.8c1.2 0 2.2 1 2.2 2.2v7.1c0 1.2-1 2.2-2.2 2.2H4.8C3.8 19 3 18.2 3 17.2V6.8C3 5.8 3.8 5 4.8 5h11.7"/><path d="M18 11.5h2.5v4H18c-1.1 0-2-.9-2-2s.9-2 2-2Z"/><path d="M6 8h10"/></svg>`;
  function mode(){return typeof walletMode==="function"?walletMode():{inventoryPct:50,asidePct:50}}
  function ensure(){
    if(qs("#walletHotspotV258"))return;
    const glow=document.createElement("div");glow.className="wallet-corner-light-v258";
    const hot=document.createElement("div");hot.id="walletHotspotV258";hot.className="wallet-glow-hotspot-v258";
    const btn=document.createElement("button");btn.id="walletRevealV258";btn.className="wallet-icon-reveal-v258";btn.type="button";btn.innerHTML=svg;
    hot.appendChild(btn);
    const panel=document.createElement("section");panel.id="walletDrawerPanelV258";panel.className="wallet-drawer-panel-v258";
    panel.innerHTML=`<div><div class="wallet-head-v258"><div class="wallet-title-v258"><span class="wallet-mini-v258">${svg}</span><h3>Reinvestment Wallet</h3></div><button class="wallet-close-v258" id="walletCloseV258">⌄</button></div><div class="wallet-metrics-v258"><div class="wallet-metric-v258"><span>Wallet Balance</span><b id="wBal258">$0.00</b><small>Available to reinvest</small></div><div class="wallet-metric-v258"><span>Buying Power</span><b id="wBuy258">$0.00</b><small>Available to spend</small></div><div class="wallet-metric-v258"><span>Reserved Profit</span><b id="wRes258">$0.00</b><small>Set aside for you</small></div></div><div class="wallet-activity-v258"><h4>Recent Wallet Activity</h4><div id="wAct258"></div></div></div><div class="wallet-side-v258"><div class="wallet-summary-v258"><h4>Wallet Summary</h4><div class="wallet-line-v258"><span>Total Sales Profit</span><b id="wProf258">$0.00</b></div><div class="wallet-line-v258"><span>Reinvestment Rate</span><b id="wRate258">50%</b></div><div class="wallet-line-v258"><span>Total Reinvested</span><b id="wRein258">$0.00</b></div><div class="wallet-line-v258"><span>Total Reserved</span><b id="wResTot258">$0.00</b></div></div><div class="wallet-rate-v258"><h4>Reinvestment Rate</h4><b id="wRateBig258">50%</b><div class="wallet-rate-bar-v258"><i id="wRateBar258"></i></div><small id="wRateCopy258">50% of cost + profit goes to wallet</small></div></div>`;
    document.body.appendChild(glow);document.body.appendChild(panel);document.body.appendChild(hot);
    function tog(){panel.classList.toggle("open");btn.classList.toggle("is-open",panel.classList.contains("open"));renderWallet258()}
    btn.addEventListener("click",tog);qs("#walletCloseV258").addEventListener("click",tog)
  }
  function renderWallet258(){
    ensure();
    const w=read("resellr_wallet","{}"), rows=read("resellr_wallet_ledger","[]"), m=mode(), bal=Number(w.balance)||0;
    const dep=rows.filter(x=>x.type==="deposit"||Number(x.amount)>0).reduce((a,x)=>a+Number(x.amount||0),0);
    let soldProfit=0;try{soldProfit=sold().reduce((a,r)=>a+profit(r),0)}catch(e){}
    const reserved=Math.max(0,soldProfit-dep);
    qs("#wBal258").textContent=money(bal);qs("#wBuy258").textContent=money(Math.max(0,bal));qs("#wRes258").textContent=money(reserved);
    qs("#wProf258").textContent=money(soldProfit);qs("#wRate258").textContent=m.inventoryPct+"%";qs("#wRateBig258").textContent=m.inventoryPct+"%";
    qs("#wRein258").textContent=money(dep);qs("#wResTot258").textContent=money(reserved);qs("#wRateBar258").style.width=Math.max(0,Math.min(100,m.inventoryPct))+"%";qs("#wRateCopy258").textContent=m.inventoryPct+"% of cost + profit goes to wallet";
    const recent=rows.slice(0,4), act=qs("#wAct258");
    act.innerHTML=recent.length?recent.map(x=>{const amt=Number(x.amount)||0,cls=amt>=0?"pos":"neg",d=x.date?new Date(x.date):null,date=d&&!isNaN(d)?d.toLocaleDateString(undefined,{month:"short",day:"numeric"}):"";return `<div class="wallet-row-v258"><span class="${cls}">${amt>=0?"+ ":"- "}${money(Math.abs(amt))}</span><span>${x.label||(amt>=0?"Reinvested from sale":"Purchased inventory")}</span><span>${date}</span></div>`}).join(""):`<div class="wallet-row-v258"><span class="pos">$0.00</span><span>No wallet activity yet</span><span></span></div>`;
  }
  const old=window.render;window.render=function(){old();ensure();renderWallet258()};
  setTimeout(()=>{ensure();renderWallet258()},400);setTimeout(()=>{ensure();renderWallet258()},1200)
})();
