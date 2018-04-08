var express = require('express');
var graphController = require('../controllers/graphController');

// the router is responsible for the addresses we want to reach
var router = express.Router();

/* GET home page. */
router.get('/', function (req, res, next) {
    res.render('index', {
        title: 'Graph'
    });
});

router.get('/getRecordsData', function (req, res) {
    graphController.getRecordsList(function (err, results) {
        res.send(results);
    });
});

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

router.post('/findData', function (req, res, next) {
    graphController.findData(req, res);
});

router.post('/findTrades', function (req, res) {
    graphController.findTrades(req, res);
});

router.post('/eraseRecord', function (req, res, next) {
    if (!req.body || !req.body.id) res.sendStatus(400);
    graphController.eraseRecord(req.body.id, function (err) {
        if (err) {
            res.sendStatus(400);
            console.log("[ERROR] Could not erase record id : " + id + " cause : " + err);
        } else res.sendStatus(200);
    });
});

router.post('/addTrade', function (req, res, next) {
    if (!req.body) {
        console.log(req.body);
        res.sendStatus(400);
    } else {
        graphController.addTrade(req, res);
    }
});

router.get('/datum', function (req, res) {
    graphController.current(req, res);
});

router.get('/Table', function (req, res, next) {
    var user = req.user ? req.user : "Jovani";
    res.render('table', {
        title: 'Success Table'
    });
});

router.get('/resolveTrades', function (req, res) {
    graphController.resolveTradesByDay(req.body.date);
    res.send({});
});

module.exports = router;