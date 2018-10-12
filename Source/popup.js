function setLastUpdate() {
    var lastEvent = localStorage.lastClear;

    if (localStorage.lastUpdate) {
        if (lastEvent) {
            if (lastEvent < localStorage.lastUpdate) {
                lastEvent = localStorage.lastUpdate;
            }
        } else {
            lastEvent = localStorage.lastUpdate;
        }
        $("#stats-sent").html("Last bundle of stats sent " + moment(localStorage.lastUpdate).fromNow() + ".");
        $("#visited-sites-title").html("Visited sites since " + moment(lastEvent).fromNow());
        $("#activity-history-title").html("Activity history since " + moment(lastEvent).fromNow());
    } else {
        $("#stats-sent").html("");

        if (lastEvent) {
            $("#visited-sites-title").html("Visited sites since " + moment(lastEvent).fromNow());
            $("#activity-history-title").html("Activity history since " + moment(lastEvent).fromNow());
        } else {
            $("#visited-sites-title").html("Visited sites");
            $("#activity-history-title").html("Activity history");
        }
    }
}

function groupSitesByDuration(sites) {
    var grouppedSites = [];

    function getIndexById(id) {
        for (var i = 0; i < grouppedSites.length; i++) {
            if (grouppedSites[i].id == id)
                return i;
        }

        return -1;
    }

    var durationFormat = function () {
        return this.duration.toString().toHHMMSS();
    };

    var toFormat = function () {
        return moment(this.to).fromNow();
    };

    var toFull = function () {
        return moment(this.to).format("MMMM Do YYYY, h:mm:ss a");
    };

    var navigationDuration = 0;
    var debuggingDuration = 0;
    var debuggerDuration = 0;

    $.each(sites, function (index, val) {
        var totalDuration = val.duration || 0;
        var site = {};

        val = val[1];

        if (val.url.host != "") {
            var index = getIndexById(val.url.host + "_" + val.status);

            switch (val.status) {
                case "navigation":
                    navigationDuration += val.duration;
                    break;
                case "debugging":
                    debuggingDuration += val.duration;
                    break;
                case "debugger":
                    debuggerDuration += val.duration;
                    break;
                default:

            }

            if (index != -1) {
                totalDuration = grouppedSites[index].duration + val.duration;

                grouppedSites[index].duration = totalDuration;

                if (!grouppedSites[index].completed) {
                    if (val.favIconUrl) {
                        grouppedSites[index].favIconUrl = val.favIconUrl;
                        grouppedSites[index].title = val.title;
                        grouppedSites[index].host = val.url.host;
                        grouppedSites[index].completed = true;
                    }
                }

                if (grouppedSites[index].from > val.from) {
                    grouppedSites[index].from = val.from;
                }

                if (grouppedSites[index].to < val.to) {
                    grouppedSites[index].to = val.to;
                }
            } else {
                site.id = val.url.host + "_" + val.status;
                site.host = val.url.host;

                if (isNaN(val.duration)) {
                    site.duration = 0;
                } else {
                    site.duration = val.duration;
                }

                site.status = val.status;
                site.title = val.title;
                site.favIconUrl = val.favIconUrl;
                site.from = val.from;
                site.to = val.to;
                site.formattedDuration = durationFormat;
                site.formattedTo = toFormat;
                site.fullTo = toFull;

                grouppedSites.push(site);
            }
        }
    });

    grouppedSites.navigationDuration = navigationDuration;
    grouppedSites.debuggingDuration = debuggingDuration;
    grouppedSites.debuggerDuration = debuggerDuration;

    grouppedSites.duration = navigationDuration + debuggingDuration + debuggerDuration;
    grouppedSites.formattedDuration = durationFormat;

    return grouppedSites;
}

