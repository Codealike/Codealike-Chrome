// Can use
// chrome.devtools.*
// chrome.extension.*

// Create a tab in the devtools area

var backgroundPageConnection = chrome.runtime.connect({
    name: "devtools-page"
});

backgroundPageConnection.onMessage.addListener(function (message) {
    // Handle responses from the background page, if any
});

backgroundPageConnection.postMessage({
    status: "debugging-started",
    tabId: chrome.devtools.inspectedWindow.tabId
});