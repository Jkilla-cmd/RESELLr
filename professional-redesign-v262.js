
/* v262 Professional redesign helpers: theme toggle + optional pro dashboard polish */
(function(){
  const KEY="resellr_theme_v262";

  function money(v){
    const n=Number(v)||0;
    return "$"+n.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});
  }

  function modeData(){
    let inv=0,soldCount=0,invValue=0,costProfit=0,totalProfit=0,wallet=0;
    try{
      const a=active();
      inv=a.length;
      invValue=a.reduce((x,r)=>x+price(r),0);
      const s=sold();
      soldCount=s.length;
      totalProfit=s.reduce((x,r)=>x+profit(r),0);
      costProfit=s.reduce((x,r)=>x+cost(r)+profit(r),0);
    }catch(e){}
    try{
      wallet=Number((JSON.parse(localStorage.getItem("resellr_wallet")||"{}")||{}).balance)||0;
    }catch(e){}
    return {inv,soldCount,invValue,costProfit,totalProfit,wallet};
  }

  function apply(mode){
    document.body.classList.add("resellr-pro-v262");
    document.body.classList.remove("pro-light","pro-dark");
    document.body.classList.add(mode==="dark"?"pro-dark":"pro-light");
    localStorage.setItem(KEY,mode);
    const b=document.getElementById("proThemeToggleV262");
    if(b){
      b.innerHTML=mode==="dark"?'☀️ <span>Light Mode</span>':'🌙 <span>Dark Mode</span>';
      b.title=mode==="dark"?"Switch to light mode":"Switch to dark mode";
    }
  }

  function ensureToggle(){
    if(document.getElementById("proThemeToggleV262")) return;
    const b=document.createElement("button");
    b.id="proThemeToggleV262";
    b.className="pro-theme-toggle-v262";
    b.type="button";
    b.onclick=()=>apply(document.body.classList.contains("pro-dark")?"light":"dark");
    document.body.appendChild(b);
  }

  function renameHeaders(){
    const h=document.querySelector("h1,.page-title");
    if(h && /dashboard/i.test(h.textContent||"")){
      const hour=new Date().getHours();
      const greeting=hour<12?"Good Morning":hour<18?"Good Afternoon":"Good Evening";
      h.textContent=greeting+", Jacob.";
    }
  }

  function boot(){
    ensureToggle();
    apply(localStorage.getItem(KEY)||"light");
    renameHeaders();
  }

  const old=window.render;
  if(typeof old==="function"){
    window.render=function(){
      old();
      boot();
    };
  }

  if(document.readyState==="loading"){
    document.addEventListener("DOMContentLoaded",boot);
  }else{
    boot();
  }
  setTimeout(boot,400);
  setTimeout(boot,1200);
})();