function updateLocalStats() {
    var sites = JSON.parse(localStorage.sites);
    var sortedSites = new Array();
    var totalTime = 0;

    for (site in sites) {
        sortedSites.push([site, sites[site]]);
        totalTime += sites[site].duration;
    }

    sortedSites = groupSitesByDuration(sortedSites);

    sortedSites.sort(function (a, b) {
        return b.duration - a.duration;
    });

    /* Show only the top 5 sites by default */
    var max = 5;

    $.get('templates/site.mst', function (template) {
        var i = 0;

        $('#sites-list').html("");

        for (site in sortedSites) {
            if (sortedSites[site].duration) {
                if (i == max && document.location.href.indexOf("show=all") == -1)
                    break;

                sortedSites[site].percentage = Math.round((sortedSites[site].duration * 100 / sortedSites.duration) * 100) / 100;

                var html = Mustache.to_html(template, sortedSites[site]);
                $('#sites-list').append(html);
            }
            i++;
        }

        $.each($('#sites-list img'), function () {
            $($(this)[0]).load(function () {
                if ($(this)[0].height > 0 && $(this)[0].width > 0) {
                    var colorThief = new ColorThief();
                    var color = colorThief.getColor($(this)[0]);

                    $(this).parent("li").css("border-left-color", "rgb(" + color[0] + "," + color[1] + "," + color[2] + ")");
                }
            });
        });
    });

    $.get('templates/activities.mst', function (template) {
        sortedSites.navigationDuration = sortedSites.navigationDuration * 100 / sortedSites.duration;
        sortedSites.debuggingDuration = sortedSites.debuggingDuration * 100 / sortedSites.duration;
        sortedSites.debuggerDuration = sortedSites.debuggerDuration * 100 / sortedSites.duration;

        sortedSites.navigationPercentage = Math.round(sortedSites.navigationDuration * 100) / 100;
        sortedSites.debuggingPercentage = Math.round(sortedSites.debuggingDuration * 100) / 100;
        sortedSites.debuggerPercentage = Math.round(sortedSites.debuggerDuration * 100) / 100;

        var html = Mustache.to_html(template, sortedSites);
        $('#activities').html(html);
        $("#activitiesTitle").html("Local activities summary");
    });

    /* Add an option to show all stats */
    var showAllLink = $("#show-all");

    showAllLink.click(function () {
        chrome.tabs.create({
            url: "popup.html?show=all"
        });
    });

    /* Show the "Show All" link if there are some sites we didn't show. */
    $("#show-all").hide();
    if (document.location.href.indexOf("show=all") == -1) {
        showAllLink.attr("href", "javascript:void(0)");
        $("#show-all").show();
    }
}

function getCurrentVersion() {
    chrome.extension.sendRequest({
        action: "getCurrentVersion"
    }, function (response) {
        $.get('templates/version.mst', function (template) {
            var html = Mustache.to_html(template, response);
            $('#version').html(html);
        });
    });
}

function getUserStoredProfile() {
    chrome.extension.sendRequest({
        action: "getUserStoredProfile"
    }, function (response) {
        $.get('templates/user.mst', function (template) {
            var html = Mustache.to_html(template, response);

            $('#login-section').html(html);

            if (document.getElementById("login")) {
                document.getElementById("login").addEventListener("click", getUserData);
                $("#sendWebActivity").addClass("hidden");
                $("#getWebActivity").addClass("hidden");
                $("#toggle_pause").addClass("hidden");

                chrome.tabs.getSelected(null, function (tab) {
                    chrome.tabs.sendMessage(tab.id, {
                        method: "get-dom"
                    }, function (response) {
                        if (response) {
                            dom = response.dom;

                            token = $(dom).find("#apiToken").val();

                            if (!token) {
                                token = "";
                            }

                            $("#token").val(token);
                        }
                    });
                });
            } else {
                $("#sendWebActivity").removeClass("hidden");
                $("#getWebActivity").removeClass("hidden");
                $("#toggle_pause").removeClass("hidden");
            }

            if (document.getElementById("logout")) {
                document.getElementById("logout").addEventListener("click", cleanUserData);
            }
        });
    });
}

function getUserData() {
    var token = "";

    if ($("#token") && $("#token").val()) {
        token = $("#token").val().trim();
    } else {
        return;
    }

    $("#login").html("Loading...");
    $("#login").addClass("disabled");
    $("#login").removeClass("btn-info");

    chrome.extension.sendRequest({
        action: "getUserData",
        token: token
    }, function (response) {
        $.get('templates/user.mst', function (template) {
            var html = Mustache.to_html(template, response);

            $('#login-section').html(html);

            if (document.getElementById("login")) {
                document.getElementById("login").addEventListener("click", getUserData);
                $("#sendWebActivity").addClass("hidden");
                $("#getWebActivity").addClass("hidden");
                $("#toggle_pause").addClass("hidden");
            } else {
                $("#sendWebActivity").removeClass("hidden");
                $("#getWebActivity").removeClass("hidden");
                $("#toggle_pause").removeClass("hidden");
            }

            if (document.getElementById("logout")) {
                document.getElementById("logout").addEventListener("click", cleanUserData);
            }
        });
    });
}

