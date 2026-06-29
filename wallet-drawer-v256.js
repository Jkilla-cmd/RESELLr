
(function(){
  function qs(s){return document.querySelector(s)}
  function money(v){return "$"+(Number(v)||0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}
  function read(k,d){try{return JSON.parse(localStorage.getItem(k)||d)}catch(e){return JSON.parse(d)}}
  const svg=`<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7.5h13.8c1.2 0 2.2 1 2.2 2.2v7.1c0 1.2-1 2.2-2.2 2.2H4.8C3.8 19 3 18.2 3 17.2V6.8C3 5.8 3.8 5 4.8 5h11.7"/><path d="M18 11.5h2.5v4H18c-1.1 0-2-.9-2-2s.9-2 2-2Z"/><path d="M6 8h10"/></svg>`;
  function mode(){return typeof walletMode==="function"?walletMode():{inventoryPct:50,asidePct:50}}
  function ensure(){
    if(qs("#walletBarButtonV256"))return;
    const btn=document.createElement("button");btn.id="walletBarButtonV256";btn.className="wallet-bar-button-v256";btn.type="button";
    btn.innerHTML=`<span class="wallet-bar-icon-v256">${svg}</span><span class="wallet-bar-copy-v256"><b>Wallet</b><span>Tap to view</span></span>`;
    const panel=document.createElement("section");panel.id="walletDrawerPanelV256";panel.className="wallet-drawer-panel-v256";
    panel.innerHTML=`<div><div class="wallet-head-v256"><div class="wallet-title-v256"><span class="wallet-mini-v256">${svg}</span><h3>Reinvestment Wallet</h3></div><button class="wallet-close-v256" id="walletCloseV256">⌄</button></div><div class="wallet-metrics-v256"><div class="wallet-metric-v256"><span>Wallet Balance</span><b id="wBal256">$0.00</b><small>Available to reinvest</small></div><div class="wallet-metric-v256"><span>Buying Power</span><b id="wBuy256">$0.00</b><small>Available to spend</small></div><div class="wallet-metric-v256"><span>Reserved Profit</span><b id="wRes256">$0.00</b><small>Set aside for you</small></div></div><div class="wallet-activity-v256"><h4>Recent Wallet Activity</h4><div id="wAct256"></div></div></div><div class="wallet-side-v256"><div class="wallet-summary-v256"><h4>Wallet Summary</h4><div class="wallet-line-v256"><span>Total Sales Profit</span><b id="wProf256">$0.00</b></div><div class="wallet-line-v256"><span>Reinvestment Rate</span><b id="wRate256">50%</b></div><div class="wallet-line-v256"><span>Total Reinvested</span><b id="wRein256">$0.00</b></div><div class="wallet-line-v256"><span>Total Reserved</span><b id="wResTot256">$0.00</b></div></div><div class="wallet-rate-v256"><h4>Reinvestment Rate</h4><b id="wRateBig256">50%</b><div class="wallet-rate-bar-v256"><i id="wRateBar256"></i></div><small id="wRateCopy256">50% of cost + profit goes to wallet</small></div></div>`;
    document.body.appendChild(panel);document.body.appendChild(btn);
    function tog(){panel.classList.toggle("open");btn.classList.toggle("is-open",panel.classList.contains("open"));renderWallet256()}
    btn.addEventListener("click",tog);qs("#walletCloseV256").addEventListener("click",tog)
  }
  function renderWallet256(){
    ensure();
    const w=read("resellr_wallet","{}"), rows=read("resellr_wallet_ledger","[]"), m=mode(), bal=Number(w.balance)||0;
    const dep=rows.filter(x=>x.type==="deposit"||Number(x.amount)>0).reduce((a,x)=>a+Number(x.amount||0),0);
    let soldProfit=0;try{soldProfit=sold().reduce((a,r)=>a+profit(r),0)}catch(e){}
    const reserved=Math.max(0,soldProfit-dep);
    qs("#wBal256").textContent=money(bal);qs("#wBuy256").textContent=money(Math.max(0,bal));qs("#wRes256").textContent=money(reserved);
    qs("#wProf256").textContent=money(soldProfit);qs("#wRate256").textContent=m.inventoryPct+"%";qs("#wRateBig256").textContent=m.inventoryPct+"%";
    qs("#wRein256").textContent=money(dep);qs("#wResTot256").textContent=money(reserved);qs("#wRateBar256").style.width=Math.max(0,Math.min(100,m.inventoryPct))+"%";qs("#wRateCopy256").textContent=m.inventoryPct+"% of cost + profit goes to wallet";
    const recent=rows.slice(0,4), act=qs("#wAct256");
    act.innerHTML=recent.length?recent.map(x=>{const amt=Number(x.amount)||0,cls=amt>=0?"pos":"neg",d=x.date?new Date(x.date):null,date=d&&!isNaN(d)?d.toLocaleDateString(undefined,{month:"short",day:"numeric"}):"";return `<div class="wallet-row-v256"><span class="${cls}">${amt>=0?"+ ":"- "}${money(Math.abs(amt))}</span><span>${x.label||(amt>=0?"Reinvested from sale":"Purchased inventory")}</span><span>${date}</span></div>`}).join(""):`<div class="wallet-row-v256"><span class="pos">$0.00</span><span>No wallet activity yet</span><span></span></div>`;
  }
  const old=window.render;window.render=function(){old();ensure();renderWallet256()};
  setTimeout(()=>{ensure();renderWallet256()},400);setTimeout(()=>{ensure();renderWallet256()},1200)
})();
