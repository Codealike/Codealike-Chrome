(() => {
  const backgroundPageConnection = chrome.runtime.connect({
    name: 'devtools-page',
  });

  backgroundPageConnection.postMessage({
    status: 'debugging-started',
    tabId: chrome.devtools.inspectedWindow.tabId,
  });
})();
