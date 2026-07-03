(function(){
  if(typeof firebase === "undefined" || !firebase.firestore){ return; }

  var db, docRef, lastPushedJSON = null;
  var chip = document.getElementById("cloudSyncChip");
  var dot = document.getElementById("cloudSyncDot");
  var text = document.getElementById("cloudSyncText");

  var deviceId = (function(){
    var id = localStorage.getItem("__resellr_device_id");
    if(!id){ id = "dev_" + Date.now() + "_" + Math.random().toString(36).slice(2); localStorage.setItem("__resellr_device_id", id); }
    return id;
  })();

  function setStatus(status){
    if(!chip) return;
    chip.hidden = false;
    if(status === "synced"){ text.textContent = "Synced"; dot.style.background = "#22c55e"; }
    else if(status === "syncing"){ text.textContent = "Syncing…"; dot.style.background = "#e0a63f"; }
    else if(status === "offline"){ text.textContent = "Offline"; dot.style.background = "#dc2626"; }
    else if(status === "off"){ chip.hidden = true; }
  }

  function pushToCloud(){
    if(!docRef || typeof state === "undefined") return;
    var json;
    try{ json = JSON.stringify(state); }catch(e){ return; }
    if(json === lastPushedJSON) return;
    lastPushedJSON = json;
    setStatus("syncing");
    docRef.set({
      data: json,
      device: deviceId,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }).then(function(){
      setStatus("synced");
    }).catch(function(){
      setStatus("offline");
    });
  }

  function applyRemote(json){
    try{
      var remoteState = JSON.parse(json);
      state = remoteState;
      lastPushedJSON = json;
      localStorage.setItem(KEY, json);
      if(typeof render === "function") render();
    }catch(e){}
  }

  try{
    firebase.auth().onAuthStateChanged(function(user){
      if(!user){ setStatus("off"); return; }

      db = firebase.firestore();
      try{ db.enablePersistence({ synchronizeTabs: true }).catch(function(){}); }catch(e){}
      docRef = db.collection("resellrData").doc(user.uid);

      setStatus("syncing");
      docRef.get().then(function(snap){
        if(snap.exists){
          var remote = snap.data();
          if(remote && remote.data) applyRemote(remote.data);
          setStatus("synced");
        }else{
          // First time this account has synced -- seed the cloud with whatever's on this device now.
          pushToCloud();
        }

        docRef.onSnapshot(function(snap){
          if(!snap.exists) return;
          var remote = snap.data();
          if(!remote || !remote.data) return;
          if(remote.device === deviceId) return; // our own write, already applied locally
          if(remote.data === lastPushedJSON) return; // no real change
          applyRemote(remote.data);
        }, function(){
          setStatus("offline");
        });
      }).catch(function(){
        setStatus("offline");
      });
    });
  }catch(e){
    // Firebase not initialized (e.g. config still has placeholder values) -- fail silently,
    // the app keeps working from localStorage only, same as before cloud sync existed.
  }

  // Hook into the app's existing save() so every local change also pushes to the cloud.
  if(typeof save === "function"){
    var _origSave = save;
    save = function(){
      _origSave();
      pushToCloud();
    };
  }
})();
