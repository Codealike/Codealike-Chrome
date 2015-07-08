$("document").ready(function(){

  $("#add-url").click(function(){
    var urlToIgnore = document.getElementById("black-url").value;

    chrome.extension.sendRequest({ action: "addIgnoredSite", url: urlToIgnore }, function (response) {
      console.log(urlToIgnore + " " + response.status );
    });

  });

});
