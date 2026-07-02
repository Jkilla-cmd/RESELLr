
(function(){
  const KEY="resellr_theme_v261";
  function apply(mode){
    document.body.classList.remove("pro-light","pro-dark");
    document.body.classList.add(mode==="dark"?"pro-dark":"pro-light");
    localStorage.setItem(KEY,mode);
    const b=document.getElementById("proThemeToggleV261");
    if(b){b.innerHTML=mode==="dark"?'☀️ <span>Light</span>':'🌙 <span>Dark</span>';}
  }
  function ensure(){
    if(document.getElementById("proThemeToggleV261")) return;
    const b=document.createElement("button");
    b.id="proThemeToggleV261"; b.className="pro-theme-toggle-v261"; b.type="button";
    b.onclick=()=>apply(document.body.classList.contains("pro-dark")?"light":"dark");
    document.body.appendChild(b);
  }
  const old=window.render;
  if(typeof old==="function"){
    window.render=function(){old();ensure();apply(localStorage.getItem(KEY)||"light");}
  }
  function boot(){ensure();apply(localStorage.getItem(KEY)||"light");}
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",boot); else boot();
  setTimeout(boot,400);setTimeout(boot,1200);
})();
