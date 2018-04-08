/**
 * Created by avihay on 4/8/2017.
 */

(function (algorithmController) {

    var winston = require('winston');
    var algorithmUtils = require('../utils/algorithmUtils');
    var mongoHandler = require('../model/mongoHandler');
    var markUtils = require('../utils/markUtils');

    // Algorithm's Configuration
    var averageTypes = {
        'purple': {
            candleCount: 6
        },
        'orange': {
            candleCount: 10
        },
        'black': {
            candleCount: 20
        },
        'blue': {
            candleCount: 30
        },
        'brown': {
            candleCount: 50
        }
    };

    var maxCandleCount = 50;

    // avg : The moving averages, contains candle count and data, data is array of {date, value}

    var averagesData = [];

    var candleData = [];
    var lastCandleDate;
    var lastCandleIndex;
    var state = {
        consecutive: {
            up: 0,
            down: 0
        }
    };


    var averagesDataConfig = [{
        date: String,
        datum: Number,
        averages: {
            purple: Number,
            orange: Number,
            black: Number,
            blue: Number,
            brown: Number
        }
    }];

    function resetAlgorithmStructures() {
        candleData.splice(0, candleData.length);
        averagesData.splice(0, averagesData.length);
        lastCandleDate = null;
        lastCandleIndex = null;
        state = {
            consecutive: {
                up: 0,
                down: 0
            }
        };
        markUtils.resetAlgorithmStructures();
    }


    function addCandleEventHandler(candle) {
        var isFirstCandle = candleData.length == 0;
        var candleInconsistency = false;

        try {
            if (algorithmUtils.validateCandleData(candle) &&
                algorithmUtils.validateCandlesConsistency(candle, lastCandleDate, isFirstCandle)) {

                candleData.push(candle);
                lastCandleDate = candle.date;
                lastCandleIndex = candleData.length - 1;
                onNewCandleAdded(candle);
            } else {
                candleInconsistency = true;
            }
        } catch (validationException) {
            // Reset the average calculations?
            candleInconsistency = true;
            winston.log("Candle validation failed. Exception: " + validationException.message);
        }

        if (candleInconsistency)
            resetAlgorithmStructures();

    }

    function onNewCandleAdded(newCandle) {
        updateAverages(newCandle);
        updateState(newCandle);
        checkIntersections(newCandle.date);
    }

    function updateAverages(newCandle) {

        var currAverage = {
            'purple': 0,
            'orange': 0,
            'black': 0,
            'blue': 0,
            'brown': 0
        };

        for (var averageType in averageTypes) {
            var requiredCandleCount = averageTypes[averageType].candleCount;

            if (requiredCandleCount > candleData.length) continue;

            var sum = algorithmUtils.calculateSum(candleData, requiredCandleCount,
                candleData.indexOf(newCandle) + 1 - requiredCandleCount);

            currAverage[averageType] = sum / requiredCandleCount;
            if (currAverage[averageType] == 0)
                console.log("Uber Error");
        }

        averagesData.push({
            date: newCandle.date,
            candle: newCandle,
            averages: currAverage
        });
    }

    /*
     * event data:
     *  date - current date
     *  candle - current candle
     *  intersections - the detected at the current date intersections
     *  averagesData - averages data structure of the algorithm
     *  index - current index at averages data
     */

    function updateState(newCandle) {
        var eventData = {
            date: newCandle.date,
            candle: newCandle,
            averagesData: averagesData,
            index: lastCandleIndex
        };

        if (newCandle.open <= newCandle.close) {
            state.consecutive.up += 1;

            if (averagesData.length > averageTypes.brown.candleCount) {
                eventData.type = markUtils.eventType.greenCandleAdded;
                markUtils.emitGreenCandleAdded(eventData);
            }

            if (state.consecutive.down > 1) {
                eventData.type = markUtils.eventType.trendDescending;
                markUtils.emitTrendDescendingEvent(eventData);
            }

            state.consecutive.down = 0;
        } else {
            state.consecutive.down += 1;

            if (averagesData.length > averageTypes.brown.candleCount) {
                eventData.type = markUtils.eventType.blackCandleAdded;
                markUtils.emitBlackCandleAdded(eventData);
            }

            if (state.consecutive.up > 1) {
                eventData.type = markUtils.eventType.trendAscending;
                markUtils.emitTrendAscendingEvent(eventData);
            }

            state.consecutive.up = 0;
        }
    }

    function checkIntersections(dateNow) {
        var intersectionsFound = intersections(averagesData.length - 1);

        if (intersectionsFound.atLeastOneIntersection) {

            var intersectionEventData = {
                intersections: intersectionsFound,
                date: dateNow,
                candle: averagesData[lastCandleIndex].candle,
                averagesData: averagesData,
                index: lastCandleIndex,
                type: markUtils.eventType.intersection
            };

            markUtils.emitIntersectionEvent(intersectionEventData);
        }
    }

    function onNewMarkAdded(eventData) {
        saveMarkToDB(eventData.mark, eventData.mark.markAt.date);
    }

    function saveMarkToDB(newMark, createdOn) {

        createdOn = createdOn || new Date();

        newMark.createdOn = new Date(createdOn).toISOString();

        mongoHandler.addAutoMark(newMark, function (err) {
            if (err)
                console.log("[ERROR] While adding mark " + newMark + ". Details: " + err.message);
            else
                console.log("New mark inserted to DB");
        });
    }

    function getMarksFromDB(dateFrom, dateTill, callback) {
        mongoHandler.getAutoMarks(dateFrom, dateTill, callback);
    }

    // Intersection is when one (or more) of the averages was lower than another, but now it is higher.
    // The candle intersects when its low value is below the average value and its high value above it
    function intersections(upperIndex) {

        if (averagesData.length <= 1 || averagesData.length < upperIndex)
            return {};

        var intersections = {
            'purple': [],
            'orange': [],
            'black': [],
            'blue': [],
            'brown': [],
            'candle': [],
            'atLeastOneIntersection': false
        };

        var latestDatum = averagesData[upperIndex];
        var preLatestDatum = averagesData[upperIndex - 1];

        for (var averageType in averageTypes) {

            if (latestDatum.averages[averageType] == 0) continue;

            for (var averageTypeToCompare in averageTypes) {

                if (preLatestDatum.averages[averageTypeToCompare] == 0 ||
                    preLatestDatum.averages[averageType] == 0) continue;

                if (averageTypeToCompare !== averageType &&
                    latestDatum.averages[averageType] &&
                    preLatestDatum.averages[averageTypeToCompare] &&
                    latestDatum.averages[averageType] > latestDatum.averages[averageTypeToCompare] &&
                    preLatestDatum.averages[averageTypeToCompare] > preLatestDatum.averages[averageType]) {

                    intersections[averageType].push({
                        sourceValue: latestDatum.averages[averageType],
                        target: averageTypeToCompare,
                        targetValue: latestDatum.averages[averageTypeToCompare],
                        dif: latestDatum.averages[averageType] - latestDatum.averages[averageTypeToCompare]
                    });

                    intersections.atLeastOneIntersection = true;
                }
            }

            if (latestDatum.candle.low < latestDatum.averages[averageType] &&
                latestDatum.candle.high > latestDatum.averages[averageType]) {

                intersections.candle.push({
                    sourceValue: latestDatum.candle.high,
                    target: averageType,
                    targetValue: latestDatum.averages[averageType],
                    dif: latestDatum.candle.high - latestDatum.averages[averageType]
                });

                intersections.atLeastOneIntersection = true;
            }
        }

        return intersections;
    }

    function executeAlgorithmByDate(dateTarget, eraseOldMarks) {
        var spawn = require('child_process').spawn;
        var path = require('path');
        var execTarget = path.join(__dirname, '../executeAlgorithmByDate.bat');
        var args = ['/c', execTarget, dateTarget];
        if (eraseOldMarks)
            args.push("eraseOldMarks");



        var bat = spawn('cmd.exe', args
            /*, function (err, stdout, stderr) {
                        if (err) {
                            console.error(err);
                        } else {
                            console.log("******************************************************** " +
                                "SUB PROCESS FINISHED!! ********************************************************");
                            //console.log(stdout);
                        }
                    }*/
        );

        bat.stdout.on('data', function (data) {
            console.log(data.toString());
        });
    }

    markUtils.eventRegistration(markUtils.eventType.markSaved, onNewMarkAdded);

    algorithmController.executeAlgorithmByDate = executeAlgorithmByDate;
    algorithmController.addCandleEventHandler = addCandleEventHandler;
    algorithmController.getMarksBetween = getMarksFromDB;

})(module.exports);