function cleanUserData() {
    chrome.extension.sendRequest({
        action: "cleanUserData"
    }, function (response) {
        $.get('templates/user.mst', function (template) {
            var html = Mustache.to_html(template, {
                hasUserData: false
            });

            $('#login-section').html(html);

            if (document.getElementById("login")) {
                document.getElementById("login").addEventListener("click", getUserData);
                $("#sendWebActivity").addClass("hidden");
                $("#getWebActivity").addClass("hidden");
                $("#toggle_pause").addClass("hidden");
            } else {
                $("#sendWebActivity").removeClass("hidden");
                $("#getWebActivity").removeClass("hidden");
                $("#toggle_pause").removeClass("hidden");
            }
        });
    });
}

function updateSendingStatus(status, initializingPopup) {
    if (status == "ok") {
        if (initializingPopup)
            return;

        $("#sites-list li").remove();
        $('#activities').html("");
        $("#warning-section SPAN").html("All info has been sent and deleted stats from local repository.");
        $("#warning-section STRONG").html("Hell yeah!");
        $("#warning-section .alert").addClass("alert-success");
        $("#warning-section .alert").removeClass("alert-danger");

        setLastUpdate();
    } else {
        $("#warning-section SPAN").html("An error happened trying to send Web Activity <b>" + moment(localStorage.lastUpdateTry).fromNow() + "</b>. <br/> Nothing was deleted from local repository. <br/> Try again later, please.");
        $("#warning-section STRONG").html("Oh my!");
        $("#warning-section .alert").removeClass("alert-success");
        $("#warning-section .alert").addClass("alert-danger");
    }
    $("#warning-section .alert").show();

}

function updateGettingStatus(status, initializingPopup) {
    if (status == "ok") {
        if (initializingPopup)
            return;

        $("#sites-list li").remove();
        $('#activities').html("");
        $("#warning-section SPAN").html("Behold your fresh web browsing stats.");
        $("#warning-section STRONG").html("Hell yeah!");
        $("#warning-section .alert").addClass("alert-success");
        $("#warning-section .alert").removeClass("alert-danger");
    } else {
        $("#warning-section SPAN").html("An error happened trying to get Web Activity summary. Try again later, please.");
        $("#warning-section STRONG").html("Oh my!");
        $("#warning-section .alert").removeClass("alert-success");
        $("#warning-section .alert").addClass("alert-danger");
    }
    $("#warning-section .alert").show();
}

function sendWebActivity() {
    $("#sendWebActivity").html("Sending...");
    $("#sendWebActivity").addClass("grey");

    chrome.extension.sendRequest({
        action: "sendWebActivity"
    }, function (response) {
        if (response) {
            updateSendingStatus(response.result, false);

            if (response.result == "ok") {
                $("#sendWebActivity").html("Nothing to Send");
                $("#sendWebActivity").addClass("grey");
            } else {
                $("#sendWebActivity").html("<i class=\"fa fa-send\"></i>Send stats");
                $("#sendWebActivity").removeClass("grey");
            }
        }
    });
}

function updateHistorySummary(webActivitySummary) {
    var sortedSites = new Array();
    var totalTime = webActivitySummary.Total.Duration;

    /* Show only the top 5 sites by default */
    var max = 5;

    var firstVisitDisplay = function () {
        return moment(this.FirstVisit).fromNow();
    };

    var lastVisitDisplay = function () {
        return moment(this.LastVisit).fromNow();
    };

    $.get('templates/summary.mst', function (template) {
        var i = 0;
        $('#sites-list').html("");
        for (var i = 0; i < webActivitySummary.Data.length; i++) {
            if (i == max && document.location.href.indexOf("show=all") == -1)
                break;

            webActivitySummary.Data[i].SiteRelativePercentage = webActivitySummary.Data[i].Total.Duration * 100 / totalTime;
            webActivitySummary.Data[i].SiteRelativePercentageDisplay = Math.round((webActivitySummary.Data[i].SiteRelativePercentage * 100)) / 100 + "%";
            webActivitySummary.Data[i].FirstVisitDisplay = firstVisitDisplay
            webActivitySummary.Data[i].LastVisitDisplay = lastVisitDisplay;

            var html = Mustache.to_html(template, webActivitySummary.Data[i]);
            $('#sites-list').append(html);
        }

        $.each($('#sites-list img'), function () {
            $($(this)[0]).load(function () {
                if ($(this)[0].height > 0 && $(this)[0].width > 0) {
                    var colorThief = new ColorThief();
                    var color = colorThief.getColor($(this)[0]);

                    $(this).parent("li").css("border-left-color", "rgb(" + color[0] + "," + color[1] + "," + color[2] + ")");
                }
            });
        });

        $.get('templates/activities.mst', function (template) {
            $('#activities').html("");
            var data = {};
            data.navigationDuration = webActivitySummary.Navigation.Percentage;
            data.debuggingDuration = webActivitySummary.Debugging.Percentage;
            data.debuggerDuration = webActivitySummary.Debugger.Percentage;

            data.navigationPercentage = webActivitySummary.Navigation.PercentageDisplay;
            data.debuggingPercentage = webActivitySummary.Debugging.PercentageDisplay;
            data.debuggerPercentage = webActivitySummary.Debugger.PercentageDisplay;

            var html = Mustache.to_html(template, data);
            $('#activities').append(html);
            $("#activitiesTitle").html("Activities history summary");
            $("#visited-sites-title").html("All visited sites from " + moment(webActivitySummary.FirstVisit).fromNow() + " to " + moment(webActivitySummary.LastVisit).fromNow());
        });
    });

    /* Add an option to show all stats */
    var showAllLink = $("#show-all");

    showAllLink.click(function () {
        chrome.tabs.create({
            url: "popup.html?show=all"
        });
    });

    /* Show the "Show All" link if there are some sites we didn't show. */
    $("#show-all").hide();
    if (document.location.href.indexOf("show=all") == -1) {
        showAllLink.attr("href", "javascript:void(0)");
        $("#show-all").show();
    }
}

