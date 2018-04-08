var args = process.argv.slice(2);

if (args[0] && isValidDate(args[0])) {
    targetDate = args[0];
    console.log("[INFO] Executing algorithm on date " + args[0]);
    autoExecution();
} else {
    console.log("[ERROR] Invalid date parameter passed to executeAlgorithmByDate value: " + args[0]);
}


process.on('uncaughtException', function (err) {
    try {
        console.log("[ERROR] Unhandled exception occured. " + err);
    } catch (ex) {
        console.log("[ERROR] Unhandled exception occured. in uncaughtExceptionFunction " + ex);
    }
});

var targetDate;
var app;

function autoExecution() {
    app = {
        locals: {}
    };
    var mongoHandler = require('./model/mongoHandler');
    mongoHandler.init(app);
    main();
}



function main() {
    if (args[1] && args[1] == 'eraseOldMarks') {
        deleteAutoMarksByDate(targetDate, function (err) {
            if (!err) {
                executeAlgorithm();
            } else {
                console.log("[ERROR] Could not erase old auto marks of date: " + targetDate);
            }
        })
    } else {
        executeAlgorithm();
    }
}

function executeAlgorithm() {
    var candleDataReader = require('./candleDataReader');
    var algorithmController = require('./controllers/algorithmController');
    candleDataReader.initialize(targetDate, function (err) {
        if (err) {
            console.log("[ERROR] Error while looking for data of given date. " + err);
        } else {
            candleDataReader.realDataReader(50, algorithmController.addCandleEventHandler)
        }
    });
}


function isValidDate(value) {
    var moment = require('moment');
    return value && moment(value).isValid();
}

function deleteAutoMarksByDate(date, callback) {
    var mongoHandler = require('./model/mongoHandler');
    mongoHandler.eraseAutoMarksByDate(date, callback);
}

function manualExecution(date, eraseOldMarks) {
    args = [date, eraseOldMarks];
    if (args[0] && isValidDate(args[0])) {
        targetDate = args[0];
        console.log("[INFO] Executing algorithm on date " + args[0]);
    } else {
        console.log("[ERROR] Invalid date parameter passed to executeAlgorithmByDate value: " + args[0]);
        return 1;
    }
    main();
}

module.exports = {
    manualExecution: manualExecution
};