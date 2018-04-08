var express = require('express');
var graphController = require('../controllers/graphController');
var recorder = require('../bin/recorder');
var router = express.Router();

/* GET home page. */
router.get('/', function (req, res, next) {
    res.render('index', {
        title: 'Graph'
    });
});

// returns records list
router.get('/getRecordsData', function (req, res) {
    graphController.getRecordsList(function (err, results) {
        res.send(results);
    });
});

// handles a data request related to a specific trade
router.post('/getTrade', function (req, res, next) {
    if (!req.body || !req.body.id) res.sendStatus(400);
    graphController.getTrade(req.body.id, function (err, results) {
        if (err) {
            res.sendStatus(400);
            console.log("[ERROR] Could not get trade id: " + id + " because : " + err);
        } else
            res.status(200).send(results);
    });
});

// stops a specific trade
router.post('/stopTrade', function (req, res, next) {
    if (!req.body || !req.body.id || !req.body.end_value) res.sendStatus(400);
    graphController.stopTrade({
        id: req.body.id,
        end_value: req.body.end_value
    }, function (err, results) {
        if (err) {
            res.sendStatus(400);
            console.log("[ERROR] Could not stop trade id: " + req.body.id + " because : " + err);
        } else
            res.status(200).send(results);
    });
});

// returns trades table
router.get('/getTradesData', function (req, res) {
    graphController.getTradesDateList(req.body.owner, function (err, results) {
        var distinct = [];
        console.log("Fetched " + results.length + " trades.");
        for (var i = 0; i < results.length; i++)
            if (distinct.indexOf(results[i].day) == -1)
                distinct.push(results[i].day);
        console.log("Finished");
        res.send(distinct);
    });
});

// returns records content
router.get('/records', function (req, res, next) {
    graphController.getRecords(function (err, results) {
        var records = results.map(function (record) {
            var min, max, values;
            if (record.values.length > 0) {
                min = record.values[0].date;
                max = record.values[record.values.length - 1].date;
                values = record.values.map(function (element) {
                    return element.date;
                });
            }

            return {
                date: record.date,
                length: record.values.length,
                min: min,
                max: max,
                values: values
            };
        });
        res.render('records', {
            title: 'Records',
            records: results ? records : []
        });
    });
});

// handles a data request related to records
router.post('/findMinuteData', function (req, res, next) {
    graphController.findMinuteData(req, res);
});

// handles a data request related to records
router.post('/findData', function (req, res, next) {
    graphController.findData(req, res);
});

// handles a data request related to trades table
router.post('/findTrades', function (req, res) {
    graphController.findTrades(req, res);
});

// deletes a record
router.post('/eraseRecord', function (req, res, next) {
    if (!req.body || !req.body.id) res.sendStatus(400);
    graphController.eraseRecord(req.body.id, function (err) {
        if (err) {
            res.sendStatus(400);
            console.log("[ERROR] Could not erase record id : " + id + " cause : " + err);
        } else res.sendStatus(200);
    });
});

// adds a trade
router.post('/addTrade', function (req, res, next) {
    if (!req.body) {
        console.log(req.body);
        res.sendStatus(400);
    } else {
        graphController.addTrade(req, res);
    }
});

// gets current price
router.get('/datum', function (req, res) {
    graphController.current(req, res);
});

// displays success table
router.get('/Table', function (req, res, next) {
    var user = req.user ? req.user : "Jovani";
    res.render('table', {
        title: 'Success Table'
    });
});

// calculates whether a trade succeeded or failed
router.post('/resolveTrades', function (req, res) {
    graphController.resolveTradesByDay(req.body.date);
    res.send({});
});

router.get('/getMarksConfig', function (req, res) {
    graphController.getMarksConfig(req, res);
});

router.post('/setMarksConfig', function (req, res) {
    graphController.setMarksConfig(req, res);
});

// adds a mark
router.post('/addMark', function (req, res, next) {
    if (!req.body) {
        console.log(req.body);
        res.sendStatus(400);
    } else {
        graphController.addMark(req, res);
    }
});

// adds a mark
router.post('/removeMark', function (req, res, next) {
    if (!req.body) {
        console.log(req.body);
        res.sendStatus(400);
    } else {
        graphController.removeMark(req, res);
    }
});

router.post('/unfollowTrade', function (req, res, next) {
    if (!req.body) {
        console.log(req.body);
        res.sendStatus(400);
    } else {
        graphController.unfollowTrade(req, res);
    }
});

router.get('/restartRecorder', function (req, res, next) {
    try {
        recorder.restart();
        res.send('Restarted Successfully');
    } catch (e) {
        console.error(e.stack);
        res.status(500);
        res.send(e);
    }
});

module.exports = router;