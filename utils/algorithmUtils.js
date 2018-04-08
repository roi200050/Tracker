/**
 * Created by avihay on 4/10/2017.
 */
(function (algorithmUtils) {
    var moment = require('moment');

    function isValidNumber(value) {
        return value && typeof (value) === "number" && !isNaN(value);
    }

    function isValidDate(value) {
        return value && moment(value).isValid();
    }

    algorithmUtils.validateCandleData = function (candle) {

        if (!candle) throw new Error("Candle is not an object.");

        var propertyValidators = {
            'open': isValidNumber,
            'close': isValidNumber,
            'high': isValidNumber,
            'low': isValidNumber,
            'date': isValidDate
        };

        for (var prop in propertyValidators) {
            if (propertyValidators.hasOwnProperty(prop)) {
                if (!candle.hasOwnProperty(prop) || !propertyValidators[prop](candle[prop])) {
                    throw new Error("Validation of property " + prop + " failed. Received: " + candle[prop]);
                }
            }
        }

        return true;
    };

    algorithmUtils.calculateSum = function (candleData, candleCount, candleDataOffset) {

        if (!candleData || !candleData.length || !candleCount ||
            (candleDataOffset && candleDataOffset < 0))

            throw new Error("Called calculateAverage with invalid parameters \ncandleData: " + candleData +
                "\ncandleCount: " + candleCount + "\noffset(optional): " + candleDataOffset);

        var offset = candleDataOffset || 0;

        if (candleData.length - offset >= candleCount) {

            var sum = 0;

            for (var i = 0; i < candleCount; i++) {

                if (!candleData[i + offset].close || isNaN(+candleData[i + offset].close))
                    throw new Error("No 'close' value provided with the candle data.");

                sum += candleData[i + offset].close;
            }

            return sum;
        } else
            throw new Error("Not enough candle data provided to calculate average. \nReceived " + (candleData.length - offset) +
                "\nExpected at least " + candleCount);
    };

    algorithmUtils.validateCandlesConsistency = function (newCandle, lastCandleDate, isFirstCandle) {

        if (newCandle && newCandle.date && isValidDate(newCandle.date) &&
            lastCandleDate && isValidDate(lastCandleDate)) {

            var lastCandleDateClone = new Date(lastCandleDate);
            lastCandleDateClone.setMinutes(lastCandleDateClone.getMinutes() + 1);

            return lastCandleDateClone.toISOString() === new Date(newCandle.date).toISOString();
        } else {
            return (newCandle && newCandle.date && isValidDate(newCandle.date) && isFirstCandle)
        }

    };




})(module.exports);