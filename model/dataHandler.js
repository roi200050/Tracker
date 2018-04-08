/**
 * Created by avihay on 20/06/2015.
 */
var dataHandler = function () {},
    mongoHandler = require('./mongoHandler'),
    sharedData,
    http = require('http'),
    index = 0;

// data for debug purposes
var seedData = [{
    date: "2015-06-05 16:52:00",
    open: "1.05",
    high: "1.07",
    low: "1.04",
    close: "1.05"
}, {
    date: "2015-06-05 16:53:00",
    open: "1.05",
    high: "1.06",
    low: "1.02",
    close: "1.05"
}, {
    date: "2015-06-05 16:54:00",
    open: "1.25",
    high: "1.37",
    low: "1.22",
    close: "1.25"
}, {
    date: "2015-06-05 16:55:00",
    open: "1.05",
    high: "1.27",
    low: "1.04",
    close: "1.05"
}, {
    date: "2015-06-05 16:56:00",
    open: "1.05",
    high: "1.08",
    low: "1.03",
    close: "1.05"
}];
var currentData = [],
    startDate = new Date(); // = {date:"", open:"", high:"", low:"", close:""};

dataHandler.prototype = {
    'init': function (app) {
        mongoHandler.init(app);
        sharedData = app;
    },
    'readData': function (next) { // reads data from google
        http.get('http://www.google.com/finance/info?q=CURRENCY%3aEURUSD', function (res) {
            res.on('data', function (chunk) {
                console.log(JSON.parse(chunk.toString().substr(3))[0].l);
            });
        }).on("error", function (err) {
            console.log(err);
        });
    },
    'calibrate': function (seed) {
        return seedData;
    },
    'current': function (callback) { // returns the price from google
        callback(JSON.stringify(sharedData.locals.datum));

        /* var request = http.get('http://www.xe.com/', function(res){
            var index=0;
            res.on('data', function(chunk){
                try{
                    var chunkStr = chunk.toString();
                    var datum = chunkStr.match('USD,EUR,2,1\'>[0-9]\\.[0-9]{5}')[0].split('>')[1];
                    request.abort();
                    callback(datum);
                } catch (ex){

                }
            }).
            on('error', function(err){console.log(err);});
        }); */
    },
    'getRecordsList': function (callback) { // returns records list
        mongoHandler.getRecordsList(callback);
    },
    'getRecords': function (callback) { // returns records content
        mongoHandler.getRecords(callback);
    },
    'eraseRecord': function (id, callback) { // delete a record
        mongoHandler.eraseRecord(id, callback);
    },
    'cleanup': function () {
        mongoHandler.cleanup();
    }
};

module.exports = new dataHandler();