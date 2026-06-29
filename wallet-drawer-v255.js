
/* v255 Reinvestment Wallet integrated bottom bar drawer */
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
    if(qs("#walletBarButtonV255") && qs("#walletDrawerPanelV255")) return;

    const fab = document.createElement("button");
    fab.id = "walletBarButtonV255";
    fab.className = "wallet-bar-button-v255";
    fab.type = "button";
    fab.innerHTML = `<span class="wallet-bar-icon-v255">▣</span><span class="wallet-bar-copy-v255"><b>Wallet</b><span>Tap to view</span></span>`;

    const drawer = document.createElement("section");
    drawer.id = "walletDrawerPanelV255";
    drawer.className = "wallet-drawer-panel-v255";
    drawer.innerHTML = `
      <div class="wallet-drawer-main-v255">
        <div class="wallet-drawer-head-v255">
          <div class="wallet-drawer-title-v255"><span class="mini-icon">▣</span><h3>Reinvestment Wallet</h3></div>
          <button type="button" class="wallet-close-v255" id="walletCloseV255">⌄</button>
        </div>
        <div class="wallet-metrics-v255">
          <div class="wallet-metric-v255"><span>Wallet Balance</span><b id="drawerWalletBalanceV255">$0.00</b><small>Available to reinvest</small></div>
          <div class="wallet-metric-v255"><span>Buying Power</span><b id="drawerBuyingPowerV255">$0.00</b><small>Available to spend</small></div>
          <div class="wallet-metric-v255"><span>Reserved Profit</span><b id="drawerReservedProfitV255">$0.00</b><small>Set aside for you</small></div>
        </div>
        <div class="wallet-activity-v255"><h4>Recent Wallet Activity</h4><div id="drawerWalletActivityV255"></div></div>
      </div>
      <div class="wallet-side-v255">
        <div class="wallet-summary-v255">
          <h4>Wallet Summary</h4>
          <div class="wallet-summary-line-v255"><span>Total Sales Profit</span><b id="drawerTotalProfitV255">$0.00</b></div>
          <div class="wallet-summary-line-v255"><span>Reinvestment Rate</span><b id="drawerRateTextV255">50%</b></div>
          <div class="wallet-summary-line-v255"><span>Total Reinvested</span><b id="drawerReinvestedV255">$0.00</b></div>
          <div class="wallet-summary-line-v255"><span>Total Reserved</span><b id="drawerReservedTotalV255">$0.00</b></div>
        </div>
        <div class="wallet-rate-v255"><h4>Reinvestment Rate</h4><b id="drawerRateBigV255">50%</b><div class="wallet-rate-bar-v255"><i id="drawerRateBarV255"></i></div><small id="drawerRateCopyV255">50% of cost + profit goes to wallet</small></div>
      </div>`;

    document.body.appendChild(drawer);
    document.body.appendChild(fab);

    function toggle(){
      drawer.classList.toggle("open");
      fab.classList.toggle("is-open", drawer.classList.contains("open"));
      renderWalletDrawerV255();
    }
    fab.addEventListener("click", toggle);
    qs("#walletCloseV255").addEventListener("click", toggle);
  }

  function renderWalletDrawerV255(){
    ensureWalletUi();
    const w = readWallet();
    const rows = ledger();
    const mode = walletModeLocal();
    const balance = Number(w.balance)||0;
    const totalDeposits = rows.filter(x=>x.type==="deposit" || Number(x.amount)>0).reduce((a,x)=>a+Number(x.amount||0),0);
    let soldProfit = 0;
    try{ soldProfit = sold().reduce((a,r)=>a+profit(r),0); }catch(e){}
    const reservedProfit = Math.max(0, soldProfit - totalDeposits);

    qs("#drawerWalletBalanceV255").textContent = fmtMoney(balance);
    qs("#drawerBuyingPowerV255").textContent = fmtMoney(Math.max(0,balance));
    qs("#drawerReservedProfitV255").textContent = fmtMoney(reservedProfit);
    qs("#drawerTotalProfitV255").textContent = fmtMoney(soldProfit);
    qs("#drawerRateTextV255").textContent = mode.inventoryPct + "%";
    qs("#drawerRateBigV255").textContent = mode.inventoryPct + "%";
    qs("#drawerReinvestedV255").textContent = fmtMoney(totalDeposits);
    qs("#drawerReservedTotalV255").textContent = fmtMoney(reservedProfit);
    qs("#drawerRateBarV255").style.width = Math.max(0, Math.min(100, mode.inventoryPct)) + "%";
    qs("#drawerRateCopyV255").textContent = mode.inventoryPct + "% of cost + profit goes to wallet";

    const activity = qs("#drawerWalletActivityV255");
    const recent = rows.slice(0,4);
    if(!recent.length){
      activity.innerHTML = `<div class="wallet-activity-row-v255"><span class="pos">$0.00</span><span>No wallet activity yet</span><span></span></div>`;
    }else{
      activity.innerHTML = recent.map(x=>{
        const amt = Number(x.amount)||0;
        const cls = amt >= 0 ? "pos" : "neg";
        const label = x.label || (amt >= 0 ? "Reinvested from sale" : "Purchased inventory");
        const d = x.date ? new Date(x.date) : null;
        const date = d && !isNaN(d) ? d.toLocaleDateString(undefined,{month:"short",day:"numeric"}) : "";
        return `<div class="wallet-activity-row-v255"><span class="${cls}">${amt>=0?"+ ":"- "}${fmtMoney(Math.abs(amt))}</span><span>${label}</span><span>${date}</span></div>`;
      }).join("");
    }
  }

  const oldRender = window.render;
  window.render = function(){
    oldRender();
    ensureWalletUi();
    renderWalletDrawerV255();
  };

  setTimeout(()=>{ensureWalletUi();renderWalletDrawerV255();},400);
  setTimeout(()=>{ensureWalletUi();renderWalletDrawerV255();},1200);
})();