function getWebActivity() {
    $("#getWebActivity").html("Getting...");
    $("#getWebActivity").addClass("disabled");
    $("#getWebActivity").removeClass("btn-info");

    chrome.extension.sendRequest({
        action: "getWebActivity"
    }, function (response) {
        if (response) {
            updateGettingStatus(response.result, false);

            if (response.result == "ok") {
                updateHistorySummary(response.data);

                $("#getWebActivity").html("<i class=\"fa fa-bar-chart-o\"></i> See history summary");
                $("#getWebActivity").removeClass("disabled");
                $("#getWebActivity").addClass("btn-info");
            } else {

            }
        }
    });
}

function clearStats() {
    console.log("Request to clear stats.");
    chrome.extension.sendRequest({
        action: "clearStats"
    }, function (response) {
        initialize();
        $("#sites-list li").remove();
        $('#activities').html("");
    });
}

function togglePause() {
    console.log("In toggle pause");
    console.log("Value = " + localStorage["paused"]);

    if (localStorage["paused"] == "false") {
        console.log("Setting to Resume");
        chrome.extension.sendRequest({
            action: "pause"
        }, function (response) {});
        document.getElementById("toggle_pause").innerHTML = "<i class='fa fa-play'></i>Send stats automatically";
        $("#stats-automatic").html("Stats will not be sent automatically.");
        $("#toggle_pause").removeClass("black");
        $("#toggle_pause").addClass("red");
    } else if (localStorage["paused"] == "true") {
        console.log("Setting to Pause");
        chrome.extension.sendRequest({
            action: "resume"
        }, function (response) {});
        document.getElementById("toggle_pause").innerHTML = "<i class='fa fa-pause'></i>Stop sending stats automatically";
        $("#stats-automatic").html("Stats will be sent every hour automatically.");
        $("#toggle_pause").removeClass("red");
        $("#toggle_pause").addClass("black");
    }
}

