
(function(){
  function moneyFmt(v){
    try{return money(Number(v)||0,2)}catch(e){return "$"+(Number(v)||0).toFixed(2)}
  }
  function walletReadSafe(){try{return JSON.parse(localStorage.getItem("resellr_wallet")||"{}")||{}}catch(e){return{}}}
  function walletLedgerSafe(){try{return JSON.parse(localStorage.getItem("resellr_wallet_ledger")||"[]")||[]}catch(e){return[]}}
  function walletModeSafe(){
    const key=localStorage.getItem("resellr_reinvest_mode")||"balanced";
    const modes={conservative:{label:"Conservative 40/60"},balanced:{label:"Balanced 50/50"},growth:{label:"Growth 70/30"}};
    return modes[key]||modes.balanced;
  }
  function createWalletDock(){
    if(document.getElementById("walletDockV254")) return;
    const dock=document.createElement("div");
    dock.id="walletDockV254";
    dock.innerHTML=`
      <div id="walletDockPulseV254"></div>
      <button type="button" id="walletDockButtonV254" title="Reinvestment Wallet" aria-label="Reinvestment Wallet">
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M4.5 7.5h13.2c1.5 0 2.8 1.2 2.8 2.8v6.2c0 1.5-1.2 2.8-2.8 2.8H4.5c-1.7 0-3-1.3-3-3v-9c0-1.7 1.3-3 3-3h11.8" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>
          <path d="M15.8 13.4h4.4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>
          <path d="M6.7 4.4 16.6 2l1.1 4.4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>
          <circle cx="16.4" cy="13.4" r=".8" fill="currentColor"/>
        </svg>
      </button>
      <section id="walletDockPanelV254">
        <div class="wallet-dock-head-v254"><h3>Reinvestment Wallet</h3><span class="wallet-dock-mode-v254" id="walletDockModeV254">Balanced 50/50</span></div>
        <div class="wallet-dock-main-v254">
          <div class="wallet-balance-v254"><span>Available to Reinvest</span><b id="walletDockBalanceV254">$0.00</b></div>
          <div class="wallet-mini-grid-v254">
            <div class="wallet-mini-v254"><span>Today's Deposit</span><b id="walletDockTodayV254">$0.00</b></div>
            <div class="wallet-mini-v254"><span>This Month Spent</span><b id="walletDockSpentV254">$0.00</b></div>
            <div class="wallet-mini-v254"><span>Buying Power</span><b id="walletDockPowerV254">$0.00</b></div>
          </div>
          <div class="wallet-flow-v254"><span>Sales</span><i></i><span>Wallet</span><i></i><span>Inventory</span><i></i><span>Profit</span></div>
        </div>
        <div class="wallet-dock-actions-v254"><button type="button" id="walletDockSetupV254">Setup</button><button type="button" id="walletDockCloseV254">Close</button></div>
      </section>`;
    document.body.appendChild(dock);
    document.getElementById("walletDockButtonV254").addEventListener("click",()=>{dock.classList.toggle("open");updateWalletDock()});
    document.getElementById("walletDockCloseV254").addEventListener("click",()=>dock.classList.remove("open"));
    document.getElementById("walletDockSetupV254").addEventListener("click",()=>{dock.classList.remove("open");try{showPage("settings")}catch(e){};setTimeout(()=>document.getElementById("walletInitialBalance")?.focus(),120)});
  }
  function updateWalletDock(){
    const w=walletReadSafe(), ledger=walletLedgerSafe(), bal=Number(w.balance)||0, now=new Date(), today=now.toDateString();
    const todaysDeposit=ledger.filter(x=>x.type==="deposit"&&new Date(x.date).toDateString()===today).reduce((a,x)=>a+Number(x.amount||0),0);
    const monthSpent=Math.abs(ledger.filter(x=>x.type==="spend"&&new Date(x.date).getFullYear()===now.getFullYear()&&new Date(x.date).getMonth()===now.getMonth()).reduce((a,x)=>a+Number(x.amount||0),0));
    const buyingPower=Math.max(0,bal*.35), mode=walletModeSafe();
    const set=(id,val)=>{const el=document.getElementById(id); if(el) el.textContent=val};
    set("walletDockBalanceV254",moneyFmt(bal)); set("walletDockTodayV254",moneyFmt(todaysDeposit)); set("walletDockSpentV254",moneyFmt(monthSpent)); set("walletDockPowerV254",moneyFmt(buyingPower)); set("walletDockModeV254",mode.label);
  }
  function hideDashboardWallet(){document.querySelectorAll("#reinvestWalletCard,.reinvest-wallet-card").forEach(el=>el.style.setProperty("display","none","important"))}
  const oldRender=window.render;
  if(typeof oldRender==="function"){window.render=function(){oldRender();createWalletDock();hideDashboardWallet();updateWalletDock()}}
  function boot(){createWalletDock();hideDashboardWallet();updateWalletDock()}
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",boot); else boot();
  setTimeout(boot,300); setTimeout(boot,1000);
})();
