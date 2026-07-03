(function(){
  var form = document.getElementById("loginForm");
  var emailInput = document.getElementById("loginEmail");
  var passwordInput = document.getElementById("loginPassword");
  var errorEl = document.getElementById("loginError");
  var submitBtn = document.getElementById("loginSubmitBtn");

  function showError(msg){
    errorEl.textContent = msg;
    errorEl.hidden = false;
  }

  if(typeof firebaseConfig === "undefined" || !firebaseConfig.apiKey || firebaseConfig.apiKey === "YOUR_API_KEY"){
    form.hidden = true;
    showError("Firebase isn't configured yet. Open firebase-config.js and paste in your project's config.");
    return;
  }

  firebase.initializeApp(firebaseConfig);
  var auth = firebase.auth();

  // Already logged in? Skip straight to the app.
  auth.onAuthStateChanged(function(user){
    if(user) window.location.href = "index.html";
  });

  function friendlyError(code){
    switch(code){
      case "auth/invalid-email": return "That doesn't look like a valid email address.";
      case "auth/user-not-found":
      case "auth/wrong-password":
      case "auth/invalid-credential": return "Incorrect email or password.";
      case "auth/too-many-requests": return "Too many attempts. Please wait a bit and try again.";
      case "auth/network-request-failed": return "Network error — check your connection.";
      case "auth/user-disabled": return "This account has been disabled.";
      default: return "Something went wrong. Please try again.";
    }
  }

  form.onsubmit = function(e){
    e.preventDefault();
    errorEl.hidden = true;
    var email = emailInput.value.trim();
    var password = passwordInput.value;
    submitBtn.disabled = true;
    submitBtn.textContent = "Logging in…";
    auth.signInWithEmailAndPassword(email, password)
      .then(function(){ window.location.href = "index.html"; })
      .catch(function(err){
        showError(friendlyError(err.code));
        submitBtn.disabled = false;
        submitBtn.textContent = "Log In";
      });
  };
})();
