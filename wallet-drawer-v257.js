
(function(){
  function qs(s){return document.querySelector(s)}
  function money(v){return "$"+(Number(v)||0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}
  function read(k,d){try{return JSON.parse(localStorage.getItem(k)||d)}catch(e){return JSON.parse(d)}}
  const svg=`<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7.5h13.8c1.2 0 2.2 1 2.2 2.2v7.1c0 1.2-1 2.2-2.2 2.2H4.8C3.8 19 3 18.2 3 17.2V6.8C3 5.8 3.8 5 4.8 5h11.7"/><path d="M18 11.5h2.5v4H18c-1.1 0-2-.9-2-2s.9-2 2-2Z"/><path d="M6 8h10"/></svg>`;
  function mode(){return typeof walletMode==="function"?walletMode():{inventoryPct:50,asidePct:50}}
  function ensure(){
    if(qs("#walletHotspotV257"))return;
    const glow=document.createElement("div");glow.className="wallet-corner-glow-v257";
    const hot=document.createElement("div");hot.id="walletHotspotV257";hot.className="wallet-corner-hotspot-v257";
    const btn=document.createElement("button");btn.id="walletRevealV257";btn.className="wallet-reveal-v257";btn.type="button";
    btn.innerHTML=`<span class="wallet-icon-shell-v257">${svg}</span><span class="wallet-copy-v257"><b>Wallet</b><span>Tap to view</span></span>`;
    hot.appendChild(btn);
    const panel=document.createElement("section");panel.id="walletDrawerPanelV257";panel.className="wallet-drawer-panel-v257";
    panel.innerHTML=`<div><div class="wallet-head-v257"><div class="wallet-title-v257"><span class="wallet-mini-v257">${svg}</span><h3>Reinvestment Wallet</h3></div><button class="wallet-close-v257" id="walletCloseV257">⌄</button></div><div class="wallet-metrics-v257"><div class="wallet-metric-v257"><span>Wallet Balance</span><b id="wBal257">$0.00</b><small>Available to reinvest</small></div><div class="wallet-metric-v257"><span>Buying Power</span><b id="wBuy257">$0.00</b><small>Available to spend</small></div><div class="wallet-metric-v257"><span>Reserved Profit</span><b id="wRes257">$0.00</b><small>Set aside for you</small></div></div><div class="wallet-activity-v257"><h4>Recent Wallet Activity</h4><div id="wAct257"></div></div></div><div class="wallet-side-v257"><div class="wallet-summary-v257"><h4>Wallet Summary</h4><div class="wallet-line-v257"><span>Total Sales Profit</span><b id="wProf257">$0.00</b></div><div class="wallet-line-v257"><span>Reinvestment Rate</span><b id="wRate257">50%</b></div><div class="wallet-line-v257"><span>Total Reinvested</span><b id="wRein257">$0.00</b></div><div class="wallet-line-v257"><span>Total Reserved</span><b id="wResTot257">$0.00</b></div></div><div class="wallet-rate-v257"><h4>Reinvestment Rate</h4><b id="wRateBig257">50%</b><div class="wallet-rate-bar-v257"><i id="wRateBar257"></i></div><small id="wRateCopy257">50% of cost + profit goes to wallet</small></div></div>`;
    document.body.appendChild(glow);document.body.appendChild(panel);document.body.appendChild(hot);
    function tog(){panel.classList.toggle("open");btn.classList.toggle("is-open",panel.classList.contains("open"));renderWallet257()}
    btn.addEventListener("click",tog);qs("#walletCloseV257").addEventListener("click",tog)
  }
  function renderWallet257(){
    ensure();
    const w=read("resellr_wallet","{}"), rows=read("resellr_wallet_ledger","[]"), m=mode(), bal=Number(w.balance)||0;
    const dep=rows.filter(x=>x.type==="deposit"||Number(x.amount)>0).reduce((a,x)=>a+Number(x.amount||0),0);
    let soldProfit=0;try{soldProfit=sold().reduce((a,r)=>a+profit(r),0)}catch(e){}
    const reserved=Math.max(0,soldProfit-dep);
    qs("#wBal257").textContent=money(bal);qs("#wBuy257").textContent=money(Math.max(0,bal));qs("#wRes257").textContent=money(reserved);
    qs("#wProf257").textContent=money(soldProfit);qs("#wRate257").textContent=m.inventoryPct+"%";qs("#wRateBig257").textContent=m.inventoryPct+"%";
    qs("#wRein257").textContent=money(dep);qs("#wResTot257").textContent=money(reserved);qs("#wRateBar257").style.width=Math.max(0,Math.min(100,m.inventoryPct))+"%";qs("#wRateCopy257").textContent=m.inventoryPct+"% of cost + profit goes to wallet";
    const recent=rows.slice(0,4), act=qs("#wAct257");
    act.innerHTML=recent.length?recent.map(x=>{const amt=Number(x.amount)||0,cls=amt>=0?"pos":"neg",d=x.date?new Date(x.date):null,date=d&&!isNaN(d)?d.toLocaleDateString(undefined,{month:"short",day:"numeric"}):"";return `<div class="wallet-row-v257"><span class="${cls}">${amt>=0?"+ ":"- "}${money(Math.abs(amt))}</span><span>${x.label||(amt>=0?"Reinvested from sale":"Purchased inventory")}</span><span>${date}</span></div>`}).join(""):`<div class="wallet-row-v257"><span class="pos">$0.00</span><span>No wallet activity yet</span><span></span></div>`;
  }
  const old=window.render;window.render=function(){old();ensure();renderWallet257()};
  setTimeout(()=>{ensure();renderWallet257()},400);setTimeout(()=>{ensure();renderWallet257()},1200)
})();
