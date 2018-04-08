/**
 * Created by avihay on 4/24/2017.
 */
(function (reader) {

    var dayData = null;

    reader.initialize = function (targetDate, callback) {

        require('./model/mongoHandler').findData({
            date: targetDate
        }, function (err, data) {

            if (!err && data.length > 0) {
                callback(null);
                dayData = data[0];
            } else {
                callback(err.message || "No data found of given date.");
            }
        });
    };

    reader.realDataReader = function (interval, callback) {
        var index = 0;
        var dateUtils = require('./Utils/dateUtils');

        var repeat = setInterval(function () {

            if (!dayData) return;

            var newCandle = dayData.values[index];
            index++;
            if (index < dayData.values.length)
                callback({
                    open: newCandle.open,
                    close: newCandle.close,
                    high: newCandle.high,
                    low: newCandle.low,
                    date: (dayData.date + ' ' + newCandle.date)
                });
            else {
                console.log("Finished iterating data");
                clearInterval(repeat);
            }
        }, interval);
    };

    /*generator.candleGenerator = function (interval, callback) {

        var length = 10;
        var negateMap = {
            0: 1,
            1: -1
        };

        var init = 1.08455;
        var initDate = new Date();
        initDate.setMilliseconds(0);
        initDate.setSeconds(0);

        setInterval(function(){

            var randomValues = [];

            for (var i = 0; i < length; i++) {
                var negative = negateMap[getRandomArbitrary(0,2)];
                init = init + ((getRandomArbitrary(0, 1000) / 1000000) * negative);
                randomValues.push(init);
            }

            randomValues.sort();

            var newCandle = {
                low: randomValues[0],
                high: randomValues[length - 1],
                open: randomValues[getRandomArbitrary(0,length)],
                close: randomValues[getRandomArbitrary(0,length)],
                date: initDate.toISOString()
            };

            initDate.setMinutes(initDate.getMinutes() + 1);

            callback(newCandle);

        }, interval);

    };

    function getRandomArbitrary(min, max) {
        return Math.floor(Math.random() * (max - min)) + min;
    }*/

})(module.exports);