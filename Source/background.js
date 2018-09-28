var currentSite = null;
var currentTabId = null;
var startTime = null;
var siteRegexp = /^(\w+:\/\/[^\/]+).*$/;
var debuggingTabs = [];
var updateCounterInterval = 1000; // 1 second.
var apiRoot = "https://codealike.com";
var currentClientVersion = "";

setExtensionIcon();


function initializeLocalStorage() {
    if (!localStorage.trackNavigation) {
        localStorage.trackNavigation = "true";
    }

    if (!localStorage.trackDebugging) {
        localStorage.trackDebugging = "true";
    }

}

function getCurrentVersion() {
    var details = chrome.app.getDetails();
    currentClientVersion = details.version;

    if (localStorage.getItem('client_version')) {
        if (localStorage.getItem('client_version') == currentClientVersion) {
            return;
        }
    }

    localStorage.setItem('client_version', currentClientVersion);
    chrome.tabs.create({
        url: "installed.html"
    });
}

/* Methods for debugging Extension */

function checkAllSites() {
    checkSitesDataset(JSON.parse(localStorage.sites));
}

function checkSitesDataset(dataset) {
    for (site in dataset) {
        var data = dataset[site];
        var originFrom = new Date(data.from);
        var originTo = new Date(data.to);
        var originDuration = data.duration;
        var duration = (originTo - originFrom) / 1000;

        if (Math.abs((duration - originDuration)) > 1) {
            console.log("Data missmatch");
            console.log("Origin: " + originDuration + " New: " + duration);
            console.log(data);
            console.log("currentSite=" + currentSite);
            console.log("currentTabId=" + currentTabId);
            console.log("startTime=" + startTime);
            console.log("site=" + site);
        } else {
            console.log("Data Match");
        }
    }
}

getCurrentVersion();

function isSiteIgnored(url) {
    var match = url.match(siteRegexp);
    if (match) {
        /* Check the ignored list. */
        var ignoredSites = localStorage["ignoredSites"];
        if (!ignoredSites) {
            ignoredSites = [];
        } else {
            ignoredSites = JSON.parse(ignoredSites);
        }
        for (i in ignoredSites) {
            if (ignoredSites[i] == match[1]) {
                console.log("Site is on ignore list: " + match[1]);
                return null;
            }
        }
        return match[1];
    }
    return null;
}

function checkIdleTime(newState) {
    console.log("Checking idle behavior " + newState);

    if (!localStorage.idleHistory)
        localStorage.idleHistory = JSON.stringify([]);

    var idleHistory = JSON.parse(localStorage.idleHistory);
    var date = new Date();

    idleHistory.push({
        timeStamp: date,
        status: newState
    });
    localStorage.idleHistory = JSON.stringify(idleHistory);

    if ((newState == "idle" || newState == "locked")) {
        localStorage["idle"] = "true";
    } else if (newState == "active") {
        localStorage["idle"] = "false";
    }
}

function pause() {
    console.log("Pausing timers.");
    localStorage["paused"] = "true";
}

function resume() {
    console.log("Resuming timers.");
    localStorage["paused"] = "false";
}

/**
 * Updates the counter for the current tab.
 */
