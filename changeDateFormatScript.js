var mongoHandler = require('./model/mongoHandler');
var dateUtils = require('./utils/dateUtils');
var app = {
	locals: {}
};
mongoHandler.init(app);
var dayScehma = app.locals.scemas.dayScehma;
var autoMarks = app.locals.scemas.autoMarkSchema;
var count = 0;

if (!global.gc)
	throw new Error("Please execute the script with -expose-gc flag.");

dayScehma.find({}, '_id', function (err, results) {

	for (var i = 0; i < results.length; i++) {
		fixDatesTimes(results[i]._id, results.length);

	}
	console.log("fixing " + results.length + " documents.");
});

function updateMarkCreatedOn(mark) {

	autoMarks.findByIdAndUpdate(mark._id, '');
}

autoMarks.find({}, '_id markAt createdOn', function (err, results) {

	for (var i = 0; i < results.length; i++) {
		updateMarkCreatedOn(results[i])
	}

});

function fixDatesTimes(_id, totalAmount) {
	dayScehma.find({
		_id: _id
	}, function (err, results) {
		if (err) {
			console.log("ERROR!! " + err);
		} else {
			for (var i in results) {
				results[i].date = dateUtils.formatDate(results[i].date);
				for (var minute = 0; minute < results[i].values.length; minute++)
					results[i].values[minute].date = dateUtils.formatTime(results[i].date + ' ' + results[i].values[minute].date);
				results[i].values.sort(function (a, b) {
					return new Date(results[i].date + ' ' + a.date).getTime() - new Date(results[i].date + ' ' + b.date).getTime();
				});
				dayScehma.update({
					_id: results[i]._id
				}, results[i], function (err) {
					count++;
					console.log('Document (' + count + '/' + totalAmount + ') updated.');
					global.gc();
				});
			}
		}
	});
}