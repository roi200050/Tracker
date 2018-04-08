var debug = false;

var allData = JSON.parse(sessionStorage.allData || '[]');
var followTrades = {};
var stopOperationTimeouts = {};
var lostData = false;

var playback = {
    seedDataLoaded: false
};

var lastData = null;
var countNotChanged = 0;
var changed = true;

function dataSeeker() {
    if (playback.seedDataLoaded)
        return;

    if (debug)
        return;

    d3.xhr('/datum').get(function (err, rawData) {
        changed = lastData !== +rawData.response && +rawData.response !== 0;
        lastData = +rawData.response;
        if (!changed) {
            countNotChanged++;
        }
        if (changed) {
            countNotChanged = 0;
        }
        if (countNotChanged < 120) { // record only if changed in a time of 2 minutes
            manipulateDatum(+rawData.response);
        }
    }).on("error", function (err) {
        console.log("failed to fetch data from recorder");
        console.error(err.stack);
    });
}

var previousSecond = 0;

function manipulateDatum(datum, date) {
    if (datum <= 0 || isNaN(datum + 1)) return;
    date = date || new Date();

    // align first minute
    if (!sessionStorage.current && (date.getSeconds() != 0 && previousSecond != 59)) {
        previousSecond = date.getSeconds();
        return;
    }
    date.setSeconds(0);
    date.setMilliseconds(0);

    var current;
    if (!sessionStorage.current) {
        current = {
            date: date.toLocaleString("en-US"),
            open: datum,
            high: datum,
            low: datum,
            close: ""
        };
        sessionStorage.current = JSON.stringify(current);
        sessionStorage.latestDatum = JSON.stringify(datum);
    } else {
        current = JSON.parse(sessionStorage.current);
        var latestMin = new Date(current.date).getMinutes(),
            latestDatum = JSON.parse(sessionStorage.latestDatum);

        if (latestDatum > current.high) {
            current.high = latestDatum;
        } else if (latestDatum < current.low) {
            current.low = latestDatum;
        }

        sessionStorage.current = JSON.stringify(current);
        var currMin = date.getMinutes();

        if (latestMin != currMin) {
            // Close previous
            current.close = latestDatum;

            addData([current]);

            // Add previous to ohlcData
            insertToLocalStorage(current);

            try {
                addAvgDatum();
            } catch (ex) {
                console.log(ex);
                console.error(ex.stack);
            }

            // Open new candle
            var newCandle = {
                date: date.toLocaleString("en-US"),
                open: datum,
                high: datum,
                low: datum,
                close: ""
            };

            sessionStorage.current = JSON.stringify(newCandle);
        }

        //refresh();
        refreshCandles();
        sessionStorage.latestDatum = JSON.stringify(datum);
    }

    refreshCurrentCandle();
}

function insertToLocalStorage(datum) {
    var currWindow = dataWindow.current || 20,
        data = JSON.parse(sessionStorage.ohlcData || '[]');

    data.push(datum);

    if (data.length > currWindow) {
        data.splice(0, data.length - currWindow);
    }

    allData.push(datum);

    sessionStorage.ohlcData = JSON.stringify(data);
    sessionStorage.allData = JSON.stringify(allData);
    if (!scrolling)
        updateSlider();
}

// Aligns the data to the close real-time minute for initialization
function dataCalibrate() {
    sessionStorage.ohlcData = JSON.stringify([]);
    sessionStorage.removeItem('current');

    // return;
    // if (debug) {
    //     var data = [],
    //         initDate = new Date();

    //     initDate.setSeconds(0);
    //     var dev = 50;
    //     for (var i = 0; i < 20; i++) {
    //         var datum = {
    //             date: initDate.toLocaleString("en-US"),
    //             open: "1.61" + Math.floor(Math.random() * dev),
    //             high: "1.61" + Math.floor(Math.random() * dev),
    //             low: "1.61" + Math.floor(Math.random() * dev),
    //             close: "1.61" + Math.floor(Math.random() * dev)
    //         };

    //         datum.high = Math.max(Number(datum.open), Number(datum.close), Number(datum.high)).toString();
    //         datum.low = Math.min(Number(datum.open), Number(datum.close), Number(datum.low)).toString();

    //         data.push(datum);
    //         sessionStorage.latestDatum = JSON.stringify(datum);
    //         initDate = new Date(initDate.getTime() - 60000);
    //     }

    //     sessionStorage.current = JSON.stringify(data[0]);
    //     sessionStorage.ohlcData = JSON.stringify(data);
    //     addData(data);
    //     refresh();
    //     refreshCurrent();
    // } else {
    //     var xhr = new XMLHttpRequest();
    //     xhr.open('POST', '/findData', true);
    //     xhr.setRequestHeader("Content-type", "application/json");
    //     xhr.onreadystatechange = function() {
    //         if (xhr.readyState == 4 && xhr.status == 200) {
    //             sessionStorage.allData = xhr.responseText;
    //             var data = JSON.parse(xhr.responseText);
    //             if (data && data.length > dataWindow.current) {
    //                 data.splice(0, data.length - dataWindow.current);
    //             }
    //             sessionStorage.ohlcData = JSON.stringify(data);
    //             addData(data);
    //             refresh();
    //         }
    //     };
    //     xhr.send(JSON.stringify({
    //         seed: new Date().toLocaleDateString(),
    //         minuteSeed: "00:00"
    //     }));
    // }
}

