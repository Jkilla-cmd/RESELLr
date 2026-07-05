(function(){
  if(typeof firebase === "undefined" || !firebase.firestore){ return; }

  var db, docRef;
  var lastPushedJSON = null;
  var lastSeenModified = 0;   // modifiedAt of the newest cloud version this device has applied
  var initialSyncDone = false; // pushes are blocked until we've pulled the latest cloud state once
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

  function applyRemote(json, remoteModified){
    try{
      var remoteState = JSON.parse(json);
      state = remoteState;
      lastPushedJSON = json;
      if(typeof remoteModified === "number" && remoteModified > 0) lastSeenModified = remoteModified;
      localStorage.setItem(KEY, json);
      if(typeof render === "function") render();
    }catch(e){}
  }

  // Conflict-safe push: inside a transaction, the write only goes through if the
  // cloud hasn't been modified by another device since we last pulled. If it has,
  // we abort our (potentially stale) write and apply the newer cloud data instead.
  // This prevents a stale device from ever overwriting fresher data.
  function pushToCloud(){
    if(!docRef || typeof state === "undefined") return;
    if(!initialSyncDone) return; // never push before the first pull has resolved
    var json;
    try{ json = JSON.stringify(state); }catch(e){ return; }
    if(json === lastPushedJSON) return;
    setStatus("syncing");
    var newModified = Date.now();
    db.runTransaction(function(tx){
      return tx.get(docRef).then(function(snap){
        var remote = snap.exists ? snap.data() : null;
        var remoteMod = (remote && remote.modifiedAt) || 0;
        if(remoteMod > lastSeenModified){
          var err = new Error("sync-conflict");
          err.conflict = true;
          err.remote = remote;
          throw err;
        }
        tx.set(docRef, {
          data: json,
          device: deviceId,
          modifiedAt: newModified,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
      });
    }).then(function(){
      lastPushedJSON = json;
      lastSeenModified = newModified;
      setStatus("synced");
    }).catch(function(err){
      if(err && err.conflict){
        // Another device wrote newer data since we last looked. Their version wins;
        // apply it locally instead of clobbering it with ours.
        if(err.remote && err.remote.data) applyRemote(err.remote.data, err.remote.modifiedAt);
        setStatus("synced");
      }else{
        setStatus("offline");
      }
    });
  }

  try{
    firebase.auth().onAuthStateChanged(function(user){
      if(!user){ setStatus("off"); return; }

      db = firebase.firestore();
      try{ db.enablePersistence({ synchronizeTabs: true }).catch(function(){}); }catch(e){}
      docRef = db.collection("resellrData").doc(user.uid);

      setStatus("syncing");
      // Prefer a fresh server read so a stale offline cache can't masquerade as current.
      // If the server is unreachable, fall back to the cache -- the transaction-based
      // push will still catch and resolve any staleness on the first write attempt.
      docRef.get({ source: "server" }).catch(function(){ return docRef.get(); }).then(function(snap){
        if(snap.exists){
          var remote = snap.data();
          if(remote && remote.data) applyRemote(remote.data, remote.modifiedAt || 0);
          initialSyncDone = true;
          setStatus("synced");
        }else{
          // First time this account has synced -- seed the cloud with this device's data.
          initialSyncDone = true;
          pushToCloud();
        }

        docRef.onSnapshot(function(snap){
          if(!snap.exists) return;
          var remote = snap.data();
          if(!remote || !remote.data) return;
          if(remote.device === deviceId) return; // our own write, already applied locally
          var remoteMod = remote.modifiedAt || 0;
          if(remoteMod && remoteMod <= lastSeenModified) return; // already have this or newer
          if(remote.data === lastPushedJSON) return; // no real change
          applyRemote(remote.data, remoteMod);
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