function updateCounter() {

    if (localStorage["idle"] == "true") {
        //currentSite = null;
        return;
    }

    if (currentTabId == null) {
        return;
    }

    chrome.tabs.get(currentTabId, function (tab) {
        /* Make sure we're on the focused window, otherwise we're recording bogus stats. */
        chrome.windows.get(tab.windowId, function (window) {
            if (!window) {
                return;
            }

            if (!window.focused) {
                return;
            }
            var status = "navigation";

            if (findDebuggingTabIndexFromId(tab.id) != -1) {
                status = "debugging";
            }

            var site = {};

            site.url = parseUri(tab.url);
            site.favIconUrl = tab.favIconUrl;
            site.title = tab.title;

            if (site.url.host == "devtools") {
                status = "debugger";
            }

            if (localStorage["trackNavigation"] == "false" && status == "navigation") {
                return;
            }

            if (localStorage["trackDebugging"] == "false" && (status == "debugger" || status == "debugging")) {
                return;
            }

            site.incognito = tab.incognito;
            site.status = status;

            if (site.url == null) {
                console.log("Unable to update counter. Malformed url.");
                return;
            }

            /* We can't update any counters if this is the first time visiting any
             * site. This happens on browser startup. Initialize some variables so
             * we can perform an update next time. */
            if (currentSite == null) {
                currentSite = site;
                startTime = new Date();
                return;
            }

            /* Update the time spent for this site by comparing the current time to
             * the last time we were ran. */
            var now = new Date();
            var delta = (now.getTime() - startTime.getTime()) / 1000; // in seconds

            site.from = startTime;
            site.to = now;
            site.duration = delta;

            // If the delta is too large, it's because something caused the update interval
            // to take too long. This could be because of browser shutdown, for example.
            // Ignore the delta if it is too large.

            if (site.status == "debugger") {
                chrome.debugger.getTargets(function (res) {
                    $.each(res, function (i, val) {
                        var debuggedTab = res[i];

                        if (tab.title.indexOf(debuggedTab.url) > 0 && debuggedTab.attached) {
                            site.url = parseUri(debuggedTab.url);
                            site.title = debuggedTab.title;
                            site.favIconUrl = debuggedTab.favIconUrl;

                            currentSite = site;

                            if (delta < updateCounterInterval) {
                                updateTime(currentSite);
                            } else {
                                console.log("Delta of " + delta + " seconds too long; ignored.");
                            }
                            startTime = now;

                        }

                        return;
                    });
                })
            } else {
                currentSite = site;

                if (delta < updateCounterInterval) {
                    updateTime(currentSite);
                } else {
                    console.log("Delta of " + delta + " seconds too long; ignored.");
                }

                startTime = now;
            }
        });
    });
}

function clearStatistics() {
    localStorage.sites = JSON.stringify({});
    localStorage.idleHistory = JSON.stringify([]);

    var lastClear = Date().toString();

    localStorage.lastClear = lastClear;
}

function getUserProfile(token) {
    try {
        var xhr = new XMLHttpRequest();
        var url = apiRoot + "/api/v2/account/##replace##/profile";
        var tokenValues = token.split("/");

        var identity = tokenValues[0];
        var token = tokenValues[1];

        url = url.replace("##replace##", identity);
        xhr.open("GET", url, false);
        xhr.setRequestHeader("X-Api-Identity", identity);
        xhr.setRequestHeader("X-Api-Token", token);
        xhr.send("");

        if (xhr.status == 200) {
            return JSON.parse(xhr.response);
        } else {
            return {
                error: "Not authorized or invalid token."
            };
        }
    } catch (e) {
        return {
            error: e.message
        };
    }
}

function sendWebActivity(sendResponse) {
    var userData = JSON.parse(localStorage["userData"])
    var tokenValues = userData.token.split("/");
    var identity = tokenValues[0];
    var token = tokenValues[1];
    var sites = JSON.parse(localStorage.sites);

    if (!userData || !userData.token || userData.token == "" || sites.length == 0 || $.isEmptyObject(sites)) {
        sendResponse({
            result: "ok"
        });
        localStorage.lastUpdateStatus = "ok";
        chrome.browserAction.setTitle({
            title: "Codealike time tracker. You're authenticated to Codealike. Last bundle of stats sent " + moment(localStorage.lastUpdate).fromNow() + "."
        });
        chrome.browserAction.setBadgeText({
            text: ""
        });
        return;
    }

    var webActivity = $.map(sites, function (item, index) {
        return {
            Url: item.url.source,
            Title: item.title,
            FavIconUrl: item.favIconUrl || "",
            From: item.from,
            Status: item.status,
            Secure: item.secure,
            Duration: item.duration
        };
    });

    $.ajax({
        type: "POST",
        url: apiRoot + "/api/v2/webactivity/SaveWebActivity",
        contentType: "application/json",
        dataType: "json",
        data: JSON.stringify({
            WebActivity: webActivity,
            WebActivityLog: groupIdleHistory().Data,
            Extension: currentClientVersion
        }),
        beforeSend: function (request) {
            request.setRequestHeader("X-Api-Identity", identity);
            request.setRequestHeader("X-Api-Token", token);
            localStorage.sendingData = "true";
        },
        complete: function (data, textStatus, jqXHR) {
            var lastUpdate = Date().toString();

            localStorage.sendingData = "false";

            if (data.statusText == "OK") {
                clearStatistics();
                console.log("Activity sent to Server: " + webActivity.length);
                sendResponse({
                    result: "ok"
                });
                localStorage.lastUpdateStatus = "ok";
                localStorage.lastUpdate = lastUpdate;
                chrome.browserAction.setTitle({
                    title: "Codealike time tracker. You're authenticated to Codealike. Last bundle of stats sent " + moment(localStorage.lastUpdate).fromNow() + "."
                });
                chrome.browserAction.setBadgeText({
                    text: ""
                });
            } else {
                console.log("Activity sent to Server FAILED: " + webActivity.length);
                sendResponse({
                    result: "failed"
                });
                localStorage.lastUpdateStatus = "failed";
                localStorage.lastUpdateTry = lastUpdate;
                chrome.browserAction.setTitle({
                    title: "Codealike time tracker. An error happened trying to send Web Activity " + moment(localStorage.lastUpdateTry).fromNow() + "."
                });
                chrome.browserAction.setBadgeText({
                    text: "!"
                });
            }
        }
    });
}

