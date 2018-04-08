/**
 * Created by avihay on 24/07/2015.
 *
 */
// the recorder saves price data for each day inside the DB
// also open the selected website to take updated price data
var http = require('http'),
    https = require('https'),
    winston = require('winston')
	dateUtils = require('../utils/dateUtils');

var recorder = function() {},
    today = null,
    currMinute,
    daySchema,
    dataStorage,
    lastMinute = "23:59:00";

// Where to get the information from
var fetch = webSeekerFetch;
var optionTime = {
    ready: false,
    init: initActiveWebSeeker,
    fetch: webSeekerFetch,
    url: "https://www.optiontime.com",
    //query: "angular.element('[data-rtr-symbol=\"EUR/USD\"]').siblings()[0].innerHTML.match('[0-9]{1}.[0-9]{5}')[0]",
    query: function() {
        try {
            return $('.quote .quote--value', $('iframe')[2].contentDocument)[0].textContent;
        } catch (ex) {
            return null;
        }
    },
    cleanup: cleanActiveWebSeeker
};

var topOption = {
    ready: false,
    init: initActiveWebSeeker,
    fetch: webSeekerFetch,
    url: "https://topoption.com",
    //query: "angular.element('[data-rtr-symbol=\"EUR/USD\"]').siblings()[0].innerHTML.match('[0-9]{1}.[0-9]{5}')[0]",
    query: function() {
        try {
            return $('.quote .quote--value', $('iframe')[2].contentDocument)[0].textContent;
        } catch (ex) {
            return null;
        }
    },
    cleanup: cleanActiveWebSeeker
};

var tradeOption = {
    ready: false,
    init: initActiveWebSeeker,
    fetch: webSeekerFetch,
    url: "https://trade.24option.com/24option/#Trade",
    query: function() {
		// Was changed at 06/02/2017
        //return $('.option_row_asset_label[title="EUR/USD"]').parent().next().next()[0].textContent;
		
		// Was changed at 13/03/2017
		//return $("[title='EUR/USD']").next().next().text();
		
		//$("[id='swPandaIframe']").contents().find("[id='FOREX']").next().click()
		
		
		if (!$.initializedPandaIFrame && ($("[id='swPandaIframe']").contents().find("tr td:contains('EURUSD')").next().text().substr(0,8)) == ""){
            $("[id='swPandaIframe']").contents().find("[id='FOREX']").next().click();
			$.initializedPandaIFrame = true;
		}

		return $("[id='swPandaIframe']").contents().find("tr td:contains('EURUSD')").next().text().substr(0,8);
    },
    cleanup: cleanActiveWebSeeker
};

var tradeRush = {
    ready: false,
    init: initActiveWebSeeker,
    fetch: webSeekerFetch,
    url: "http://www.traderush.com/",
    query: function() {
        try {
            return $('#feed_asset_1').text();
        } catch (ex) {
            return null;
        }
    },
    cleanup: cleanActiveWebSeeker
};

// Where to take the data from
var fetchSource = tradeOption,
    browser;

// opens the browser
function initActiveWebSeeker(next) {
    var selenium = require("selenium-webdriver/chrome"),
        options = new selenium.Options(),
        service = new selenium.ServiceBuilder().build();
  
    //options = options.setChromeBinaryPath('F:\\Program Files\\chrome-win32\\chrome.exe');

    options.addArguments(["--disable-web-security", "-incognito"]);
    var driver = new selenium.Driver(options, service);
    driver.get(fetchSource.url).then(function() {
        browser = driver;
        fetchSource.ready = true;
        console.log("Ready to fetch the data.");
    });
}

// fetch data from browser
var alignedFirstMinute = false;

var lastData = null;
var countNotChanged = 0;
var countNotChangedRestart = 0;
var changed = true;

