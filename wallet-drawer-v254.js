
/* v254 Reinvestment Wallet floating drawer */
(function(){
  function qs(s){ return document.querySelector(s); }
  function fmtMoney(v){
    const n = Number(v)||0;
    return "$" + n.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});
  }
  function readWallet(){
    try{return JSON.parse(localStorage.getItem("resellr_wallet")||"{}")||{}}catch(e){return{}}
  }
  function ledger(){
    try{return JSON.parse(localStorage.getItem("resellr_wallet_ledger")||"[]")||[]}catch(e){return[]}
  }
  function walletModeLocal(){
    if(typeof walletMode === "function") return walletMode();
    return {label:"Balanced 50/50",inventoryPct:50,asidePct:50};
  }
  function ensureWalletUi(){
    if(qs("#walletFabV254") && qs("#walletDrawerV254")) return;
    const fab = document.createElement("button");
    fab.id = "walletFabV254";
    fab.className = "wallet-fab-v254";
    fab.type = "button";
    fab.innerHTML = `<span class="wallet-fab-icon">▣</span><span class="wallet-fab-text"><b>Wallet</b><span>Tap to view</span></span>`;

    const drawer = document.createElement("section");
    drawer.id = "walletDrawerV254";
    drawer.className = "wallet-drawer-v254";
    drawer.innerHTML = `
      <div class="wallet-drawer-main-v254">
        <div class="wallet-drawer-head-v254">
          <div class="wallet-drawer-title-v254"><span class="mini-icon">▣</span><h3>Reinvestment Wallet</h3></div>
          <button type="button" class="wallet-close-v254" id="walletCloseV254">⌄</button>
        </div>
        <div class="wallet-metrics-v254">
          <div class="wallet-metric-v254"><span>Wallet Balance</span><b id="drawerWalletBalanceV254">$0.00</b><small>Available to reinvest</small></div>
          <div class="wallet-metric-v254"><span>Buying Power</span><b id="drawerBuyingPowerV254">$0.00</b><small>Available to spend</small></div>
          <div class="wallet-metric-v254"><span>Reserved Profit</span><b id="drawerReservedProfitV254">$0.00</b><small>Set aside for you</small></div>
        </div>
        <div class="wallet-activity-v254"><h4>Recent Wallet Activity</h4><div id="drawerWalletActivityV254"></div></div>
      </div>
      <div class="wallet-side-v254">
        <div class="wallet-summary-v254">
          <h4>Wallet Summary</h4>
          <div class="wallet-summary-line-v254"><span>Total Sales Profit</span><b id="drawerTotalProfitV254">$0.00</b></div>
          <div class="wallet-summary-line-v254"><span>Reinvestment Rate</span><b id="drawerRateTextV254">50%</b></div>
          <div class="wallet-summary-line-v254"><span>Total Reinvested</span><b id="drawerReinvestedV254">$0.00</b></div>
          <div class="wallet-summary-line-v254"><span>Total Reserved</span><b id="drawerReservedTotalV254">$0.00</b></div>
        </div>
        <div class="wallet-rate-v254"><h4>Reinvestment Rate</h4><b id="drawerRateBigV254">50%</b><div class="wallet-rate-bar-v254"><i id="drawerRateBarV254"></i></div><small id="drawerRateCopyV254">50% of cost + profit goes to wallet</small></div>
      </div>`;
    document.body.appendChild(drawer);
    document.body.appendChild(fab);
    function toggle(){
      drawer.classList.toggle("open");
      fab.classList.toggle("is-open", drawer.classList.contains("open"));
      renderWalletDrawer();
    }
    fab.addEventListener("click", toggle);
    qs("#walletCloseV254").addEventListener("click", toggle);
  }
  function renderWalletDrawer(){
    ensureWalletUi();
    const w = readWallet();
    const rows = ledger();
    const mode = walletModeLocal();
    const balance = Number(w.balance)||0;
    const totalDeposits = rows.filter(x=>x.type==="deposit" || Number(x.amount)>0).reduce((a,x)=>a+Number(x.amount||0),0);
    let soldProfit = 0;
    try{ soldProfit = sold().reduce((a,r)=>a+profit(r),0); }catch(e){}
    const reservedProfit = Math.max(0, soldProfit - totalDeposits);
    qs("#drawerWalletBalanceV254").textContent = fmtMoney(balance);
    qs("#drawerBuyingPowerV254").textContent = fmtMoney(Math.max(0,balance));
    qs("#drawerReservedProfitV254").textContent = fmtMoney(reservedProfit);
    qs("#drawerTotalProfitV254").textContent = fmtMoney(soldProfit);
    qs("#drawerRateTextV254").textContent = mode.inventoryPct + "%";
    qs("#drawerRateBigV254").textContent = mode.inventoryPct + "%";
    qs("#drawerReinvestedV254").textContent = fmtMoney(totalDeposits);
    qs("#drawerReservedTotalV254").textContent = fmtMoney(reservedProfit);
    qs("#drawerRateBarV254").style.width = Math.max(0, Math.min(100, mode.inventoryPct)) + "%";
    qs("#drawerRateCopyV254").textContent = mode.inventoryPct + "% of cost + profit goes to wallet";
    const activity = qs("#drawerWalletActivityV254");
    const recent = rows.slice(0,4);
    if(!recent.length){
      activity.innerHTML = `<div class="wallet-activity-row-v254"><span class="pos">$0.00</span><span>No wallet activity yet</span><span></span></div>`;
    }else{
      activity.innerHTML = recent.map(x=>{
        const amt = Number(x.amount)||0;
        const cls = amt >= 0 ? "pos" : "neg";
        const label = x.label || (amt >= 0 ? "Reinvested from sale" : "Purchased inventory");
        const d = x.date ? new Date(x.date) : null;
        const date = d && !isNaN(d) ? d.toLocaleDateString(undefined,{month:"short",day:"numeric"}) : "";
        return `<div class="wallet-activity-row-v254"><span class="${cls}">${amt>=0?"+ ":"- "}${fmtMoney(Math.abs(amt))}</span><span>${label}</span><span>${date}</span></div>`;
      }).join("");
    }
  }
  const oldRender = window.render;
  window.render = function(){
    oldRender();
    ensureWalletUi();
    renderWalletDrawer();
  };
  setTimeout(()=>{ensureWalletUi();renderWalletDrawer();},400);
  setTimeout(()=>{ensureWalletUi();renderWalletDrawer();},1200);
})();
