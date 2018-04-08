/**
 * Created by avihay on 25/06/2015.
 */

var graphController = function () {},
    dataHandler = require('../model/dataHandler'),
    mongoHandler = require('../model/mongoHandler'),
    bodyParser = require('body-parser'),
    dateUtils = require('../utils/dateUtils');

// handles graph requests
graphController.prototype = {
    'init': function (app) {
        app.use(bodyParser.urlencoded({
            extended: false
        }));
        //app.use(bodyParser.text());
    },
    'cleanup': function () {},
    'current': function (req, res) { // returns current datum
        dataHandler.current(function (datum) {
            res.send(datum);
        });
    },
    'getRecordsList': function (callback) { // returns records list
        return dataHandler.getRecordsList(callback);
    },
    'getCandlesDataByTime': function (req, res) {
        var upperTimeLimit = new Date(req.body.upperTimeLimit);
        var candlesCountToLoad = req.body.candlesCountToLoad;
        var lowerTimeLimit = new Date(upperTimeLimit.getTime());
        lowerTimeLimit.setMinutes(lowerTimeLimit.getMinutes() - candlesCountToLoad);
        var timeInDay = 86400000;
        var daysDifference = ((upperTimeLimit.getTime() - lowerTimeLimit.getTime()) / timeInDay) + 1;
        var datesRange = [];

        for (var day = 0; day < daysDifference; day++) {
            var currentDateInRange = new Date(upperTimeLimit.getTime() - (timeInDay * day));
            datesRange.push(dateUtils.formatDate(currentDateInRange));
        }

        mongoHandler.findData({
            date: {
                $in: datesRange
            }
        }, function (err, result) {
            if (err) {
                console.log("Error while loading data [graphController.getCandlesDataByTime] " + err);
                res.sendStatus(500);
            } else {
                var candleDataToReturn = [];
                for (var day = 0; day < result.length; day++) {
                    for (var minute = 0; minute < result[day].values.length; minute++) {
                        var minuteDate = new Date(result[day].date + " " + result[day].values[minute].date);
                        if (minuteDate.getTime() < upperTimeLimit.getTime() && minuteDate.getTime() > lowerTimeLimit.getTime())
                            candleDataToReturn.push({
                                open: result[day].values[minute].open,
                                close: result[day].values[minute].close,
                                high: result[day].values[minute].high,
                                low: result[day].values[minute].low,
                                date: result[day].date + " " + result[day].values[minute].date
                            });
                    }
                }

                res.status(200).send(candleDataToReturn);
            }
        });
    },
    'getRecords': function (callback) { // returns records content
        dataHandler.getRecords(callback);
    },
    'eraseRecord': function (id, callback) { // delete a record
        dataHandler.eraseRecord(id, callback);
    },
    'addTrade': function (req, res) { // add a trade
        var userData = req.body;
        mongoHandler.addTrade(
            userData.day,
            userData.init_date,
            userData.owner,
            userData.operation,
            userData.init_value,
            userData.end_date,
            userData.end_value,
            userData.regular,
            userData.custom,
            userData.replay,
            function (err, trade) {
                if (err)
                    res.sendStatus(500);
                else
                    res.status(200).send(trade);
                // res.sendStatus(200);
            }
        );
    },
    'getTrades': function (owner, callback) { // returns trades
        mongoHandler.findTrades({
            owner: owner
        }, function (err, results) {
            if (err) {
                console.log("[ERROR] Error while fetching trades [graphController]. Details: " + err);
            }
            callback(results);
        });
    },
    'getTrade': function (id, callback) { // returns specific trade by id
        mongoHandler.findTrades({
            _id: id
        }, function (err, results) {
            if (err) {
                console.log("[ERROR] Error while fetching trades [graphController]. Details: " + err);
                callback(err);
            } else
                callback(null, results[0]);
        });
    },
    'stopTrade': function (params, callback) { // returns specific trade by id
        mongoHandler.stopTrade(params, function (err, trade) {
            if (err) {
                console.log("[ERROR] Error while stopping a trade [graphController][stopTrade]. Details: " + err);
                callback(err);
            } else
                callback(null, trade);
        });
    },
    'unfollowTrade': function (req, res) {
        var id = req.body.id;
        mongoHandler.unfollowTrade(id, function (err, trade) {
            if (err) {
                console.log("[ERROR] Error while unfollowing a trade [graphController][unfollowTrade]. Details: " + err);
                callback(err);
            } else
                callback(null, trade);
        });
    },
    'getTradesDateList': function (owner, callback) { // returns trades date list
        mongoHandler.findTrades({}, 'day', function (err, results) {
            if (err) {
                console.log("[ERROR] Error while fetching trades [graphController]. Details: " + err);
            }
            callback(err, results);
        });
    },
    'findTrades': function (req, res) { // searches for trades and calculates if succeeded or not
        var successIndicator = 0.00002;
        if (!req.body.date) {
            res.status(400).send("Specify date.");
        } else {
            var identifier = {
                day: req.body.date
            };

            if (req.body.regular !== undefined) // true or false
                identifier.regular = req.body.regular;
            if (req.body.custom !== undefined) // true or false
                identifier.custom = req.body.custom;
            if (req.body.replay !== undefined) // true or false
                identifier.replay = req.body.replay;

            mongoHandler.findTrades(identifier, function (err, results) {
                if (err) {
                    res.sendStatus(500);
                } else {
                    var trades = results.map(function (element, index, results) {
                        var succeeded = '?',
                            status = element.status,
                            op_name = {
                                s: 'Sell',
                                b: 'Buy'
                            };

                        if (element.end_value != "") {
                            if ((element.end_value - element.init_value > successIndicator && element.operation === 'b') ||
                                (element.end_value - element.init_value < successIndicator && element.operation === 's')) {
                                succeeded = 'True';
                                status = status === 3 ? 3 : 1; // Succeeded
                            } else {
                                succeeded = 'False';
                                status = status === 3 ? 3 : 2; // Failed
                            }
                        }

                        // update trades status only once
                        if (!element.status) {
                            element.status = status;
                            element.save(function (err, results) {
                                if (err)
                                    console.log("[ERROR] Error while saving trade status [graphController]. Details: " + err);
                            });
                        }

                        return {
                            id: element._id,
                            day: element.day,
                            operation_name: op_name[element.operation],
                            init_date: element.init_date,
                            init_value: element.init_value,
                            end_date: element.end_date,
                            end_value: element.end_value,
                            regular: element.regular,
                            custom: element.custom,
                            replay: element.replay,
                            succeeded: succeeded
                            // status: status
                        };
                    });
                    res.send(trades);
                }
            });
        }
    },
    'resolveTradesByDay': function (date) { // calculates whether trades succeeded in a specific day
        var identifier = {
            'day': date
        };
        mongoHandler.findTrades(identifier, function (err, results) {
            if (!err && results && results.length > 0) {
                mongoHandler.resolveTrade(results, function (err, trade_id) {
                    if (!err) {
                        console.log("[INFO] Successfully resolved trade " + trade_id);
                    } else {
                        console.log("[ERROR] Could not resolve trade " + trade_id + "details" + err);
                    }
                });
            }
        });
    },
    'resolveTrades': function (req, res) { // calculates whether trades succeeded
        var now = dateUtils.formatDate(new Date());
        mongoHandler.findTrades({
            $and: [{
                end_date: {
                    $lt: now
                }
            }, {
                end_value: ""
            }]
        }, function (err, results) {
            if (!err && results && results.length > 0) {
                mongoHandler.resolveTrade(results, function (err, trade_id) {
                    if (!err) {
                        console.log("[INFO] Successfully resolved trade " + trade_id);
                    } else {
                        console.log("[ERROR] Could not resolve trade " + trade_id + "details" + err);
                    }
                });
            }
        });
    },
    'calibrate': function (req, res, next) { // returns past data
        res.send(dataHandler.calibrate());
    },
    'findMinuteData': function (req, res, next) {
        if (!req.body.day || !req.body.time) {
            res.status(400).send("Specify date and time.");
        } else {
            mongoHandler.findMinuteData(req.body.day, req.body.time, function (err, result) {
                if (err || !result || !result.values || result.values.length <= 0) {
                    res.sendStatus(500);
                } else {
                    res.send(result.values[0].all);
                }
            });
        }
    },
    'findData': function (req, res) { // returns data for the price by day
        if (!req.body.seed || !req.body.minuteSeed) {
            res.status(400).send("Specify seed.");
        } else {
            var identifier = {
                'date': req.body.seed
            };
            var self = this;
            mongoHandler.findData(identifier, function (err, results) {
                if (err) {
                    res.sendStatus(500);
                } else {
                    mongoHandler.findTrades({
                        day: req.body.seed
                        // replay: true
                    }, function (err, trades) {
                        if (err) {
                            res.sendStatus(500);
                        } else {
                            mongoHandler.findMarks({
                                day: req.body.seed
                                // replay: true
                            }, function (err, marks) {
                                if (err) {
                                    res.sendStatus(500);
                                } else {
                                    var seed_data = results.map(function (element) {
                                        var filteredValues = [];
                                        element.values.forEach(function (minute) {
                                            if (minute.date >= req.body.minuteSeed) {
                                                filteredValues.push(minute);
                                            }
                                        });

                                        element.values = filteredValues;

                                        return element;
                                    });

                                    res.send({
                                        seed_data: seed_data,
                                        seed_trades: trades,
                                        seed_marks: marks
                                    });
                                }
                            });
                        }
                    });
                }
            });
        }
    },
    'getMarksConfig': function (req, res) {
        var identifier = {
            owner: 'Jovani'
        };
        mongoHandler.getMarksConfig(identifier, function (err, result) {
            if (err) {
                console.error(err);
            } else {
                if (!result || !result.config) {
                    result = {
                        config: {}
                    };
                    for (var major = 1; major <= 20; major++) {
                        for (var minor = 0; minor <= 15; minor++) {
                            if (minor === 0) {
                                result.config['' + major] = null;
                            } else {
                                result.config[major + '-' + minor] = null;
                            }
                        }
                    }
                }
                res.send(result.config);
            }
        })
    },
    'setMarksConfig': function (req, res) {
        var identifier = {
            owner: 'Jovani'
        };
        mongoHandler.setMarksConfig(identifier, req.body.config, function (err, result) {
            if (err) {
                console.error(err);
            } else
                res.send(result);
        });
    },
    'addMark': function (req, res) { // add a trade
        var userData = req.body;
        mongoHandler.addMark(
            userData.day,
            userData.date,
            userData.value,
            userData.configuration,
            userData.owner,
            function (err, mark) {
                if (err)
                    res.sendStatus(500);
                else
                    res.status(200).send(mark);
                // res.sendStatus(200);
            }
        );
    },
    'removeMark': function (req, res) { // add a trade
        var userData = req.body;
        mongoHandler.removeMark(
            userData.id,
            function (err, result) {
                if (err)
                    res.sendStatus(500);
                else
                    res.status(200).send(result);
                // res.sendStatus(200);
            }
        );
    }
};

module.exports = new graphController();