function getWebActivity(sendResponse) {
    var userData = JSON.parse(localStorage["userData"])
    var tokenValues = userData.token.split("/");
    var identity = tokenValues[0];
    var token = tokenValues[1];

    $.ajax({
        type: "GET",
        url: apiRoot + "/api/v2/webactivity",
        contentType: "application/json",
        dataType: "json",
        cache: false,
        data: null,
        beforeSend: function (request) {
            request.setRequestHeader("X-Api-Identity", identity);
            request.setRequestHeader("X-Api-Token", token);
            localStorage.sendingData = "true";
        },
        complete: function (data, textStatus, jqXHR) {
            var lastUpdate = Date().toString();

            localStorage.sendingData = "false";

            if (data.statusText == "OK") {
                console.log("Activity received from Server");
                sendResponse({
                    result: "ok",
                    data: data.responseJSON
                });
            } else {
                console.log("Receiving activity from Server FAILED");
                sendResponse({
                    result: "failed"
                });
            }
        }
    });
}

function sendWebActivityAutomatically() {
    if (localStorage["paused"] == "true") {
        return;
    }

    sendWebActivity();
}

/**
 * Adds a site to the ignored list.
 */
function addIgnoredSite(site) {
    console.log("Removing " + site);

    chrome.tabs.get(currentTabId, function (tab) {
        var host = tab.url;
    });

    site = isSiteIgnored(site);

    if (!site) {
        return;
    }

    var ignoredSites = localStorage.ignoredSites;

    if (!ignoredSites) {
        ignoredSites = [];
    } else {
        ignoredSites = JSON.parse(ignoredSites);
    }
    ignoredSites.push(site);
    localStorage.ignoredSites = JSON.stringify(ignoredSites);

    var sites = JSON.parse(localStorage.sites);
    delete sites[site];
    localStorage.sites = JSON.stringify(sites);
}

/**
 * Updates the amount of time we have spent on a given site.
 * @param {string} site The site to update.
 * @param {float} seconds The number of seconds to add to the counter.
 */

var currentUUID = "";

function updateTime(site) {
    var url = site.url;

    if (url.host == "newtab") {
        return false;
    }

    if (isSiteIgnored(url.source) == null) {
        return false;
    }

    var sites = JSON.parse(localStorage.sites);

    if (currentUUID != "") {
        sites[currentUUID].duration += site.duration; // In Seconds
        sites[currentUUID].to = site.to;

        localStorage.sites = JSON.stringify(sites);

        return;
    }

    var uuid = guid();
    var obj = {};

    obj.duration = 0;

    sites[uuid] = obj;
    sites[uuid].url = url;
    sites[uuid].title = site.title;
    sites[uuid].from = site.from;
    sites[uuid].to = site.to;
    sites[uuid].favIconUrl = site.favIconUrl;
    sites[uuid].secure = site.incognito;
    sites[uuid].status = site.status;
    sites[uuid].duration = site.duration; // In Seconds

    localStorage.sites = JSON.stringify(sites);

    currentUUID = uuid;
}

