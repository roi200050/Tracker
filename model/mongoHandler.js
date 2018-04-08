/**
 * Created by avihay on 02/06/2015.
 */
var mongoHandler = function () {},
    mongoose = require('mongoose'),
    dateUtils = require('../utils/dateUtils'),
    dayModel = null,
    tradeModel = null,
    autoMarkModel = null,
    markConfigModel = null,
    markModel = null;

mongoose.Promise = Promise;

// delete old records
function eraseOldRecords() {
    var OLD_TRADE_FACTOR = 1814400000;
    if (!dayModel) {
        callback(new Error("Day model not found."), []);
    } else {
        dayModel.find({}, 'date', function (err, results) {
            if (!err && results) {
                var found = false;
                for (var i = 0; i < results.length; i++) {
                    if (new Date(results[i].date).getTime() < Date.now() - OLD_TRADE_FACTOR) {
                        dayModel.remove({
                            _id: results[i]._id
                        }, function () {});
                        console.log("[INFO] Called remove on record : " + results[i].date);
                        found = true;
                    }
                }

                if (!found)
                    console.log("No old records detected. Total records scanned " + results.length);
            } else if (err)
                console.log("Could not erase old records : " + err);
        });
    }
}

// delete old trades
function eraseOldTrades() {
    var OLD_TRADE_FACTOR = 1814400000;
    if (!tradeModel) {
        callback(new Error("Trade model not found."), []);
    } else {
        tradeModel.find({}, 'day', function (err, results) {
            if (!err && results) {
                var found = false;
                for (var i = 0; i < results.length; i++) {
                    if (new Date(results[i].day).getTime() < Date.now() - OLD_TRADE_FACTOR) {
                        tradeModel.remove({
                            _id: results[i]._id
                        }, function () {});
                        console.log("[INFO] Called remove on record : " + results[i].day);
                        found = true;
                    }
                }

                if (!found)
                    console.log("No old trades detected. Total trades scanned " + results.length);
            } else if (err)
                console.log("Could not erase old trades : " + err);
        });
    }
}

