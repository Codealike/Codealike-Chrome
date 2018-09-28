var currentUsername = "";

function getUserProfile(username) {
    try {
        var xhr = new XMLHttpRequest();
        var url = chrome.extension.getBackgroundPage().apiRoot + "/api/v2/account/" + username + "/profile";
        var userData = JSON.parse(localStorage["userData"])
        var tokenValues = userData.token.split("/");
        var identity = tokenValues[0];
        var token = tokenValues[1];

        $.ajax({
            type: "GET",
            url: url,
            contentType: "application/json",
            dataType: "json",
            beforeSend: function (request) {
                request.setRequestHeader("X-Api-Identity", identity);
                request.setRequestHeader("X-Api-Token", token);
                localStorage.sendingData = "true";
            },
            complete: function (data, textStatus, jqXHR) {
                localStorage.sendingData = "false";

                if (data.responseJSON.Message === undefined) {
                    currentUsername = data.responseJSON.Identity;
                    $('#avatar').attr("src", data.responseJSON.AvatarUri);
                } else {
                    return {
                        error: "Not authorized or invalid token."
                    };
                }
            }
        });
    } catch (e) {
        return {
            error: e.message
        };
    }
}

function getUsersStatus() {
    var usernames = ["soke"];

    $.ajax({
        type: "POST",
        url: chrome.extension.getBackgroundPage().apiRoot + "/api/v2/public/CanInterruptUser",
        data: JSON.stringify({
            UserNames: usernames
        }),
        contentType: "application/json",
        dataType: "json"
    }).done(function (success) {

        $(".circle-status").addClass("grey");

        for (var i = 0; i < success.length; i++) {
            var username = success[i].m_Item1.replace(/\./g, "");
            var result = success[i].m_Item2;

            defineInterruptionStatusUI(username, result);
        }
    });
}

$(document).ready(function () {
    $(".panel").shapeshift({
        minColumns: 3
    });
    $('#username').keypress(function (e) {
        if (e.which == 13) {
            var username = $.trim(($('#username').val())).toLowerCase();
            getUserProfile(username);
            window.setInterval(getUsersStatus, 1000);
            return false;
        }
    });
});