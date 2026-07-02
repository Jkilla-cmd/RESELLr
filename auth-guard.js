(function(){
  var gate = document.getElementById("authGate");
  var shell = document.getElementById("appShell");
  var footer = document.getElementById("statusBar");

  function showConfigWarning(){
    gate.innerHTML = '<p>Firebase isn\'t configured yet.<br>Open <code>firebase-config.js</code> and paste in your project\'s config, then reload this page.</p>';
  }

  if(typeof firebaseConfig === "undefined" || !firebaseConfig.apiKey || firebaseConfig.apiKey === "YOUR_API_KEY"){
    showConfigWarning();
    return;
  }

  try{
    firebase.initializeApp(firebaseConfig);
  }catch(e){
    gate.innerHTML = '<p>Could not connect to Firebase. Check your internet connection and your config in <code>firebase-config.js</code>.</p>';
    return;
  }

  firebase.auth().onAuthStateChanged(function(user){
    if(!user){
      window.location.href = "login.html";
      return;
    }
    gate.hidden = true;
    shell.hidden = false;
    if(footer) footer.hidden = false;
  });
})();