function loadSeedData() {
    if (playback.seedDataLoaded) { // click on stop button
        d3.select('#btnPlay').attr('class', 'glyphicon glyphicon-play');
        playback.seedDataLoaded = false;
        clearInterval(bgRecordFeeder);
        clearInterval(bgGraphRefresher);

        if (confirm("Playback stopped. Back to normal stream?")) {
            resetOhlcGraph();
            bgDataFeeder = setInterval(dataSeeker, 1000);
            bgGraphRefresher = setInterval(graphRefreshInterval, 500);
            var alertBox = document.getElementById("alertControls")
            console.log(alertBox);
            while (alertBox.children.length != 1) {   
                alertBox.removeChild(alertBox.lastChild);
            }
            //hide the red ring
            var $element = $('body[ng-controller="HomeController"]');
            var $scope = angular.element($element).scope();
            $scope.$apply(function () {
                $scope.isAlert = false;
            });
            $scope.$apply();
        }
        return;
    }
    playback.seedDataLoaded = true; // click on play button
    var timePattern = RegExp('^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$'),
        dateSeed = d3.select('#dateSeed').node().value,
        timeSeed = d3.select('#timeSeed').node().value,
        timeSpeed = +d3.select('#timeSpeed').node().value || 1;

    if (timePattern.test(timeSeed)) {
        d3.select('#btnPlay').attr('class', 'glyphicon glyphicon-stop');
        executeAlgorithmByDate(dateSeed);
        var xhr = new XMLHttpRequest();
        xhr.open('POST', '/findData', true);
        xhr.setRequestHeader("Content-type", "application/json");
        xhr.onreadystatechange = function () {
            if (xhr.readyState == 4 && xhr.status == 200) {
                var data = JSON.parse(xhr.responseText);
                playback.seedData = data.seed_data;
                playback.seedTrades = data.seed_trades.sort(function (a, b) {
                    var date_a = dateTimeStringToDate(a.day, a.init_date),
                        date_b = dateTimeStringToDate(b.day, b.init_date);
                    return date_a - date_b;
                });
                playback.seedMarks = data.seed_marks.sort(function (a, b) {
                    var date_a = dateTimeStringToDate(a.day, a.date),
                        date_b = dateTimeStringToDate(b.day, b.date);
                    return date_a - date_b;
                });

                playback.seedInfo = {
                    dayIndex: 0,
                    minuteIndex: 0,
                    secondIndex: 0
                };

                playback.seedDateTime = {};

                stop();
                resetOhlcGraph();
                bgRecordFeeder = setInterval(localDataSeeker, 1000 / timeSpeed);
                bgGraphRefresher = setInterval(graphRefreshInterval, 500);

            }
        };
        xhr.send(JSON.stringify({
            seed: dateSeed,
            minuteSeed: timeSeed
        }));
    }
}

// Loads candles starting at upperTimeLimit and older to restore old candles
function loadCandleDataByTime(upperTimeLimit, candlesCountToLoad) {
    oldCandleDataRestoreInProgress = true;
    d3.text('/graph/getCandlesDataByTime')
        .header("Content-type", "application/json")
        .post(JSON.stringify({
                upperTimeLimit: upperTimeLimit,
                candlesCountToLoad: candlesCountToLoad
            }),
            function (err, rawData) {
                oldCandleDataRestoreInProgress = false;
                var candles = JSON.parse(rawData);
                if (candles && candles.length) {
                    allData = candles.concat(allData);
                    sessionStorage.allData = JSON.stringify(allData);
                    addData(allData);
                }
            }).on("error", function (err) {
            oldCandleDataRestoreInProgress = false;
            console.log("failed to load old candle data. [ohlcHandler.loadCandleDataByTime]");
            console.error(err);
        });
}

