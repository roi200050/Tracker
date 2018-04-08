// code for supporting old requests to other data source. changed with top time.
var express = require('express');
var graphController = require('../controllers/graphController');
var algorithmController = require('../controllers/algorithmController');
var router = express.Router();

/* GET home page. */
router.get('/xs', function (req, res, next) {
	graphController.getRecordsList(function (err, results) {
		res.render('index', {
			title: 'Graph',
			records: results
		});
	});
});

router.post('/data/now', function (req, res, next) {
	graphController.current(req, res, next);
});

router.get('/data/calibrate', function (req, res, next) {
	graphController.calibrate(req, res, next);
});

router.post('/autoMarks/getBetween', function (req, res, next) {
	algorithmController.getMarksBetween(req.body.from, req.body.till, function (err, results) {
		if (err) {
			res.send({
				error: true,
				data: err.message
			});
		} else {
			res.send({
				error: false,
				data: results
			});
		}
	});
});

router.post('/executeAlgorithmByDate', function (req, res, next) {
	algorithmController.executeAlgorithmByDate(req.body.date, true);
	res.sendStatus(200);
});

router.post('/getCandlesDataByTime', function (req, res, next) {
	graphController.getCandlesDataByTime(req, res, next);
});

module.exports = router;