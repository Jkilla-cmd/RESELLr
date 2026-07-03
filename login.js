(function(){
  var form = document.getElementById("loginForm");
  var emailInput = document.getElementById("loginEmail");
  var passwordInput = document.getElementById("loginPassword");
  var errorEl = document.getElementById("loginError");
  var submitBtn = document.getElementById("loginSubmitBtn");

  // --- mascot: eyes track email typing, shutters cover eyes for password ---
  // Controlled entirely via inline styles set here in JS, independent of styles.css,
  // so the animation can never be broken by a stylesheet caching/version mismatch.
  var mascot = document.getElementById("robotMascot");
  var pupilL = document.getElementById("botPupilLeft");
  var pupilR = document.getElementById("botPupilRight");
  var shutterL = document.getElementById("botShutterLeft");
  var shutterR = document.getElementById("botShutterRight");
  var BASE_L_X = 118, BASE_R_X = 182, MAX_OFFSET = 8;

  function updateEyes(){
    if(!pupilL || !pupilR) return;
    var len = emailInput.value.length;
    var t = Math.max(-1, Math.min(1, (len - 10) / 10));
    var dx = t * MAX_OFFSET;
    pupilL.setAttribute("cx", BASE_L_X + dx);
    pupilR.setAttribute("cx", BASE_R_X + dx);
  }
  function setCovering(isCovering){
    if(!shutterL || !shutterR) return;
    var sy = isCovering ? "0px" : "-72px";
    shutterL.style.transform = "translateY(" + sy + ")";
    shutterR.style.transform = "translateY(" + sy + ")";
    if(pupilL) pupilL.style.opacity = isCovering ? "0" : "1";
    if(pupilR) pupilR.style.opacity = isCovering ? "0" : "1";
  }
  if(emailInput && mascot){
    emailInput.addEventListener("input", updateEyes);
    emailInput.addEventListener("focus", function(){ setCovering(false); });
  }
  if(passwordInput && mascot){
    passwordInput.addEventListener("focus", function(){ setCovering(true); });
    passwordInput.addEventListener("blur", function(){ setCovering(false); });
  }

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