function localDataSeeker() {
    try {
        var dayIndex = playback.seedInfo.dayIndex,
            minuteIndex = playback.seedInfo.minuteIndex,
            secondIndex = playback.seedInfo.secondIndex,
            now = dateTimeStringToDate(playback.seedData[dayIndex].date, playback.seedData[dayIndex].values[minuteIndex].date);

        seed = now;
        manipulateDatum(playback.seedData[dayIndex].values[minuteIndex].all[secondIndex].value, now);

        var inc_second = false;


        // Trades were made during this day
        if (playback.seedTrades.length > 0) {
            var trade = playback.seedTrades[0],
                trade_date = dateTimeStringToDate(trade.day, trade.init_date);

            // initialize current dateTime
            if (!playback.seedDateTime.dateTime)
                playback.seedDateTime.dateTime = now;

            // console.log('trade_date', trade_date);
            // console.log('dateTime', playback.seedDateTime.dateTime);

            // trade 
            if (trade_date.getTime() === playback.seedDateTime.dateTime.getTime()) {
                addOperationToGraph({
                    serial_number: trade._id,
                    type: trade.operation,
                    open_date: trade_date,
                    end_date: dateTimeStringToDate(trade.end_date),
                    open_price: parseFloat(trade.init_value),
                    succeeded: trade.status === 1,
                    is_replay: true
                }, trade.follow);
                console.log('Operation was added to graph: ', trade.init_date);
                playback.seedTrades.shift();
            } else if (trade_date < playback.seedDateTime.dateTime) // remove earlier trades from array
                playback.seedTrades.shift();

            inc_second = true;

            // check if there was a network problem so there was no sequence in candles
            // if there was - fix current stream time 
            if (playback.seedDateTime.dateTime.getMinutes() !== now.getMinutes())
                playback.seedDateTime.dateTime = now;
        }

        if (playback.seedMarks.length > 0) {
            var mark = playback.seedMarks[0],
                mark_date = dateTimeStringToDate(mark.day, mark.date);

            // initialize current dateTime
            if (!playback.seedDateTime.dateTime)
                playback.seedDateTime.dateTime = now;

            // console.log('trade_date', trade_date);
            // console.log('dateTime', playback.seedDateTime.dateTime);

            if (mark_date.getTime() === playback.seedDateTime.dateTime.getTime()) {
                addMarkToGraph({
                    date: mark_date,
                    configuration: mark.configuration,
                    price: parseFloat(mark.value)
                });
                console.log('Mark was added to graph: ', mark.date);
                playback.seedMarks.shift();
            } else if (mark_date < playback.seedDateTime.dateTime) // remove earlier marks from array
                playback.seedMarks.shift();
            inc_second = true;

            // check if there was a network problem so there was no sequence in candles
            // if there was - fix current stream time 
            if (playback.seedDateTime.dateTime.getMinutes() !== now.getMinutes())
                playback.seedDateTime.dateTime = now;
        }

        if (inc_second) {
            // increment current dateTime by 1 second
            playback.seedDateTime.dateTime.setSeconds(playback.seedDateTime.dateTime.getSeconds() + 1);
        }

        if (playback.seedData[dayIndex].values[minuteIndex].all[secondIndex + 1]) {
            playback.seedInfo.secondIndex++;
        } else if (playback.seedData[dayIndex].values[minuteIndex + 1]) {
            playback.seedInfo.secondIndex = 0;
            playback.seedInfo.minuteIndex++;
        } else if (playback.seedData[playback.seedInfo.dayIndex + 1]) {
            playback.seedInfo.secondIndex = 0;
            playback.seedInfo.minuteIndex = 0;
            playback.seedInfo.dayIndex = 0;
        } else {
            clearInterval(bgRecordFeeder);
            console.log('got here');
            if (confirm("No more data was loaded. Back to normal stream?")) {
                resetOhlcGraph();
                toggleStream();
            }
        }
    } catch (ex) {
        console.error(ex.stack);
        clearInterval(bgRecordFeeder);
        console.log('got here2');
        if (confirm("No more data was loaded. Back to normal stream?")) {
            resetOhlcGraph();
            toggleStream();
        }
    }
}

var streamIsActive = false;

function toggleStream() {
    if (!streamIsActive) {
        streamIsActive = true;
        bgDataFeeder = setInterval(dataSeeker, 1000);
        startAutoMarksListener();
        $('#btnStream').attr('class', 'glyphicon glyphicon-pause');
    } else {
        $('#btnStream').attr('class', 'glyphicon glyphicon-play');
        streamIsActive = false;
        clearInterval(bgDataFeeder);
        stopAutoMarksListener();
    }
}

var executeAlgorithmRequestInProgress = false;

function executeAlgorithmByDate(date) {

    if (executeAlgorithmRequestInProgress) return;

    executeAlgorithmRequestInProgress = true;

    d3.xhr('/graph/executeAlgorithmByDate').header("Content-Type", "application/json")
        .post(JSON.stringify({
            date: date
        }), function (err, xhr) {
            executeAlgorithmRequestInProgress = false;
        });
}

function cleanDBData(dbData) {
    var cleanData = [];
    for (var day = 0; day < dbData.length; day++) {
        for (var minute = 0; minute < dbData[day].values.length; minute++) {
            var minuteData = dbData[day].values[minute];
            cleanData.push({
                date: new Date(dbData[day].date + ' ' + minuteData.date).toLocaleString("en-US"),
                open: minuteData.open,
                high: minuteData.high,
                low: minuteData.low,
                close: minuteData.close
            });
        }
    }
    return cleanData;
}

function resetOhlcGraph() {
    clearGraph();
    sessionStorage.ohlcData = JSON.stringify([]);
    allData = [];
    followTrades = {};
    sessionStorage.allData = JSON.stringify([]);
    sessionStorage.removeItem('current');
}

function escapeRegExp(string) {
    return string.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
}

function replaceAll(string, find, replace) {
    return string.replace(new RegExp(escapeRegExp(find), 'g'), replace);
}

function dateTimeStringToDate(date, time) {
    return new Date(replaceAll(date, '-', '/') + ' ' + (time ? time : date));
}