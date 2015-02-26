var guid = (function () {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
                   .toString(16)
                   .substring(1);
    }
    return function () {
        return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
               s4() + '-' + s4() + s4() + s4();
    };
})();

String.prototype.toHHMMSS = function () {
    var sec_num = parseInt(this, 10); // don't forget the second param
    var hours = Math.floor(sec_num / 3600);
    var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
    var seconds = sec_num - (hours * 3600) - (minutes * 60);

    if (hours < 10) { hours = "0" + hours; }
    if (minutes < 10) { minutes = "0" + minutes; }
    if (seconds < 10) { seconds = "0" + seconds; }
    var time = hours + ':' + minutes + ':' + seconds;
    return time;
}

function groupIdleHistory() {
    var idleHistory = JSON.parse(localStorage.idleHistory);

    if (!idleHistory[0])
        return;

    var groupedIdleHistory = {};

    groupedIdleHistory.Data = [];

    var currentStatus = idleHistory[0].status;
    var start = idleHistory[0].timeStamp;
    var end;
    var durationSum = 0;

    for (var i = 0; i < idleHistory.length; i++) {
        if (currentStatus != idleHistory[i].status) {
            end = idleHistory[i].timeStamp;
            var duration = new Date(end) - new Date(start);
            durationSum += duration;

            groupedIdleHistory.Data.push({ From: start, End: end, Status: currentStatus, Duration: duration });

            start = new Date(idleHistory[i].timeStamp);
            end = new Date(idleHistory[i].timeStamp);
            currentStatus = idleHistory[i].status;
        }

        if (i == idleHistory.length-1)
        {
            end = new Date(idleHistory[i].timeStamp);
            var duration = new Date(end) - new Date(start);
            durationSum += duration;
            groupedIdleHistory.Data.push({ From: start, End: end, Status: currentStatus, Duration: duration });
        }
    }

    groupedIdleHistory.TotalDuration = durationSum;

    return groupedIdleHistory;
}

var formatTime = function (unixTimestamp) {
    var dt = new Date(unixTimestamp * 1000);

    var hours = dt.getHours();
    var minutes = dt.getMinutes();
    var seconds = dt.getSeconds();

    // the above dt.get...() functions return a single digit
    // so I prepend the zero here when needed
    if (hours < 10)
        hours = '0' + hours;

    if (minutes < 10)
        minutes = '0' + minutes;

    if (seconds < 10)
        seconds = '0' + seconds;

    return hours + ":" + minutes + ":" + seconds;
}

function secondsToTime(secs) {
    var hours = Math.floor(secs / (60 * 60));

    var divisor_for_minutes = secs % (60 * 60);
    var minutes = Math.floor(divisor_for_minutes / 60);

    var divisor_for_seconds = divisor_for_minutes % 60;
    var seconds = Math.ceil(divisor_for_seconds);

    if (hours < 10)
        hours = '0' + hours;

    if (minutes < 10)
        minutes = '0' + minutes;

    if (seconds < 10)
        seconds = '0' + seconds;

    return hours + ":" + minutes + ":" + seconds;
}