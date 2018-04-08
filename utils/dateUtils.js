var dateUtils = function () {};

var moment = require('moment');

dateUtils.prototype = {
	'formatTime': function (dateToFormat) {
		var dateObject = new Date(dateToFormat);

		if (isNaN(dateObject.getTime()))
			throw new Error("dateUtils.formatTime was called with invalid date: " + dateToFormat);

		return moment(dateToFormat).format('HH:mm:ss');
	},
	'formatDate': function (dateToFormat) {
		var dateObject = new Date(dateToFormat);

		if (isNaN(dateObject.getTime()))
			throw new Error("dateUtils.formatDate was called with invalid date: " + dateToFormat);

		return moment(dateToFormat).format('YYYY-MM-DD');
	}
};


module.exports = new dateUtils();