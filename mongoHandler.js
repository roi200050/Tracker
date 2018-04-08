/**
 * Created by avihay on 02/06/2015.
 */
var mongoHandler = function () {};

var mongoose = require('mongoose');
var dayModel = null;
var tradeModel = null;

function initSchema() {

}

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
    'init': function (app) {
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
            end_value: String
        });

        app.locals.scemas = {};
        dayModel = app.locals.scemas.dayScehma = mongoose.model('DayDoc', daySchema);
        tradeModel = app.locals.scemas.tradeSchema = mongoose.model('TradesDoc', tradeSchema);
        app.locals.mongoose = mongoose;

        mongoose.connect('mongodb://localhost/Data', {
            user: 'dataWriter',
            pass: 'Aa1234567'
        });
        mongoose.connection.on("error", function (err) {
            console.log(err + 'ERROR!! Could not connect to database [mongoHandler]');
        });

        mongoose.connection.once("open", function () {
            console.log("Connected.");
            //eraseOldRecords();
            //eraseOldTrades();
        });
    },
    'getRecordsList': function (callback) {
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
    'getRecords': function (callback) {
        if (!dayModel) {
            callback([]);
        } else {
            dayModel.find(callback);
        }
    },
    'eraseRecord': function (id, callback) {
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
    'findData': function (identifier, callback) {
        if (dayModel) {
            dayModel.find(identifier, callback);
        } else {
            console.log("[ERROR] Day model is not defined. [mongoHandler.findData]");
            callback(new Error("Could not retrieve data"));
        }
    },
    // Must supply identifier. Empty if not required.
    'findTrades': function (identifier, selection, callback) {
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
    'addTrade': function (day, init_date, owner, operation, init_value, end_date, callback, end_value) {
        var newTrade = new tradeModel();
        var serverDateSringer = new Date(day + " " + init_date);
        newTrade.day = serverDateSringer.toLocaleDateString();
        newTrade.owner = owner;
        newTrade.operation = operation;
        newTrade.init_date = serverDateSringer.toLocaleTimeString();
        newTrade.init_value = init_value;
        serverDateSringer = new Date(end_date);
        newTrade.end_date = serverDateSringer.toLocaleString();
        newTrade.end_value = end_value ? end_value : "";

        newTrade.save(function (err) {
            if (!err) {
                console.log("[INFO] Successfully stored trade " + newTrade.init_date + " [mongoHandler.addTrade]");
                callback(null);
            } else {
                console.log("[ERROR] Could not store trade [mongoHandler.addTrade]. Details: ");
                console.log(err);
                callback(err);
            }
        });
    },
    'resolveTrade': function (trade, callback) {
        var tradeEndDate = new Date(trade.end_date);
        this.findData({
            $and: [{
                'values.date': tradeEndDate.toLocaleTimeString()
            }, {
                date: tradeEndDate.toLocaleDateString()
            }]
        }, function (err, results) {
            if (!err && results && results.length > 0) {
                var values = results[0].values;
                for (var i = 0; i < values.length; i++) {
                    if (values[i].date == tradeEndDate.toLocaleTimeString()) {
                        trade.end_value = values[i].close ? values[i].close : "";
                        trade.save(function (err, results) {
                            callback(err, trade.id);
                        });
                        return;
                    }
                }
            }
            callback(new Error("Could not resolve trade." + err));
        });
    },
    'cleanup': function () {
        mongoose.connection.close(function () {
            console.log('Mongoose is disconnected through app termination');
        });
    }
};
var instance = new mongoHandler();
console.log('1');
module.exports = instance;