mongoHandler.prototype = {
    'init': function (app) { // initialize connection to the DB
        console.log("Connecting to db..");

        var daySchema = new mongoose.Schema({
            date: String,
            values: [{
                date: String,
                open: Number,
                high: Number,
                low: Number,
                close: Number,
                all: [{
                    second: Number,
                    value: Number
                }]
            }]
        });

        var tradeSchema = new mongoose.Schema({
            day: String,
            owner: String,
            operation: {
                type: String,
                enum: ['s', 'b']
            },
            init_date: String,
            init_value: String,
            end_date: String,
            end_value: String,
            regular: Boolean,
            custom: Boolean,
            replay: Boolean,
            follow: {
                type: Boolean,
                default: true
            },
            status: {
                type: Number,
                enum: [1, 2, 3] // 1 - Succeeded, 2 - Failed, 3 - Stopped
            }
        });

        // matches configuration (average intersection, for example), with mark label (12-8 for example)
        var markConfigSkeleton = {
            owner: String,
            config: {}
        };
        for (var major = 1; major <= 20; major++) {
            for (var minor = 0; minor <= 15; minor++) {
                if (minor === 0) {
                    markConfigSkeleton.config['' + major] = String;
                } else {
                    markConfigSkeleton.config[major + '-' + minor] = String;
                }
            }
        }
        var markConfigSchema = new mongoose.Schema(markConfigSkeleton);

        var markSchema = new mongoose.Schema({
            configuration: String,
            day: String,
            owner: String,
            date: String,
            value: String
        });

        var autoMarkSchema = new mongoose.Schema({
            markType: String,
            markAt: {
                price: String,
                date: String
            },
            displayText: String,
            trendLine: Boolean,
            createdOn: String
        });

        app.locals.scemas = {};
        dayModel = app.locals.scemas.dayScehma = mongoose.model('DayDoc', daySchema);
        tradeModel = app.locals.scemas.tradeSchema = mongoose.model('TradesDoc', tradeSchema);
        markConfigModel = app.locals.scemas.markConfigSchema = mongoose.model('MarkConfigDoc', markConfigSchema);
        markModel = app.locals.scemas.markSchema = mongoose.model('MarkDoc', markSchema);
        autoMarkModel = app.locals.autoMarkSchema = mongoose.model('AutoMarkDoc', autoMarkSchema);

        app.locals.mongoose = mongoose;

        //       mongoose.connect('mongodb://localhost/tracker', { // Gershon settings
        // mongoose.connect('mongodb://localhost/Data', {
        //          user: 'dataWriter',
        //          pass: 'Aa12ז4567'
        // });
        mongoose.connect('mongodb://localhost/Data');

        mongoose.connection.on("error", function (err) {
            console.log(err + ' ERROR!! Could not connect to database [mongoHandler]');
        });

        mongoose.connection.once("open", function () {
            console.log("Connected.");
        });
    },
    'eraseAutoMarksByDate': function (date, callback) {
        var searchCriteria = {};
        var createdFrom = new Date(date);
        createdFrom.setHours(0);
        createdFrom = createdFrom.toISOString();
        var createdTill = new Date(date);
        createdTill.setDate(createdTill.getDate() + 1);
        createdTill.setHours(0);
        createdTill = createdTill.toISOString();
        searchCriteria.createdOn = {
            $gte: createdFrom,
            $lt: createdTill
        };
        autoMarkModel.remove(searchCriteria, callback);
    },
    'getMarksConfig': function (id, callback) {
        if (!markConfigModel) {
            callback(new Error("Mark Configuration model not found."), []);
        } else {
            markConfigModel.findOne(id, callback);
        }
    },
    'setMarksConfig': function (id, config, callback) {
        if (!markConfigModel) {
            callback(new Error("Mark Configuration model not found."), []);
        } else {
            try {
                var update = {};
                for (var k in config) {
                    if (config.hasOwnProperty(k)) {
                        var key = k.replace('.', '-');
                        if (config[k] !== null) {
                            update.$set = update.$set || {};
                            update.$set['config.' + key] = config[k];
                        } else {
                            update.$unset = update.$unset || {};
                            update.$unset['config.' + key] = 1;
                        }
                    }
                }
            } catch (e) {
                console.error(e);
            }
            markConfigModel.update(id, update, {
                upsert: true,
                new: true
            }, callback);
        }
    },
    'addMark': function (day, date, value, configuration, owner, callback) { // adds a new trade
        var newMark = new markModel(),
            dateAsString = day + " " + date;

        newMark.day = dateUtils.formatDate(dateAsString);
        newMark.owner = owner;
        newMark.date = dateUtils.formatTime(dateAsString);
        newMark.value = value;
        newMark.configuration = configuration;

        newMark.save(function (err, mark) {
            if (!err) {
                console.log("[INFO] Successfully stored mark " + newMark.date + " [mongoHandler.addMark]");
                callback(null, mark);
            } else {
                console.log("[ERROR] Could not store mark [mongoHandler.addMark]. Details: ");
                console.log(err);
                callback(err);
            }
        });
    },
    'removeMark': function (id, callback) { // adds a new trade
        var newMark = new markModel();

        newMark.remove({
            _id: id
        }, function (err, result) {
            if (!err) {
                console.log("[INFO] Successfully removed mark " + id + " [mongoHandler.addMark]");
                callback(null, result);
            } else {
                console.log("[ERROR] Could not remove mark [mongoHandler.addMark]. Details: ");
                console.log(err);
                callback(err);
            }
        });
    },
    'addAutoMark': function (newAutoMark, callback) {
        var autoMark = new autoMarkModel(newAutoMark);
        autoMark.save(callback);
    },
    'getAutoMarks': function (createdFrom, createdTill, callback) {
        var searchCriteria = {};
        searchCriteria.createdOn = {
            $gt: createdFrom,
            $lte: createdTill
        };
        autoMarkModel.find(searchCriteria, callback);
    },
    'getRecordsList': function (callback) { // fetches records list from the DB
        if (!dayModel) {
            callback(new Error("Day model not found."), []);
        } else {
            dayModel.find({}, 'date', function (err, results) {
                var records = [];

                if (!err && results) {
                    for (var i = 0; i < results.length; i++)
                        records.push(results[i].date);
                }
                callback(err, records);
            });
        }
    },
    'eraseOldRecords': eraseOldRecords,
    'eraseOldTrades': eraseOldTrades,
    'getRecords': function (callback) { // fetches records
        if (!dayModel) {
            callback([]);
        } else {
            dayModel.find(callback);
        }
    },
    'eraseRecord': function (id, callback) { // delete a record by ID
        if (!dayModel) {
            console.log("[ERROR] Day model is not defined. [mongoHandler.eraseRecord]");
            callback(null);
        } else {
            console.log("[INFO] Called remove on record : _id " + id);
            dayModel.remove({
                _id: id
            }, callback);
        }
    },
    'findMinuteData': function (day, time, callback) {
        if (dayModel) {
            dayModel.findOne({
                date: day,
                'values.date': time
            }, {
                'values.$': 1
            }, callback);
        } else {
            console.log("[ERROR] Day model is not defined. [mongoHandler.findMinuteData]");
            callback(new Error("Could not retrieve data"));
        }
    },
    'findData': function (identifier, callback) { // finds data for today's prices
        if (dayModel) {
            dayModel.find(identifier, callback);
        } else {
            console.log("[ERROR] Day model is not defined. [mongoHandler.findData]");
            callback(new Error("Could not retrieve data"));
        }
    },
    // Must supply identifier. Empty if not required.
    'findTrades': function (identifier, selection, callback) { // searches trades
        if (tradeModel) {
            if (!callback) {
                callback = selection;
                tradeModel.find(identifier, callback);
            } else {
                tradeModel.find(identifier, selection, callback);
            }
        } else {
            console.log("[ERROR] Trade model is not defined. [mongoHandler.findTrades]");
            callback(new Error("Could not retrieve data"));
        }
    },
    // Must supply identifier. Empty if not required.
    'findMarks': function (identifier, callback) { // searches trades
        if (markModel) {
            markModel.find(identifier, callback);
        } else {
            console.log("[ERROR] Mark model is not defined. [mongoHandler.findMarks]");
            callback(new Error("Could not retrieve data"));
        }
    },
    'addTrade': function (day, init_date, owner, operation, init_value, end_date, end_value, regular, custom, replay, callback) { // adds a new trade
        var newTrade = new tradeModel(),
            dateAsString = day + " " + init_date;
        var dateObject = new Date(dateAsString);

        newTrade.day = dateUtils.formatDate(dateObject);
        newTrade.owner = owner;
        newTrade.operation = operation;
        newTrade.init_date = dateUtils.formatTime(dateObject);
        newTrade.init_value = init_value;
        serverDateSringer = new Date(end_date);
        newTrade.end_date = serverDateSringer.toLocaleString();
        newTrade.end_value = end_value ? end_value : "";
        newTrade.regular = regular;
        newTrade.custom = custom;
        newTrade.replay = replay;

        newTrade.save(function (err, trade) {
            if (!err) {
                console.log("[INFO] Successfully stored trade " + newTrade.init_date + " [mongoHandler.addTrade]");
                callback(null, trade);
            } else {
                console.log("[ERROR] Could not store trade [mongoHandler.addTrade]. Details: ");
                console.log(err);
                callback(err);
            }
        });
    },
    'stopTrade': function (params, callback) { // stops a trade
        var end_value = params.end_value;
        this.findTrades({
            _id: params.id
        }, function (err, results) {
            var trade = results[0],
                date = new Date();

            trade.status = 3; // Stopped
            trade.end_date = date.toLocaleString();
            trade.end_value = end_value;
            trade.save(function (err, trade) {
                if (!err) {
                    console.log("[INFO] Successfully stopped trade " + trade.end_value + " [mongoHandler.stopTrade]");
                    callback(null, trade);
                } else {
                    console.log("[ERROR] Could not stop trade [mongoHandler.stopTrade]. Details: ");
                    console.log(err);
                    callback(err);
                }
            });
        });
    },
    'unfollowTrade': function (id, callback) {
        if (tradeModel) {
            tradeModel.update({
                _id: id
            }, {
                $set: {
                    follow: false
                }
            }, callback);
        } else {
            console.log("[ERROR] Trade model is not defined. [mongoHandler.unfollowTrade]");
            callback(new Error("Could not unfollow trade"));
        }
    },
    'resolveTrade': function (trades, callback) { // calculates whether a trade succeeded or failed
        var tradeEndDate = new Date(trades[0].end_date);
        this.findData({
            date: dateUtils.formatDate(tradeEndDate)
        }, function (err, results) {
            console.log("Resolve start, " + trades.length + " trades.");
            if (!err && results && results.length > 0) {
                var values = results[0].values;
                for (var j = 0; j < trades.length; j++) {
                    var trade = trades[j];
                    tradeEndDate = dateUtils.formatTime(trade.end_date);
                    for (var i = 0; i < values.length; i++) {
                        // compare only hours and minutes (for example 22:34:05 and 22:34:00 are the same)
                        if (values[i].date.substring(0, 5) == tradeEndDate.substring(0, 5)) {
                            trade.end_value = values[i].close ? values[i].close : "";
                            trade.save(function (err, result) {
                                //console.log('resolved ',result);
                                if (j == trades.length - 1)
                                    //console.log("Resolve finished.");
                                    callback(err, result);
                            });
                            break;
                        }
                    }
                    console.log("Trades done: " + j + "/" + trades.length);
                }
            } else {
                console.log("[ERROR] Could not resolve trade. [mongoHandler.resolveTrade]");
                callback(new Error("Could not resolve trade." + err));
            }
        });
    },
    'cleanup': function () { // close the connection to the DB
        mongoose.connection.close(function () {
            console.log('Mongoose is disconnected through app termination');
        });
    }
};
var instance = new mongoHandler();

module.exports = instance;