function initialize() {
    var groupedIdle = groupIdleHistory();
    var historyHTML = "";

    if (groupedIdle) {
        for (var i = 0; i < groupedIdle.Data.length; i++) {
            var width = (groupedIdle.Data[i].Duration * 100) / groupedIdle.TotalDuration;
            var title = "Being " + secondsToTime(groupedIdle.Data[i].Duration / 1000) + " " + groupedIdle.Data[i].Status.toUpperCase();
            title += "&#10;From: " + moment(new Date(groupedIdle.Data[i].From)).format('MMMM Do YYYY, h:mm:ss a');
            title += " To: " + moment(new Date(groupedIdle.Data[i].End)).format('MMMM Do YYYY, h:mm:ss a');

            historyHTML += "<div title='" + title + "' class='history " + groupedIdle.Data[i].Status + "' style='width:" + width + "%;'>" + groupedIdle.Data[i].Status.toUpperCase() + "</div>";
        }
    }

    $("#idle-history").html(historyHTML);

    var stats = document.getElementById("stats");

    $("#warning-section .alert").hide();

    if (stats.childNodes.length == 1) {
        stats.removeChild(stats.childNodes[0]);
    }

    if (localStorage["storageType"] == "local") {
        updateLocalStats();
    }

    var link = document.getElementById("toggle_pause");

    if (localStorage["paused"] == undefined || localStorage["paused"] == "false") {
        localStorage["paused"] = "false";
        link.innerHTML = "<i class='fa fa-pause'></i>Stop sending stats automatically";
        $("#stats-automatic").html("Stats will be sent every hour automatically.");

        $("#toggle_pause").removeClass("red");
        $("#toggle_pause").addClass("black");
    } else {
        link.innerHTML = "<i class='fa fa-play'></i>Send stats automatically";
        $("#stats-automatic").html("Stats will not be sent automatically.");

        $("#toggle_pause").removeClass("black");
        $("#toggle_pause").addClass("red");
    }

    var nextClearStats = localStorage["nextTimeToClear"];

    if (nextClearStats) {
        nextClearStats = parseInt(nextClearStats, 10);
        nextClearStats = new Date(nextClearStats);

        var nextClearDiv = document.getElementById("nextClear");

        if (nextClearDiv.childNodes.length == 1) {
            nextClearDiv.removeChild(nextClear.childNodes[0]);
        }
        nextClearDiv.appendChild(
            document.createTextNode("Next Reset: " + nextClearStats.toString()));
    }

    getCurrentVersion();
    getStackOverflowData();
    getUserStoredProfile();

    if (localStorage.sendingData == "true") {
        $("#sendWebActivity").html("Sending...");
        $("#sendWebActivity").addClass("grey");
    } else {
        $("#sendWebActivity").html("<i class=\"fa fa-send\"></i>Send stats");
        $("#sendWebActivity").removeClass("grey");
    }

    updateSendingStatus(localStorage.lastUpdateStatus, true);
    setLastUpdate();

    $('#myTab a').click(function (e) {
        e.preventDefault()
        $(this).tab('show')
    })
}

var dom = "";
var tagsQuery = "";

function getStackOverflowData() {
    chrome.tabs.getSelected(null, function (tab) {
        chrome.tabs.sendMessage(tab.id, {
            method: "get-dom"
        }, function (response) {
            $("#search-column").hide();

            if (response) {
                dom = response.dom;
                var tags = $(dom).find(".post-taglist a").map(function () {
                    return this.innerText
                });

                if (tags.length) {
                    for (var i = 0; i < tags.length; i++) {
                        tagsQuery += tags[i] + " ";
                    }

                    useTagsForQuery();

                    getStackOverflowTitle();

                    $("#toggle-mode-query").show();
                    $("#search-column").show();
                } else {
                    if ($(dom).find(".textbox")[0]) {
                        var searchTextbox = $(dom).find(".textbox")[0].value;

                        $("#stackoverflow-tags").val(searchTextbox);
                        $("#search-column").show();
                        $("#toggle-mode-query").hide();
                    } else {
                        $("#search-column").show();
                        $("#toggle-mode-query").hide();
                    }
                }
            } else {
                $("#search-column").show();
                $("#toggle-mode-query").hide();
            }
        });
    });
}


var title = "";

function useTitleForQuery() {
    $("#stackoverflow-tags").val(title);
    $("#toggle-mode-query").html("Use question TAGS for query");
}

function useTagsForQuery() {
    $("#stackoverflow-tags").val(tagsQuery);
    $("#toggle-mode-query").html("Use question TITLE for query");
}

function getStackOverflowTitle() {
    $("#search-column").hide();

    title = $(dom).find("#question-header a").map(function () {
        return this.innerText
    })[0];

    if (title) {
        $("#search-column").show();
    }
}

document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("clear").addEventListener("click", clearStats);
    document.getElementById("sendWebActivity").addEventListener("click", sendWebActivity);
    document.getElementById("toggle_pause").addEventListener("click", togglePause);
    document.getElementById("getWebActivity").addEventListener("click", getWebActivity);
    document.getElementById("seeCurrentActivity").addEventListener("click", initialize);

    $(".btn-hover").mouseenter(function () {
        $(this).html("<i class=\"fa " + $(this).data("icon") + "\"></i> " + $(this).data("label"));
    });

    $(".btn-hover").mouseleave(function () {
        $(this).html("<i class=\"fa " + $(this).data("icon") + "\"></i> ...");
    });

    $("#launch-google-search").click(function () {
        chrome.tabs.create({
            url: "http://www.google.com/#q=" + encodeURIComponent($("#stackoverflow-tags").val())
        });
    })

    $("#launch-stackoverflow-search").click(function () {
        chrome.tabs.create({
            url: "http://stackoverflow.com/search?q=" + encodeURIComponent($("#stackoverflow-tags").val())
        });
    })

    $("#toggle-mode-query").click(function () {
        if ($("#toggle-mode-query").html() == "Use question TITLE for query") {
            useTitleForQuery();
        } else {
            useTagsForQuery();
        }
    });

    initialize();
});