function webSeekerFetch() {
    try {
        if (!alignedFirstMinute && new Date().getSeconds() == 0) alignedFirstMinute = true;
        if (fetchSource.ready && alignedFirstMinute) {
            browser.executeScript(fetchSource.query).then(function(datum) {
                if (datum && !isNaN(+datum)){
                  changed = lastData !== +datum;
                  lastData = +datum;
                  if (!changed) {
                    countNotChanged++;
                    countNotChangedRestart++;
                  }
                  if (changed) {
                    countNotChanged = 0;
                    countNotChangedRestart = 0;
                  }
                  if (countNotChanged < 120) { // record only if changed in a time of 2 minutes
                    recorderLogic(+datum);
                  }
                  else if (thisRecorder && countNotChangedRestart >= 120){
                    countNotChangedRestart = 0;
                    countNotChanged = 0;
                    return thisRecorder.restart();
                  }
                }
            }, function (err){
				winston.info('Error on webseeker fetch ' + err);
				process.exit();
			});
        }
    } catch (ex) {
		winston.info('Exception thrown on webseeker fetch ' + ex);
        console.error(ex);
		process.exit();
    }
}

// closes the browser
function cleanActiveWebSeeker() {
    if (fetchSource.ready) {
        browser.quit();
        fetchSource.ready = false;
    }
}

// logic of recording and saving a new datum
function recorderLogic(datum) {
    dataStorage.locals.datum = datum;
    var nowMinute = new Date();
    nowMinute.setSeconds(0);
    nowMinute = dateUtils.formatTime(nowMinute);

    if (!currMinute || !currMinute.date) return;

    // Minute passed
    if (currMinute.date != nowMinute) {
        if (currMinute.all.length > 50) {
            currMinute.close = currMinute.all[currMinute.all.length - 1].value;

            if (today != null) {

                var newCandleToEmit = {
                    high: currMinute.high,
                    low: currMinute.low,
                    open: currMinute.open,
                    close: currMinute.close,
                    date: today.date + ' ' + currMinute.date
                };

                daySchema.update({
                    _id: today._id
                }, {
                    $push: {
                        values: currMinute
                    }
                }, function(err) {
                    if (err)
                        console.log("Could not push new minute. Details: " + err);
                    else {
                        emitNewCandleEvent(newCandleToEmit);
                    }
                });
                console.log("[DEBUG] Added new minute. ");
            } else {
                console.log("[ERROR] Could not save current minute. Today object is invalid. [Recorder]");
                initNewDay();
            }
            // var saved_day = today.date;

            /* today.save(function (err, rowsAffected) {
                if (!err) {
                    console.log("[INFO] Successfully stored day " + saved_day + " [Recorder]");
                } else {
                    if (!minuteChecksum(currMinute))
                        today.values.pop(currMinute);
                    winston.info('Could not store day ' + saved_day + "Details: " + err);
                    console.log("[ERROR] Could not store day [Recorder]. Details: ");
                    console.log(err);
                }

            });*/
            // initNewDay();
        }
        currMinute = getNewMinute(new Date());
        currMinute = addMinuteDatum(currMinute, new Date().getSeconds(), Number(datum));


        // Day passed
        if (currMinute.date == lastMinute || new Date().getDate() != new Date(today.date).getDate()) {
            

            // var saved_day = today.date;
            /* today.save(function (err, rowsAffected) {
                if (!err) {
                    winston.info('Successfully stored day' + saved_day);
                    console.log("[INFO] Successfully stored day " + saved_day + " [Recorder]");
                } else {
                    if (!minuteChecksum(currMinute))
                        today.values.pop(currMinute);
                    console.log("[ERROR] Could not store day [Recorder]. Details: ");
                    console.log(err);
                }
            }); */
            initNewDay();
        }
    }
    // Same minute
    else {
        // console.log("[DEBUG] Minute datum " + JSON.parse(chunk.toString().substr(3))[0].l);
        currMinute = addMinuteDatum(currMinute, new Date().getSeconds(), Number(datum));
    }
}

// initialization of a new day
function initNewDay() {
    today = null;
    if (!daySchema) {
        console.error("Day is undefined.");
        return false;
    } else {
        daySchema.findOne({
                date: dateUtils.formatDate(new Date())
            },
            function(err, day) {
                if (!err && day) {
                    today = day;
                    console.log("[INFO] Loaded today record from db. [Recorder]");
                } else {
                    today = new daySchema();
                    today.date = dateUtils.formatDate(new Date());
                    today.values = [];
                    if (err) console.error(err);
                    console.log("[INFO] Initialized new day record. [Recorder]");
                    today.save();
                }
            });
        currMinute = getNewMinute(new Date());
    }
    return true;
}