function findDebuggingTabIndexFromId(tabIdOrUrl) {

    if (tabIdOrUrl) {
        for (var i = 0; i < debuggingTabs.length; i++) {
            if (tabIdOrUrl == debuggingTabs[i].tabId || tabIdOrUrl == debuggingTabs[i].url)
                return i;
        }
    }

    return -1;
}

function findDebuggingTabIndexFromDevtoolsTabId(devtoolsTabId) {

    if (devtoolsTabId) {
        for (var i = 0; i < debuggingTabs.length; i++) {
            if (devtoolsTabId == debuggingTabs[i].devtoolsTabId)
                return i;
        }
    }

    return -1;
}

function addOrUpdateDebuggingTabData(tab) {
    var index = findDebuggingTabIndexFromId(tab.id);

    if (index == -1) {
        debuggingTabs.push({
            tabId: tab.id,
            url: tab.url,
            title: tab.title,
            windowsId: tab.windowId
        });
    } else {
        debuggingTabs[index].url = tab.url;
        debuggingTabs[index].title = tab.title;
        debuggingTabs[index].windowId = tab.windowId;
    }
}

function removeTabData(tabId) {
    var index = findDebuggingTabIndexFromId(tabId);

    if (index != -1) {
        debuggingTabs.splice(index, 1);
    }
}

function getUserStoredProfile(sendResponse) {
    var userData = {};

    if (!localStorage["userData"]) {
        sendResponse({
            token: null,
            hasUserData: false
        });
    } else {
        userData = JSON.parse(localStorage["userData"])
        sendResponse(userData);
    }
}

function setExtensionIcon() {
    if (!localStorage["userData"]) {
        chrome.browserAction.setIcon({
            path: "images/anonymousIcon.png"
        });
        chrome.browserAction.setBadgeText({
            text: "!"
        });
        chrome.browserAction.setTitle({
            title: "Codealike time tracker. You're not authenticated. All data will remain local and might be lost according to storage quota limit."
        });
    } else {
        chrome.browserAction.setIcon({
            path: "images/icon.png"
        });

        if (localStorage.lastUpdateStatus) {
            if (localStorage.lastUpdateStatus == "ok") {
                chrome.browserAction.setTitle({
                    title: "Codealike time tracker. You're authenticated to Codealike. Last bundle of stats sent on " + localStorage.lastUpdate + "."
                });
                chrome.browserAction.setBadgeText({
                    text: ""
                });
            } else {
                chrome.browserAction.setTitle({
                    title: "Codealike time tracker. An error happened trying to send Web Activity on " + localStorage.lastUpdateTry + "."
                });
                chrome.browserAction.setBadgeText({
                    text: "!"
                });
            }
        } else {
            chrome.browserAction.setTitle({
                title: "Codealike time tracker. You're authenticated to Codealike."
            });
            chrome.browserAction.setBadgeText({
                text: ""
            });
        }
    }
}

function getUserData(request, sendResponse) {
    var userData = {};
    var response = getUserProfile(request.token);

    if (!response) {
        sendResponse({
            token: request.token,
            hasUserData: false
        });
    } else {
        if (response.error) {
            sendResponse({
                token: request.token,
                error: response.error,
                hasUserData: false
            });
        } else {
            userData = {
                token: request.token,
                avatarUri: response.AvatarUri,
                displayName: response.DisplayName,
                identity: response.Identity,
                hasUserData: true
            };

            localStorage["userData"] = JSON.stringify(userData);

            sendResponse(userData);
        }
    }
}

/**
 * Initailized our storage and sets up tab listeners.
 */
