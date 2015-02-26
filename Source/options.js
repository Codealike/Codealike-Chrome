function savePause() {
    var idleCheck = document.getElementById("pause_check");
    if (idleCheck.checked) {
        localStorage["paused"] = "false";
    } else {
        localStorage["paused"] = "true";
    }
}

function saveNavigation() {
    var idleCheck = document.getElementById("navigation_check");
    if (idleCheck.checked) {
        localStorage["trackNavigation"] = "true";
    } else {
        localStorage["trackNavigation"] = "false";
    }
}

function saveDebugging() {
    var idleCheck = document.getElementById("debugging_check");
    if (idleCheck.checked) {
        localStorage["trackDebugging"] = "true";
    } else {
        localStorage["trackDebugging"] = "false";
    }
}

$(document).ready(function () {
    var pauseCheck = document.getElementById("pause_check");
    var navigationCheck = document.getElementById("navigation_check");
    var dabuggingCheck = document.getElementById("debugging_check");

    pauseCheck.addEventListener("click", savePause);
    navigationCheck.addEventListener("click", saveNavigation);
    dabuggingCheck.addEventListener("click", saveDebugging);

    var pause = localStorage["paused"];

    if (!pause || pause == "false") {
        pauseCheck.checked = true;
    } else {
        pauseCheck.checked = false;
    }

    var trackNavigation = localStorage["trackNavigation"];

    if (!trackNavigation || trackNavigation == "false") {
        navigationCheck.checked = false;
    } else {
        navigationCheck.checked = true;
    }

    var trackDebugging = localStorage["trackDebugging"];

    if (!trackDebugging || trackDebugging == "false") {
        dabuggingCheck.checked = false;
    } else {
        dabuggingCheck.checked = true;
    }
});