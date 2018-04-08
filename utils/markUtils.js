/**
 * Created by avihay on 4/23/2017.
 */
(function (markUtils) {

    var dateUtils = require('./dateUtils');

    // Type definitions

    var eventType = {
        intersection: "intersection",
        trendAscending: "trendAscending",
        blackCandleAdded: "blackCandleAdded",
        greenCandleAdded: "greenCandleAdded",
        trendDescending: "trendDescending",
        markPlaced: "markPlaced",
        markSaved: "markSaved"
    };

    var conditionType = {
        intersection: "intersection",
        appearsAfter: "appearsAfter"
    };

    var specialConditionType = {
        candleIntersection: "candleIntersection",
        passThePrior: "passThePrior"
    };

    var stateType = {
        firstPeak: "firstPeak",
        secondPeak: "secondPeak"
    };

    var trendType = {
        ascending: "ascending",
        descending: "descending"
    };

    var averages = {
        purple: "purple",
        orange: "orange",
        black: "black",
        blue: "blue",
        brown: "brown"
    };

    var candle = "candle";

    var candleProp = {
        high: "high",
        low: "low",
        open: "open",
        close: "close"
    };

    var candleColor = {
        black: "black",
        green: "green"
    };

    var markLocationType = {
        intersection: "intersection",
        minuteOffset: "minuteOffset",
        maxDist: "maxDist",
        maxValue: "maxValue",
        minValue: "minValue",
        distThreshold: "distThreshold"
    };

    var markPriceType = {
        candleHigh: "candleHigh",
        candleLow: "candleLow",
        localMin: "localMin",
        localMax: "localMax"
    };

    var ANY_PARENT = "*";
    var IS_PARENT = "IS_PARENT";

    /**
     *
     * Schema
     *
     * NumberMarking: {
     *      trend: "ascending" |"descending",
     *      intersections: [{
     *          source: averageColor |"candle",
     *          target: averageColor |"candle",
     *          difAtLeast: Number
     *      }],
     *      markAt: {
     *          date: minuteOffset | "intersection",
     *          price: {
     *           offset: Number,
     *           target: "candle" | "intersectionTarget"
     *          }
     *      },
     *      reMarkCondition: [
     *          MarkAgainConditionObject
     *      ],
     *      event: [{
     *          type: "intersection" | "mark" | "trendChanged"
     *          source: averageColor | "markNumber"
     *          target: averageColor | "candle" (target appears only when type is intersection)
     *      }]
     *
     *      MarkAgainConditionObject:
     *
     *      {
     *          type: "intersection" | "timeElapsed" | "previousMark" | "betweenMarks"
     *      }
     *
     * }
     *
     *
     * event data:
     *  date - current date
     *  candle - current candle
     *  intersections - the detected at the current date intersections
     *  averagesData - averages data structure of the algorithm
     *  index - current index at averages data
     *
     */

    var markings = {
        
    };

    markings["15.X"] = {
        markEvent: eventType.trendDescending,
        markConditions: [],
        initialCondition: {
            type: conditionType.appearsAfter,
            targets: ["2.3"],
            minutesDifAtLeast: 0
        },
        specialConditions: [{
            type: specialConditionType.passThePrior,
            targetCandleProp: candleProp.low,
            comparator: function (prior, current) {
                return current < prior - 0.0003;
            }
        }],
        markDate: markLocationType.minValue,
        valueType: candleProp.low,
        iterateFromLast: ["2.3"],
        iterationOffset: 1,
        markPrice: markPriceType.candleLow,
        parent: "2",
        incSequence: 0, // Increment the x at 15.x
        sequenced: true
    };

    markings["16.X"] = {
        markEvent: eventType.markPlaced,
        markConditions: [{
            type: eventType.markPlaced,
            markType: "2.3"
        }],
        initialCondition: {
            type: conditionType.appearsAfter,
            targets: ["2.2"],
            minutesDifAtLeast: 0
        },
        specialConditions: [{
            type: specialConditionType.passThePrior,
            targetCandleProp: candleProp.high,
            comparator: function (prior, current) {
                return current > prior + 0.0003;
            }
        }],
        markDate: markLocationType.maxValue,
        valueType: candleProp.high,
        iterateFromLast: ["2.2"],
        iterationOffset: 0,
        markPrice: markPriceType.candleHigh,
        parent: "2",
        incSequence: 1, // Increment the x at 16.x
        sequenced: true
    };

    markings["15.Y"] = Object.assign({}, markings["15.X"]);
    markings["15.Y"].initialCondition.targets = markings["15.Y"].iterateFromLast = ["1.3"];
    markings["15.Y"].parent = "1";

    markings["16.Y"] = Object.assign({}, markings["16.X"]);
    markings["16.Y"].initialCondition.targets = markings["16.Y"].iterateFromLast = ["1.2"];
    markings["16.Y"].markConditions = [{
        type: eventType.markPlaced,
        markType: "1.3"
    }];
    markings["16.Y"].parent = "1";

    var peakMarkSequence = 1;
    var MAX_PEAK_SEQUENCE = 5;

    function prepareSequencedMark(newMark, eventData) {
        var markType = newMark.markType;

        if (markings[markType].sequenced) {

            var parent_mark = markings[markType].parent;

            if (placedMarks[markType] && placedMarks[markType].length &&
                placedMarks[parent_mark] && placedMarks[parent_mark].length) {

                var last_placed_mark = placedMarks[markType][placedMarks[markType].length - 1];

                var last_placed_parent = placedMarks[parent_mark][placedMarks[parent_mark].length - 1];

                if (markings[markType].incSequence && placedMarks[markType] &&
                    last_placed_mark.markAt.date > last_placed_parent.markAt.date &&
                    last_placed_mark.markAt.price + 0.0003 < eventData.candle.close)
                    peakMarkSequence = (peakMarkSequence % MAX_PEAK_SEQUENCE) + 1;
            }
            newMark.displayText = markType.slice(0, -1) + peakMarkSequence;
            newMark.trendLine = true;
        }
    }

    function registerSequencedSubMarkingsEvents() {
        // Handles black/green candles  that intersect 15.x/16.x trend lines, respectively
        var parentToMark = {};
        var eventTypeToMark = {};
        eventTypeToMark[eventType.greenCandleAdded] = '16.';
        eventTypeToMark[eventType.blackCandleAdded] = '15.';
        parentToMark["2"] = "X";
        parentToMark["1"] = "Y";


        function listener(eventData) {
            var baseMark = eventTypeToMark[eventData.type] + parentToMark[currentParent]; //eventData.type == eventType.greenCandleAdded ? "16.X" : "15.X";
            var cooldown = 1000 * 60 * 5;

            // no parent or no base
            if (!currentParent ||
                !placedMarks[baseMark] ||
                currentParent !== markings[baseMark].parent ||
                !placedMarks[baseMark].length)
                return;
            var lastBaseMark = placedMarks[baseMark][placedMarks[baseMark].length - 1];
            var lastParentMark = placedMarks[currentParent][placedMarks[currentParent].length - 1];
            // base irrelevant
            if (lastBaseMark.markAt.date < lastParentMark.markAt.date)
                return;

            var priceThreshold = lastBaseMark.markAt.price;

            // candle did not cross the base threshold
            if ((eventData.type == eventType.greenCandleAdded && eventData.candle.high < priceThreshold) ||
                (eventData.type == eventType.blackCandleAdded && eventData.candle.low > priceThreshold)) return;

            // Cool down between marks
            var markDate = new Date(eventData.candle.date).getTime();
            if (markings[baseMark].latest && markDate - markings[baseMark].latest < cooldown) return;
            markings[baseMark].latest = markDate;

            var newMark = {
                markType: baseMark,
                displayText: lastBaseMark.displayText,
                markAt: {
                    price: eventData.type == eventType.greenCandleAdded ? eventData.candle.high : eventData.candle.low,
                    date: eventData.candle.date
                },
                trendLine: false
            };

            var newEventData = {
                mark: newMark,
                placedMarks: placedMarks,
                date: eventData.date,
                candle: eventData.candle,
                averagesData: eventData.averagesData,
                index: eventData.index,
                type: eventType.markPlaced
            };

            markUtils.emitMarkSavedEvent(newEventData);
        }
        // Handle 16.x children
        eventRegistration(eventType.greenCandleAdded, listener);

        // Handle 15.x children
        eventRegistration(eventType.blackCandleAdded, listener);
    }

    /*markings["16"] = {
        markEvent: eventType.greenCandleAdded,
        markConditions: [{
            type: eventType.markPlaced,
            markType: "2.2"
        }],
        markDate: markLocationType.minuteOffset,
        offset: -1,
        markPrice: markPriceType.candleHigh,
        parent: "2"
    };*/

    var currentParent = null;

    var placedMarks = {};
    var state = null;
    var stateStartIndex = 0;
    var stateChangeDate = null;

    for (var i in markings) {
        placedMarks[i] = [];
    }

    function performMarkEventHandlerGenerator(markType, markConditionEventType, markCondition) {

        if (markConditionEventType == eventType.intersection)
            return intersectionEventHandlerGenerator(markType, markCondition);
        if (markConditionEventType == eventType.trendAscending)
            return trendEventHandlerGenerator(markType, trendType.descending);
        if (markConditionEventType == eventType.trendDescending)
            return trendEventHandlerGenerator(markType, trendType.ascending);
        if (markConditionEventType == eventType.markPlaced)
            return markPlacedEventHandlerGenerator(markType, markCondition);
        if (markConditionEventType == eventType.blackCandleAdded)
            return simpleEventHandlerGenerator(markType);
        if (markConditionEventType == eventType.greenCandleAdded)
            return simpleEventHandlerGenerator(markType);
    }

    function intersectionEventHandlerGenerator(markType, markConditions) {

        return function (eventData) {

            if (!checkInitialConditions(markType, eventData.index))
                return;

            var watchedIntersections = [];

            for (var cond = 0; cond < markConditions.length; cond++) {
                if (markConditions[cond].type == eventType.intersection) {
                    watchedIntersections.push(markConditions[cond]);
                }
            }

            var conditionsSatisfied = 0;

            for (var i = 0; i < watchedIntersections.length; i++) {
                var watchedIntersection = watchedIntersections[i];
                if (eventData.intersections[watchedIntersection.source].length > 0) {

                    // Intersections of the watched source e.g the purple average
                    var relevantIntersections = eventData.intersections[watchedIntersection.source];

                    for (var j = 0; j < relevantIntersections.length; j++) {
                        if (relevantIntersections[j].target == watchedIntersection.target &&
                            relevantIntersections[j].dif >= watchedIntersection.difAtLeast) {
                            conditionsSatisfied++;
                        }
                    }
                }
            }

            if (watchedIntersections.length == conditionsSatisfied) {

                addNewMark(markType, eventData);
            }
        }
    }

    function simpleEventHandlerGenerator(markType) {
        return function (eventData) {

            if (eventData.type === eventType.blackCandleAdded && markType === '2.3' && eventData.date === "2018-05-28 13:35:00")
                console.log("BREAK");
            if (!checkInitialConditions(markType, eventData.index))
                return;

            if (!checkSpecialConditions(markType, eventData))
                return;

            addNewMark(markType, eventData);
        }
    }

    function trendEventHandlerGenerator(markType, opposeTrend) {

        /*var comparators = {};
        comparators[trendType.ascending] = function (open, close) {return open <= close;};
        comparators[trendType.descending] = function (open, close) {return open > close;};*/

        return function (eventData) {

            if (!checkInitialConditions(markType, eventData.index) ||
                !checkSpecialConditions(markType, eventData))

                return;

            // This code checks that the trend switches since the iteration index
            // which means look for Sin like trend and not just Linear trend

            /*var startIndex = getIterationStartIndex(markType);

            if (startIndex == -1)
                return;

            for (var i = startIndex, candleSequence = 0;
                 i < eventData.index && candleSequence < 2;
                 i++) {

                if (comparators[opposeTrend](eventData.averagesData[i].candle.open,
                                             eventData.averagesData[i].candle.close))
                    candleSequence++;
                else
                    candleSequence = 0;
            }

            if (candleSequence > 1)*/

            addNewMark(markType, eventData);
        };
    }

    function markPlacedEventHandlerGenerator(markType, markCondition) {
        return function (eventData) {

            if (eventData.date == "2017-09-06 02:38:00" && markType == "16.X")
                console.log("BREAK");

            if (!checkInitialConditions(markType, eventData.index) ||
                !checkSpecialConditions(markType, eventData))
                return;

            var markPlacedCondition = null;

            for (var cond = 0; cond < markings[markType].markConditions.length; cond++) {
                if (markings[markType].markConditions[cond].type == eventType.markPlaced)
                    markPlacedCondition = markings[markType].markConditions[cond];
            }

            if (markPlacedCondition.markType == eventData.mark.markType) {
                console.log("Mark trigger condition was met for mark type: " + markType + " at " + eventData.date);
                addNewMark(markType, eventData);
            }
        }
    }

    function addNewMark(markType, additionalData) {



        var newMark = {
            markType: markType,
            index: additionalData.index
        };

        prepareSequencedMark(newMark, additionalData);

        newMark.markAt = markLocationStrategies(markType, additionalData);


        if (newMark.markAt && checkInitialConditions(newMark.markType, newMark.markAt.index)) {
            newMark.index = newMark.markAt.index;
            searchAndFixOverlappingMarks(newMark);
            placedMarks[markType].push(newMark);

            if (markings[markType].parent == IS_PARENT) {
                currentParent = markType;
                peakMarkSequence = 1;
            }

            if (markings[markType].changeState) {
                state = markings[markType].changeState;
                stateChangeDate = additionalData.date;
                stateStartIndex = newMark.markAt.index;
            }

            var newEventData = {
                mark: newMark,
                placedMarks: placedMarks,
                date: additionalData.date,
                candle: additionalData.candle,
                averagesData: additionalData.averagesData,
                index: newMark.index,
                type: eventType.markPlaced
            };

            markUtils.emitMarkPlacedEvent(newEventData);
            markUtils.emitMarkSavedEvent(newEventData);
            console.log("New mark was born! " + markType + " at " + additionalData.date);
        }
    }

    function checkInitialConditions(markType, currentIndex) {

        if (markings[markType].parent != ANY_PARENT && markings[markType].parent != IS_PARENT &&
            markings[markType].parent != currentParent) return false;

        if (markings[markType].iterationState && markings[markType].iterationState != state)
            return false;

        if (!markings[markType].initialCondition)
            return true;


        /**
         * Must appear after, means that there must be an appearance of at least one of the targets after the last time
         * this new mark was placed in order to place it again
         */
        if (markings[markType].initialCondition.type == conditionType.appearsAfter) {
            var lastPlacedMarkIndex = placedMarks[markType].length > 0 ?
                placedMarks[markType][placedMarks[markType].length - 1].index : 0;

            var targets = markings[markType].initialCondition.targets;
            var minimalMinutesDif = markings[markType].initialCondition.minutesDifAtLeast;

            for (var i = 0; i < targets.length; i++) {
                var currTarget = targets[i];

                if (placedMarks[currTarget].length == 0 && +markType > +currTarget)
                    return false;

                if (placedMarks[currTarget].length == 0)
                    continue;

                var lastIndexOfTarget = placedMarks[currTarget][placedMarks[currTarget].length - 1].index;
                if (
                    lastPlacedMarkIndex < lastIndexOfTarget &&
                    currentIndex - lastIndexOfTarget >= minimalMinutesDif) {

                    return true;
                }
            }

            return false;
        }

        return false;
    }

    function checkSpecialConditions(markType, eventData) {

        var conditionsSatisfied = 0;

        if (!markings[markType].specialConditions) return true;

        function checkCandleColor(currCond, candle) {
            if (!currCond.candleColor)
                return true;

            if (currCond.candleColor == candleColor.black) {
                return candle.close < candle.open;
            } else if (candleColor == candleColor.green) {
                return candle.open <= candle.close;
            }

            console.log("[ERROR] Invalid candle color provided.");
            return false;
        }

        for (var cond = 0; cond < markings[markType].specialConditions.length; cond++) {
            var currCond = markings[markType].specialConditions[cond];

            if (currCond.type == specialConditionType.candleIntersection) {
                var currTarget = (candleProp.hasOwnProperty(currCond.target)) ?
                    eventData.averagesData[eventData.index].candle[currCond.target] :
                    eventData.averagesData[eventData.index].averages[currCond.target];

                var currSource = (candleProp.hasOwnProperty(currCond.source)) ?
                    eventData.averagesData[eventData.index].candle[currCond.source] :
                    eventData.averagesData[eventData.index].averages[currCond.source];

                if (currSource - currTarget >= currCond.difAtLeast &&
                    checkCandleColor(currCond, eventData.averagesData[eventData.index].candle))
                    conditionsSatisfied++;
            }

            var parentMark = markings[markType].parent;
            var currentConditionIsPassThePrior = currCond.type == specialConditionType.passThePrior;
            var priorPrice = placedMarks[markType] && placedMarks[markType].length &&
                placedMarks[parentMark] && placedMarks[parentMark].length &&
                placedMarks[markType][placedMarks[markType].length - 1].markAt.date >
                placedMarks[parentMark][placedMarks[parentMark].length - 1].markAt.date &&
                placedMarks[markType][placedMarks[markType].length - 1].markAt.price;
            var currentPrice = eventData.candle[currCond.targetCandleProp];

            if (currentConditionIsPassThePrior && (!priorPrice || currCond.comparator(priorPrice, currentPrice))) {
                conditionsSatisfied++;
            }
        }

        return conditionsSatisfied == markings[markType].specialConditions.length;
    }

    var eventListeners = {
        intersection: [],
        trendAscending: [],
        trendDescending: [],
        markPlaced: [],
        blackCandleAdded: [],
        greenCandleAdded: [],
        markSaved: []
    };

    function registerMarkingsToEvents() {

        for (var i in markings) {
            if (!markings.hasOwnProperty(i)) continue;
            var markType = i;
            var mark = markings[markType];

            eventRegistration(mark.markEvent,
                performMarkEventHandlerGenerator(markType, mark.markEvent, mark.markConditions));
        }
    }

    function eventRegistration(event, listener) {
        if (eventListeners.hasOwnProperty(event))
            eventListeners[event].push(listener);
    }

    function emitEventFunctionGenerator(event) {

        return function (eventData) {

            for (var i = 0; i < eventListeners[event].length; i++) {
                try {
                    eventListeners[event][i](eventData);
                } catch (err) {
                    console.log("Invalid event handler registered to " + event + " events. Error: " + err.stack);
                }
            }
        }
    }

    function searchAndFixOverlappingMarks(newMark) {

        for (var markType in placedMarks) {

            if (placedMarks[markType].length == 0) continue;

            var placedMarkArray = placedMarks[markType];
            var latestMarkPlaced = placedMarkArray[placedMarkArray.length - 1];

            if (latestMarkPlaced.markAt.date == newMark.markAt.date) {
                fixPriceForOverlappingMarks(newMark, latestMarkPlaced);
            }
        }
    }

    function fixPriceForOverlappingMarks(newMark, oldMark) {
        var MARK_OFFSET_SUB = 0.0001;
        var MARK_OFFSET_ADD = 0.0001;
        var fixPriceStrategy = {};
        fixPriceStrategy[markPriceType.candleHigh] = increasePrice;
        fixPriceStrategy[markPriceType.localMax] = increasePrice;
        fixPriceStrategy[markPriceType.candleLow] = decreasePrice;
        fixPriceStrategy[markPriceType.localMin] = decreasePrice;

        function increasePrice(mark) {
            mark.markAt.price += MARK_OFFSET_ADD;
        }

        function decreasePrice(mark) {
            mark.markAt.price -= MARK_OFFSET_SUB;
        }

        if (fixPriceStrategy[markings[newMark.markType].markPrice] == fixPriceStrategy[markings[oldMark.markType].markPrice])
            fixPriceStrategy[markings[oldMark.markType].markPrice](oldMark);
    }

    function getIterationStartIndex(markType) {
        var iterateFromIndex = -1;

        for (var i = 0; i < markings[markType].iterateFromLast.length; i++) {
            var iterateFromMark = markings[markType].iterateFromLast[i];
            if (placedMarks[iterateFromMark].length == 0) continue;
            var iterationOffset = markings[markType].iterationOffset || 0;

            var lastIndex = placedMarks[iterateFromMark][placedMarks[iterateFromMark].length - 1].index;

            if (markings[markType].iterationState && (markings[markType].iterationState != state ||
                    lastIndex < stateStartIndex)) continue;

            if (iterateFromIndex < lastIndex) {
                iterateFromIndex = lastIndex + iterationOffset;
            }
        }

        // Check if not adopting irrelevant parent
        var parent = markings[markType].parent;
        var lastParentInstance = placedMarks[parent][placedMarks[parent].length - 1];
        if (iterateFromIndex < lastParentInstance.index)
            return -1;

        return iterateFromIndex;
    }

    function markLocationStrategies(markType, additionalData) {

        var strategies = {};
        strategies[markLocationType.intersection] = intersectionMarkLocationStrategy;
        strategies[markLocationType.minuteOffset] = minuteOffsetMarkLocationStrategy;
        strategies[markLocationType.maxDist] = maxDistLocationStrategy;
        strategies[markLocationType.maxValue] = maxValueLocationStrategy;
        strategies[markLocationType.minValue] = minValueLocationStrategy;
        strategies[markLocationType.distThreshold] = distThresholdLocationStrategy;

        return strategies[markings[markType].markDate](markType, additionalData);

        function intersectionMarkLocationStrategy(markType, additionalData) {
            return {
                date: additionalData.date,
                index: additionalData.index,
                price: markPriceStrategies(markType, additionalData, additionalData.index)
            };
        }

        function minuteOffsetMarkLocationStrategy(markType, additionalData) {
            var offsetFromDate = new Date(additionalData.date);
            offsetFromDate.setMinutes(offsetFromDate.getMinutes() + markings[markType].offset);

            return {
                date: dateUtils.formatDate(offsetFromDate) + ' ' + dateUtils.formatTime(offsetFromDate),
                index: additionalData.index + markings[markType].offset,
                price: markPriceStrategies(markType, additionalData, additionalData.index + markings[markType].offset)
            };
        }

        function maxDistLocationStrategy(markType, additionalData) {
            var dist = markings[markType].maxDist;
            var startIndex = getIterationStartIndex(markType);

            if (startIndex == -1) return false;

            var fromTarget = candleProp.hasOwnProperty(dist.from) ?
                additionalData.averagesData[startIndex].candle : additionalData.averagesData[startIndex].averages;
            var toTarget = candleProp.hasOwnProperty(dist.to) ?
                additionalData.averagesData[startIndex].candle : additionalData.averagesData[startIndex].averages;

            var from = fromTarget[dist.from];
            var to = toTarget[dist.to];

            var maxDist = from - to;
            var maxDistIndex = startIndex;

            for (var j = startIndex; j <= additionalData.index; j++) {
                from = fromTarget[dist.from];
                to = toTarget[dist.to];

                if (from - to > maxDist) {
                    maxDist = from - to;
                    maxDistIndex = j;
                }
            }

            return {
                date: additionalData.averagesData[maxDistIndex].date,
                index: maxDistIndex,
                price: markPriceStrategies(markType, additionalData, maxDistIndex)
            }
        }

        function distThresholdLocationStrategy(markType, additionalData) {
            var threshold = markings[markType].threshold;
            var startIndex = getIterationStartIndex(markType);

            if (startIndex == -1) return false;
            var sourceObject, targetObject, sourceValue, targetValue;

            for (var j = startIndex; j <= additionalData.index; j++) {
                sourceObject = candleProp.hasOwnProperty(threshold.source) ?
                    additionalData.averagesData[j].candle : additionalData.averagesData[j].averages;
                targetObject = candleProp.hasOwnProperty(threshold.target) ?
                    additionalData.averagesData[j].candle : additionalData.averagesData[j].averages;

                sourceValue = sourceObject[threshold.source];
                targetValue = targetObject[threshold.target];

                if (sourceValue - targetValue > threshold.difAtLeast) {
                    return {
                        date: additionalData.averagesData[j].date,
                        index: j,
                        price: markPriceStrategies(markType, additionalData, j)
                    };
                }
            }

            return -1;
        }

        function maxValueLocationStrategy(markType, additionalData) {

            var startIndex = getIterationStartIndex(markType);

            if (startIndex == -1) return false;

            var valueTarget = candleProp.hasOwnProperty(markings[markType].valueType) ?
                additionalData.averagesData[startIndex].candle : additionalData.averagesData[startIndex].averages;
            var maxValue = valueTarget[markings[markType].valueType];
            var maxValueIndex = startIndex;

            for (var i = startIndex; i <= additionalData.index; i++) {
                valueTarget = candleProp.hasOwnProperty(markings[markType].valueType) ?
                    additionalData.averagesData[i].candle : additionalData.averagesData[i].averages;
                if (valueTarget[markings[markType].valueType] > maxValue ||
                    (!markings[markType].firstMatch && valueTarget[markings[markType].valueType] == maxValue)) {
                    maxValue = valueTarget[markings[markType].valueType];
                    maxValueIndex = i;
                }
            }

            return {
                date: additionalData.averagesData[maxValueIndex].date,
                index: maxValueIndex,
                price: markPriceStrategies(markType, additionalData, maxValueIndex)
            };
        }

        function minValueLocationStrategy(markType, additionalData) {

            var startIndex = getIterationStartIndex(markType);

            if (startIndex == -1) return false;

            if (startIndex >= additionalData.averagesData.length) {
                console.log("wtf");
                return false;
            }

            var valueTarget = candleProp.hasOwnProperty(markings[markType].valueType) ?
                additionalData.averagesData[startIndex].candle : additionalData.averagesData[startIndex].averages;
            var minValue = valueTarget[markings[markType].valueType];
            var minValueIndex = startIndex;

            for (var i = startIndex; i <= additionalData.index; i++) {
                valueTarget = candleProp.hasOwnProperty(markings[markType].valueType) ?
                    additionalData.averagesData[i].candle : additionalData.averagesData[i].averages;
                if (valueTarget[markings[markType].valueType] <= minValue) {
                    minValue = valueTarget[markings[markType].valueType];
                    minValueIndex = i;
                }
            }

            return {
                date: additionalData.averagesData[minValueIndex].date,
                index: minValueIndex,
                price: markPriceStrategies(markType, additionalData, minValueIndex)
            };
        }


    }

    function markPriceStrategies(markType, data, index) {

        var priceType = markings[markType].markPrice;
        var MARK_OFFSET = 0; //0.0003;
        var strategies = {};

        strategies[markPriceType.candleHigh] = function (data, dataIndex) {
            return data.averagesData[dataIndex].candle.high;
        };

        strategies[markPriceType.candleLow] = function (data, dataIndex) {
            return data.averagesData[dataIndex].candle.low - MARK_OFFSET;
        };

        strategies[markPriceType.localMin] = function (data, dataIndex) {

            var averagesValues = data.averagesData[dataIndex].averages;
            var localMin = data.averagesData[dataIndex].candle.low;

            for (var i in averages) {
                if (averagesValues[i] < localMin)
                    localMin = averagesValues[i];
            }

            return localMin - MARK_OFFSET;
        };

        strategies[markPriceType.localMax] = function (data, dataIndex) {

            var averagesValues = data.averagesData[dataIndex].averages;
            var localMax = data.averagesData[dataIndex].candle.high;

            for (var i in averages) {
                if (averagesValues[i] > localMax)
                    localMax = averagesValues[i];
            }

            return localMax;
        };

        return strategies[priceType](data, index);
    }

    function resetAlgorithmStructures() {
        currentParent = null;
        placedMarks = {};
        state = null;
        stateStartIndex = 0;
        stateChangeDate = null;
        for (var i in markings)
            placedMarks[i] = [];
    }

    markUtils.eventType = eventType;
    markUtils.eventRegistration = eventRegistration;
    markUtils.emitIntersectionEvent = emitEventFunctionGenerator(eventType.intersection);
    markUtils.emitTrendAscendingEvent = emitEventFunctionGenerator(eventType.trendAscending);
    markUtils.emitTrendDescendingEvent = emitEventFunctionGenerator(eventType.trendDescending);
    markUtils.emitBlackCandleAdded = emitEventFunctionGenerator(eventType.blackCandleAdded);
    markUtils.emitGreenCandleAdded = emitEventFunctionGenerator(eventType.greenCandleAdded);
    markUtils.emitMarkPlacedEvent = emitEventFunctionGenerator(eventType.markPlaced);
    markUtils.emitMarkSavedEvent = emitEventFunctionGenerator(eventType.markSaved);
    markUtils.resetAlgorithmStructures = resetAlgorithmStructures;

    registerMarkingsToEvents();
    registerSequencedSubMarkingsEvents();

})(module.exports);