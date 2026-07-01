
/* v260 restore sold edit buttons + keep old action icons */
(function(){
  function qs(s){return document.querySelector(s)}
  function clean(v){const x=Number(String(v??"").replace(/[^0-9.-]/g,""));return Number.isFinite(x)?x:0}
  function allSold(){
    const rows=sold(); let changed=false;
    rows.forEach((r,i)=>{if(!r.soldId&&!r.id&&!r._id){r.soldId="sold260_"+Date.now()+"_"+i+"_"+Math.random().toString(16).slice(2);changed=true}})
    if(changed) setSold(rows);
    return rows;
  }
  function key(r){return String(r.soldId||r.id||r._id||"")}
  function idx(id){return sold().findIndex(r=>key(r)===String(id))}
  function ensureModal(){
    let modal=qs("#soldEditModalV260");
    if(modal) return modal;
    modal=document.createElement("div");
    modal.id="soldEditModalV260";
    modal.innerHTML=`<form class="modal-box" id="soldEditFormV260">
      <h2>Edit Sold Item</h2>
      <input name="title" placeholder="Item title" required>
      <div class="form-grid">
        <select name="platform"><option value="Mercari">Mercari</option><option value="eBay">eBay</option><option value="Private Sale">Private Sale</option></select>
        <select name="category"><option value="Comic">Comic</option><option value="Card">Card</option><option value="Other">Other</option></select>
        <input name="soldPrice" type="number" step="any" placeholder="Sold price" required>
        <input name="cost" type="number" step="any" placeholder="Cost">
        <input name="fees" type="number" step="any" placeholder="Fees">
        <input name="shipping" type="number" step="any" placeholder="Shipping">
        <input name="soldDate" type="date">
      </div>
      <textarea name="notes" placeholder="Notes"></textarea>
      <div class="modal-actions">
        <button type="button" id="cancelSoldEditV260">Cancel</button>
        <button class="primary">Save Sold Item</button>
      </div>
    </form>`;
    document.body.appendChild(modal);
    return modal;
  }

  let editingId=null;

  window.editSoldV260=function(id,ev){
    if(ev){ev.preventDefault();ev.stopPropagation(); if(ev.stopImmediatePropagation) ev.stopImmediatePropagation();}
    const rows=sold(), i=idx(id), item=rows[i];
    if(!item) return false;
    editingId=id;
    const modal=ensureModal(), form=qs("#soldEditFormV260");
    form.elements.title.value=title(item);
    const p=platform(item).toLowerCase();
    form.elements.platform.value=p.includes("ebay")?"eBay":p.includes("private")?"Private Sale":"Mercari";
    const cat=String(item.category||item.type||"").toLowerCase();
    form.elements.category.value=cat.includes("card")?"Card":cat.includes("other")?"Other":"Comic";
    form.elements.soldPrice.value=price(item)||"";
    form.elements.cost.value=cost(item)||"";
    form.elements.fees.value=fees(item)||"";
    form.elements.shipping.value=ship(item)||"";
    const d=dateOf(item);
    form.elements.soldDate.value=d&&!isNaN(d)?d.toISOString().slice(0,10):new Date().toISOString().slice(0,10);
    form.elements.notes.value=item.notes||item.description||"";
    modal.classList.add("open");
    modal.style.display="flex";
    return false;
  };

  window.moveSoldV260=function(id,ev){
    if(ev){ev.preventDefault();ev.stopPropagation();}
    const rows=sold(), i=idx(id), item=rows[i];
    if(!item) return false;
    const a=active();
    a.unshift({...item,status:"active",addedAt:new Date().toISOString()});
    rows.splice(i,1);
    setSold(rows); setActive(a); render(); showPage("inventory");
    return false;
  };

  window.deleteSoldV260=function(id,ev){
    if(ev){ev.preventDefault();ev.stopPropagation();}
    const rows=sold(), i=idx(id), item=rows[i];
    if(!item) return false;
    if(confirm(`Delete "${title(item)}" from Sold Items?`)){
      rows.splice(i,1); setSold(rows); render();
    }
    return false;
  };

  document.addEventListener("pointerdown",function(e){
    const btn=e.target.closest&&e.target.closest("[data-edit-sold-v260]");
    if(btn) window.editSoldV260(btn.dataset.id,e);
  },true);

  document.addEventListener("click",function(e){
    const btn=e.target.closest&&e.target.closest("[data-edit-sold-v260]");
    if(btn){window.editSoldV260(btn.dataset.id,e);return;}
    if(e.target&&e.target.id==="cancelSoldEditV260"){
      e.preventDefault();
      const modal=qs("#soldEditModalV260");
      if(modal){modal.classList.remove("open");modal.style.display="none";}
    }
  },true);

  document.addEventListener("submit",function(e){
    if(!e.target||e.target.id!=="soldEditFormV260") return;
    e.preventDefault();
    const rows=sold(), i=idx(editingId), item=rows[i];
    if(!item) return;
    const fd=new FormData(e.target);
    const soldPrice=clean(fd.get("soldPrice"));
    const updated={
      ...item,
      title:String(fd.get("title")||"").trim(),
      platform:String(fd.get("platform")||"Mercari"),
      category:String(fd.get("category")||"Comic"),
      price:soldPrice,salePrice:soldPrice,soldPrice:soldPrice,
      cost:clean(fd.get("cost")),
      fees:clean(fd.get("fees")),
      shipping:clean(fd.get("shipping")),
      soldDate:String(fd.get("soldDate")||""),
      date:String(fd.get("soldDate")||item.date||""),
      notes:String(fd.get("notes")||""),
      status:"sold"
    };
    updated.profit=updated.price-updated.cost-updated.fees-updated.shipping;
    rows[i]=updated; setSold(rows); editingId=null;
    const modal=qs("#soldEditModalV260");
    if(modal){modal.classList.remove("open");modal.style.display="none";}
    render();
  },true);

  window.renderSoldRows=function(){
    const base=allSold();
    let filtered=base;
    try{filtered=getSoldFilteredRows()}catch(e){}
    const mapped=filtered.map(r=>({r,i:base.indexOf(r)}));
    try{updateSoldKpisFromRows(mapped.map(x=>x.r))}catch(e){}
    const tbody=qs("#soldRows");
    if(!tbody) return;
    tbody.innerHTML=mapped.map(({r})=>{
      const id=key(r).replace(/'/g,"\\'");
      const p=price(r), pr=profit(r), m=p?Math.round(pr/p*100):0;
      return `<tr>
        <td><div class="item-cell"><div class="thumb"></div><div>${esc(title(r))}<small>${esc(platform(r))}</small></div></div></td>
        <td>${fmt(dateOf(r))}</td>
        <td>${money(p)}</td>
        <td>${money(cost(r))}</td>
        <td class="${pr>=0?"profit":"loss"}">${money(pr)}</td>
        <td class="margin">${m}%</td>
        <td><div class="row-actions">
          <button type="button" class="sold-old-icon-v260 edit" data-edit-sold-v260 data-id="${id}" onpointerdown="return editSoldV260('${id}', event)" onclick="return editSoldV260('${id}', event)" title="Edit sold item">✎</button>
          <button type="button" class="sold-old-icon-v260 move" onclick="return moveSoldV260('${id}', event)" title="Move back to inventory">▣</button>
          <button type="button" class="sold-old-icon-v260 delete" onclick="return deleteSoldV260('${id}', event)" title="Delete sold item">×</button>
        </div></td>
      </tr>`;
    }).join("");
  };

  const oldRender=window.render;
  window.render=function(){oldRender();ensureModal();window.renderSoldRows();};
  setTimeout(()=>{ensureModal();window.renderSoldRows()},400);
  setTimeout(()=>{ensureModal();window.renderSoldRows()},1200);
})();
