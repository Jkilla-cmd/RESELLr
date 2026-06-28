
/* v250 final override: runs after app.js */
(function(){
  function qs(s){ return document.querySelector(s); }

  // Clear old service worker/caches so CSS/JS updates actually show on GitHub Pages.
  try{
    if("serviceWorker" in navigator){
      navigator.serviceWorker.getRegistrations().then(regs => regs.forEach(r => r.unregister()));
    }
    if(window.caches){
      caches.keys().then(keys => keys.forEach(k => caches.delete(k)));
    }
  }catch(e){}

  function n250(v){
    const x = Number(String(v ?? "").replace(/[^0-9.-]/g,""));
    return Number.isFinite(x) ? x : 0;
  }

  function ensureSoldIds250(){
    const rows = sold();
    let changed = false;
    rows.forEach((r,i)=>{
      if(!r.soldId && !r.id && !r._id){
        r.soldId = "sold250_" + Date.now() + "_" + i + "_" + Math.random().toString(16).slice(2);
        changed = true;
      }
    });
    if(changed) setSold(rows);
    return rows;
  }

  function key250(r){ return String(r.soldId || r.id || r._id || ""); }
  function idx250(id){ return sold().findIndex(r => key250(r) === String(id)); }

  window.editSoldV250 = function(id){
    const rows = sold();
    const i = idx250(id);
    const item = rows[i];
    if(!item) return;

    const soldPrice = prompt(`Edit sold price for:\n${title(item)}`, String(price(item) || ""));
    if(soldPrice === null) return;

    const itemCost = prompt("Edit cost", String(cost(item) || 0));
    if(itemCost === null) return;

    const itemFees = prompt("Edit fees", String(fees(item) || 0));
    if(itemFees === null) return;

    const itemShipping = prompt("Edit shipping", String(ship(item) || 0));
    if(itemShipping === null) return;

    const p = n250(soldPrice), c = n250(itemCost), f = n250(itemFees), sh = n250(itemShipping);
    rows[i] = {
      ...item,
      price:p,
      salePrice:p,
      soldPrice:p,
      cost:c,
      fees:f,
      shipping:sh,
      profit:p-c-f-sh,
      status:"sold"
    };
    setSold(rows);
    render();
  };

  window.moveSoldV250 = function(id){
    const rows = sold();
    const i = idx250(id);
    const item = rows[i];
    if(!item) return;
    const a = active();
    a.unshift({...item,status:"active",addedAt:new Date().toISOString()});
    rows.splice(i,1);
    setSold(rows);
    setActive(a);
    render();
    showPage("inventory");
  };

  window.deleteSoldV250 = function(id){
    const rows = sold();
    const i = idx250(id);
    const item = rows[i];
    if(!item) return;
    if(confirm(`Delete "${title(item)}" from Sold Items?`)){
      rows.splice(i,1);
      setSold(rows);
      render();
    }
  };

  function placeSnapshot250(){
    const dash = qs("#dashboard");
    const snap = qs("#dashboardSoldSnapshot");
    if(dash && snap){
      dash.appendChild(snap);
      snap.style.setProperty("top","112px","important");
      snap.style.setProperty("transform","none","important");
      snap.style.setProperty("left","37%","important");
      snap.style.setProperty("right","14px","important");
    }
  }

  window.renderSoldRows = function(){
    const base = ensureSoldIds250();
    let filtered = base;
    try{ filtered = getSoldFilteredRows(); }catch(e){}
    const rows = filtered.map(r => ({r, i: base.indexOf(r)}));
    try{ updateSoldKpisFromRows(rows.map(x=>x.r)); }catch(e){}

    const tbody = qs("#soldRows");
    if(!tbody) return;

    tbody.innerHTML = rows.map(({r})=>{
      const id = key250(r).replace(/'/g,"\\'");
      const p = price(r), pr = profit(r), m = p ? Math.round(pr / p * 100) : 0;
      return `<tr>
        <td><div class="item-cell"><div class="thumb"></div><div>${esc(title(r))}<small>${esc(platform(r))}</small></div></div></td>
        <td>${fmt(dateOf(r))}</td>
        <td>${money(p)}</td>
        <td>${money(cost(r))}</td>
        <td class="${pr>=0 ? "profit" : "loss"}">${money(pr)}</td>
        <td class="margin">${m}%</td>
        <td><div class="row-actions">
          <button type="button" class="sold-old-icon-v250 edit" onclick="editSoldV250('${id}')" title="Edit sold item">✎</button>
          <button type="button" class="sold-old-icon-v250 move" onclick="moveSoldV250('${id}')" title="Move back to inventory">▣</button>
          <button type="button" class="sold-old-icon-v250 delete" onclick="deleteSoldV250('${id}')" title="Delete sold item">×</button>
        </div></td>
      </tr>`;
    }).join("");
  };

  const previousRender = window.render;
  window.render = function(){
    previousRender();
    placeSnapshot250();
    window.renderSoldRows();
  };

  function boot250(){
    placeSnapshot250();
    window.renderSoldRows();
  }

  setTimeout(boot250, 250);
  setTimeout(boot250, 900);
  setTimeout(boot250, 1800);
})();