function initialize() {

    var devToolsPorts = [];

    // this listen this --> var backgroundPageConnection = chrome.runtime.connect(...) on devtools.js
    chrome.runtime.onConnect.addListener(function (devToolsPort) {
        if (devToolsPort.name == "devtools-page") {

            var devToolsListener = function (message, sender, sendResponse) {

                // Inject a content script into the identified tab
                if (message.status == "debugging-started") {
                    var tabId = message.tabId;

                    currentUUID = "";

                    devToolsPorts[tabId] = devToolsPort;

                    chrome.tabs.get(tabId, function (tab) {
                        addOrUpdateDebuggingTabData(tab);
                    });

                    devToolsPorts[tabId].onDisconnect.addListener(function (port) {
                        removeTabData(tabId);
                        devToolsPorts[tabId].onMessage.removeListener(devToolsListener);
                        currentUUID = "";
                        delete devToolsPorts[tabId];
                    });
                }
            };

            // add the listener to chrome.runtime.sendMessage(...) on devtools.js
            devToolsPort.onMessage.addListener(devToolsListener);

        }
    });

    if (!localStorage.sites) {
        localStorage.sites = JSON.stringify({});
    }

    if (!localStorage.paused) {
        localStorage.paused = "false";
    }

    if (localStorage["paused"] == "true") {
        pause();
    }

    if (!localStorage.lastUpdateStatus) {
        localStorage.lastUpdateStatus = "ok";
    }

    initializeLocalStorage();

    /* Add some listeners for tab changing events. We want to update our
     *  counters when this sort of stuff happens. */
    chrome.tabs.onActivated.addListener(
        function (activeInfo) {
            console.log("Tab changed");
            currentTabId = activeInfo.tabId;
            currentUUID = "";
            updateCounter();
        });

    chrome.tabs.onUpdated.addListener(
        function (tabId, changeInfo, tab) {
            if (tabId == currentTabId) {
                console.log("Tab updated");
                currentUUID = "";
                updateCounter();
            }
        });

    chrome.windows.onFocusChanged.addListener(
        function (windowId) {
            console.log("Detected window focus changed.");

            chrome.tabs.getSelected(windowId,
                function (tab) {
                    console.log("Window/Tab changed");
                    if (tab) {
                        currentTabId = tab.id;
                        currentUUID = "";
                        updateCounter();
                    }
                });
        });

    /* Listen for update requests. These come from the popup. */
    chrome.extension.onRequest.addListener(
        function (request, sender, sendResponse) {
            if (request.action == "clearStats") {
                console.log("Clearing statistics by request.");
                clearStatistics();
                sendResponse({});
            } else if (request.action == "addIgnoredSite") {
                addIgnoredSite(request.site);
                sendResponse({});
            } else if (request.action == "pause") {
                pause();
            } else if (request.action == "resume") {
                resume();
            } else if (request.action == "cleanUserData") {
                localStorage.removeItem("userData");
                getUserData(request, sendResponse);
                setExtensionIcon();
            } else if (request.action == "getUserData") {
                getUserData(request, sendResponse);
                setExtensionIcon();
            } else if (request.action == "getUserStoredProfile") {
                getUserStoredProfile(sendResponse);
                setExtensionIcon();
            } else if (request.action == "sendWebActivity") {
                sendWebActivity(sendResponse);
            } else if (request.action == "getWebActivity") {
                getWebActivity(sendResponse);
            } else if (request.action == "getCurrentVersion") {
                sendResponse({
                    clientVersion: currentClientVersion
                });
            } else {
                console.log("Invalid action given.");
            }
        });

    /* Force an update of the counter every minute. Otherwise, the counter
       only updates for selection or URL changes. */
    window.setInterval(updateCounter, updateCounterInterval);

    if (!localStorage["sendStatsInterval"]) {
        localStorage["sendStatsInterval"] = 60 * 60 * 1000; //Send activity to server each hour.
    }

    /* Default is to use local only storage. */
    localStorage["storageType"] = "local";

    // Send statistics periodically.
    console.log("Sending stats interval " + localStorage["sendStatsInterval"]);
    window.setInterval(sendWebActivityAutomatically, localStorage["sendStatsInterval"]);

    // Keep track of idle time.
    chrome.idle.queryState(30, checkIdleTime);
    chrome.idle.onStateChanged.addListener(checkIdleTime);
}

initialize();