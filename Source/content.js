chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        if (request.method == "get-dom") {
            sendResponse({
                dom: document.all[0].outerHTML
            });
        }
    });

if (document.getElementById("gritter-item-1")) {
    document.getElementById("gritter-item-1").remove();
}