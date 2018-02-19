var token = "dotnetweekly-token";
var greToken = "";
var dnwExtToken = "";
var dnwExtExpiration = 0;
var keyNameToken = "dnwExtToken";
var keyNameExpiration = "dnwExtExpiration";
var url = "https://dnw-api.azurewebsites.net/api/v1/";

function refreshCaptcha(){
  setTimeout(function(){
    grecaptcha.reset();
  });
}

function logout(){
  dnwExtExpiration = "";
  dnwExtToken = "";
  chrome.storage.sync.set({ [keyNameExpiration]: "" });
  chrome.storage.sync.set({ [keyNameToken]: "" });
  document.getElementById('dn-form').style.display = "none";
  document.getElementById('dn-form-login').style.display = "block";
}

function loginUser() {
  var email = document.getElementById('dn-email').value;
  var password = document.getElementById('dn-password').value;

  fetch(url + "auth/login?g-recaptcha-response=" + greToken + 
  "&email=" + email + "&password=" + password, {
    method: "POST"
  }).then(function(response){
    return response.json();
  }).then(function(response){
    if (response.success) {
      dnwExtExpiration = response.data.expirationDate;
      dnwExtToken = response.data.token;
      chrome.storage.sync.set({ [keyNameExpiration]: response.data.expirationDate });
      chrome.storage.sync.set({ [keyNameToken]: response.data.token });
      document.getElementById('dn-form').style.display = "block";
      document.getElementById('dn-form-login').style.display = "none";
    } else {
      document.getElementById("dn-form-error").style.display = "block";
    }
    refreshCaptcha();
  }).catch(function(){
    refreshCaptcha();
  })
}

function getSelectValues(select) {
  var result = [];
  var options = select && select.options;
  var opt;

  for (var i=0, iLen=options.length; i<iLen; i++) {
    opt = options[i];

    if (opt.selected) {
      result.push(opt.value || opt.text);
    }
  }
  return result;
}

function getTags() {
  fetch(url + "tags", {
    method: "GET"
  }).then(function(response){
    return response.json();
  }).then(function(response){
    if (response.success) {
      var tags = response.data;
      var tagHtml = "";
      for (var i = 0; i < tags.length; i++){
        if (tags[i] == ".net") {
          tagHtml += "<option value=" + tags[i] + " selected>" + tags[i] + "</option>";
        } else {
          tagHtml += "<option value=" + tags[i] + ">" + tags[i] + "</option>";
        }
      }
      document.querySelector("select[name='Tags']").innerHTML = tagHtml;
    }
  }).catch(function(){

  })
}

function submitArticle() {
  fetch(url + "links?g-recaptcha-response=" + greToken, {
    method: "POST",
    body: JSON.stringify({
      url: document.getElementById('dn-website').value,
      title: document.getElementById('dn-title').value,
      content: document.getElementById('dn-message').value,
      category: document.getElementById('dn-category').value,
      tags: getSelectValues(document.getElementById('dn-tags'))
    }), 
    headers: {
      'Accept': 'application/json, text/plain, */*',
      'Content-Type': 'application/json',
      'Authorization': "Bearer " + dnwExtToken
    },
  }).then(function(response){
    return response.json();
  }).then(function(response){
    if (response.success) {
      document.getElementById("success_message").style.display = "block";
    } else {
      document.getElementById("error_message").style.display = "block";
    }
    refreshCaptcha();
  }).catch(function(){
    refreshCaptcha();
  })
}

function onSubmit(token){
  greToken = token;
  if (!dnwExtToken) {
    loginUser();
  } else {
    submitArticle();
  }
}

document.addEventListener('DOMContentLoaded', function() {

  document.getElementById("logout-btn").addEventListener("click", function( event ) {
    logout();
  }, false);

  getTags();
  document.getElementById('dn-form-login').style.display = "none";
  document.getElementById('dn-form').style.display = "none";
  document.getElementById("dn-form-error").style.display = "none";

  chrome.storage.sync.get(keyNameToken, function(obj) {
      dnwExtToken = obj[keyNameToken];
  });

  chrome.storage.sync.get(keyNameExpiration, function(obj) {
      dnwExtExpiration = obj[keyNameExpiration];
      var unixTimestamp = new Date().getTime() / 1000;
      if (dnwExtExpiration !== null && parseInt(dnwExtExpiration) - unixTimestamp > 0) {
        document.getElementById('dn-form').style.display = "block";
        document.getElementById('dn-form-login').style.display = "none";
      } else {
        dnwExtExpiration = "";
        dnwExtToken = "";
        chrome.storage.sync.set({ [keyNameExpiration]: "" });
        chrome.storage.sync.set({ [keyNameToken]: "" });
        document.getElementById('dn-form').style.display = "none";
        document.getElementById('dn-form-login').style.display = "block";
      }
  });

  chrome.tabs.getSelected(null,function(tab) {
    // var description = tab.head.querySelector("[name=description]");
    
    // if (!description) {
    //   description = tab.title;
    // } else {
    //   description = description.content;
    // }

    document.getElementById('dn-website').value = tab.url;
    document.getElementById('dn-title').value = tab.title;
    document.getElementById('dn-message').value = tab.title;
  });
});