// initialization of a new minute
function getNewMinute(date) {
    date.setSeconds(0);
    return {
        date: dateUtils.formatTime(date),
        all: []
    };
}

// adding a datum to current minute
function addMinuteDatum(minute, second, datum) {
    if (isNaN(datum) || !datum) return;
    minute.all.push({
        second: second,
        value: datum
    });

    if (minute.all.length == 1) {
        minute.open = minute.high = minute.low = datum;
    } else {
        minute.low = Math.min(minute.low, datum);
        minute.high = Math.max(minute.high, datum);
    }

    if (second == 59) 
        minute.close = datum;

    return minute;
}

// checking data of a specific minute
function minuteChecksum(minuteData) {
    var length = minuteData.all.length,
        min = Number.MIN_VALUE,
        max = Number.MAX_VALUE;

    if (
        minuteData.all == undefined ||
        minuteData.open == undefined ||
        minuteData.close == undefined ||
        minuteData.high == undefined ||
        minuteData.low == undefined
    )
        return false;

    if (length == 0)
        return true;

    for (var i = 0; i < length; i++) {
        max = Math.max(minuteData.all[i].value, max);
        min = Math.min(minuteData.all[i].value, min);
    }

    return (
        (max == minuteData.high) &&
        (min == minuteData.low) &&
        (minuteData.open != minuteData.all[0]) &&
        (minuteData.close != minuteData.all[length - 1])
    );
}

var newCandleEventHandlers = [];

function emitNewCandleEvent(newCandle) {
    for (var i = 0; i < newCandleEventHandlers.length; i++){
        try {
            newCandleEventHandlers[i](newCandle);
        } catch (exception) {
            console.log("New Candle event handler threw an exception. Details: " + exception.message);
        }
    }
}

// recorder definition 
recorder.prototype = {
    'startRecording': function(schema, appStorage) { // start recording
        daySchema = schema;
        dataStorage = appStorage || {};
        if (initNewDay()) {
            if (fetch === webSeekerFetch) {
                fetchSource.init();
            }
            this.cancel = setInterval(fetch, 1000);
        }
    },
    'stopRecording': function() { // stop recording
        if (this.cancel)
            clearInterval(this.cancel);
    },
    'registerToNewCandleEvent': function (handler) {
        if (handler && typeof(handler) == 'function')
            newCandleEventHandlers.push(handler);
    },
    'cleanup': function() { // closing and cleanup
        if (today != null) {
            var saved_day = today.date;
            today.save(function(err, rowsAffected) {
                if (!err) {
                    console.log("[INFO] Successfully stored day " + saved_day + " [Recorder]");
                } else {
                    console.log("[ERROR] Could not store day [Recorder]. Details: ");
                    console.log(err);
                }

            });
            // console.log("Called save." + JSON.stringify(today));
        }

        if (fetch === webSeekerFetch)
            cleanActiveWebSeeker();
    },
    'restart': function() {
      this.stopRecording();
      this.cleanup();
      if (fetch === webSeekerFetch) {
          fetchSource.init();
      }
      this.cancel = setInterval(fetch, 1000);
    }
};

var thisRecorder = new recorder();

module.exports = thisRecorder;

// obsolete code for fetching data 
// Old fetchers
/*
 function fetchFromGoogleFinance () {
 http.get('http://www.google.com/finance/info?q=CURRENCY%3aEURUSD', function (res) {
 res.on('data', function (chunk) {
 recorderLogic(JSON.parse(chunk.toString().substr(3))[0].l);
 }).
 on("error", function (err) {
 console.log(err);
 });
 });
 }

 function fetchFromXE (){
 var request = http.get('http://www.xe.com/', function(res){
 res.on('data', function(chunk){
 try{
 var chunkStr = chunk.toString();
 var datum = chunkStr.match('USD,EUR,2,1\'>[0-9]\\.[0-9]{5}')[0].split('>')[1];
 request.abort();
 recorderLogic(datum);
 } catch (ex){

 }
 }).
 on('error', function(err){console.log(err);});
 });
 }
 */