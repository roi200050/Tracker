'use strict';
var formatTime = d3.time.format("%Y-%m-%d %H:%M"),
    formatTimeHMS = d3.time.format("%X"),
    formatDate = d3.time.format("%d-%m-%Y");

// logic of the graph itself
var dim = {
        width: $("#body").width(), // 1670,
        height: $(window).height() * 0.75 // 830
    },
    margin = {
        top: 20,
        right: 20,
        bottom: 50,
        left: 40
    },
    svg_size = {
        width: dim.width - margin.left - margin.right,
        height: dim.height - margin.top - margin.bottom
    };

d3.select("[class='panel panel-default']");

var svg = d3.select("#body").append("svg")
    .attr("width", dim.width)
    .attr("height", dim.height)
    .attr("type", "graph")
    .attr("style", "position: relative");

svg.on("wheel", wheelScrollHandler);

// var scroll = d3.select("#body").append("div")
//     .attr("id", "scroll-x")
//     .attr("draggable","true")
//     .attr("ondragstart", "dragScrollHandler(event, 'start')")
//     .attr("ondrag", "dragScrollHandler(event)")
//     .attr("ondragend", "dragScrollHandler(event, 'end')")
//     .attr("style", "width: "+ dim.width+ "px; height: 25px; position: absolute; top: " + (dim.height - margin.top - margin.bottom) + "px;");

svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var svg_area = svg.append('g')
    .attr('clip-path', 'url(#plotAreaClip)');

svg_area.append('clipPath')
    .attr('id', 'plotAreaClip')
    .append('rect')
    .attr({
        width: svg_size.width,
        height: svg_size.height
    });

// navigator of x axis
// var navWidth = svg_size.width,
//     navHeight = 80 - margin.top - margin.bottom;

// var navChart = d3.select('#body').append('svg')
//     .classed('navigator', true)
//     .attr('width', navWidth + margin.left + margin.right)
//     .attr('height', navHeight + margin.top + margin.bottom)
//     .append('g')
//     .attr('transform', 'translate(0, 0)');

var xScale,
    yScale,
    xAxis,
    yAxis,
    sliderScale,
    slider,
    sliderHandle,
    hoursToKeepCandlesData = 8,
    amountOfOldCandlesToRestore = 240,
    oldCandleDataRestoreInProgress = false,
    // navXScale,
    // navYScale,
    // navXAxis,
    // navData,
    // navLine,
    // series,
    // dataSeries,
    xPad = 20,
    dateMax = new Date(),
    dateMin = new Date(dateMax.getTime() - 1000 * 60 * 26);

var dataWindow = {
    current: 20,
    default: 20,
    interval: 2,
    max: 160,
    offsetY: 0,
    offsetX: 0
};



// var yGaps = [0.0006, 0.0012, 0.0024, 0.0036, 0.0048, 0.006];
var yGaps = [0.0003, 0.0006, 0.0012, 0.0024, 0.0036, 0.0048];
var selectedYGaps = 1;

xScale = d3.time.scale()
    .rangeRound([10, svg_size.width])
    .domain([dateMin, dateMax]);

sliderScale = d3.scale.linear()
    .domain([0, 0])
    .rangeRound([10, svg_size.width])
    .clamp(true);

yScale = d3.scale.linear()
    .range([svg_size.height, 0])
    .domain([1.0000, 1.5000])
    .clamp(true);

var isReplay = true;

/*************************/
/** SCROLLER CODE START **/
/*************************/

// var scroller = d3.select("#body").append("input")
//     .attr("id", "scroller")
//     .attr("type", "range")
//     .attr("min", 0)
//     .attr("max", 0)
//     .attr("value", 0)
//     .attr("width", dim.width);

// var slider = svg.append("g")
//     .attr("class", "slider")
//     .attr("transform", "translate(" + margin.right + "," + (dim.hupdaeight - 20) + ")");

// slider.append("line")
//     .attr("class", "track")
//     .attr("x1", x.range()[0])
//     .attr("x2", x.range()[1])
//   .select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
//     .attr("class", "track-inset")
//   .select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
//     .attr("class", "track-overlay")
//     .call(d3.behavior.drag()
//         .on("dragend", function() { slider.interrupt(); })
//         .on("drag", function() { hue(x.invert(d3.event.x)); }));


// var handle = slider.insert("circle", ".track-overlay")
//     .attr("cl ass", "handle")
//     .attr("r", 9);

// slider.transition() // Gratuitous intro!
//     .duration(750)
//     .tween("hue", function() {
//       var i = d3.interpolate(0, 70);
//       return function(t) { hue(i(t)); };
//     });

// function hue(h) {
//   handle.attr("cx", x(h));
//   console.log(x(h), h);
// }

// /***********************/
// /** SCROLLER CODE END **/
// /***********************/

// // nav x and nav y
// navXScale = d3.time.scale()
//     .rangeRound([0, navWidth])
//     .domain([dateMin, dateMax]);

// navYScale = d3.scale.linear()
//     .range([navHeight, 0])
//     .domain([1.0000, 1.5000]);

// navData = d3.svg.area()
//     .x(function(d) {
//         return navXScale(new Date(d.date)); // d.date
//     })
//     .y0(navHeight)
//     .y1(function(d) {
//         return navYScale(d.close);
//     });

// navLine = d3.svg.line()
//     .x(function(d) {
//         return navXScale(new Date(d.date)); // d.date
//     })
//     .y(function(d) {
//         return navYScale(d.close);
//     });

// var navDataSvg = navChart.append('path')
//     .attr('class', 'data');

// var navLineSvg = navChart.append('path')
//     .attr('class', 'line');

// var viewport = d3.svg.brush()
//     .x(navXScale)
//     .on("brush", function() {
//         xScale.domain(viewport.empty() ? navXScale.domain() : viewport.extent());

//         // re-draw chart
//         svg.select('.x.axis').call(xAxis); // update x axis
//         refresh(); // update chart
//     });

// navChart.append("g")
//     .attr("class", "viewport")
//     .call(viewport)
//     .selectAll("rect")
//     .attr("height", navHeight);


operationListener(svg, {
    width: svg_size.width,
    height: svg_size.height,
    x: xScale,
    y: yScale
});

var tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

d3.select("body").on("keydown", keyEventHandler);

initCurrent();
tradeOperationsInit();
addGrid();
addAxis();
addSlider();
dataCalibrate();
initRecordsList();
listen();
initAvg();

var seekInterval = 1000,
    bgRecordFeeder,
    bgDataFeeder,
    bgGraphRefresher;

setInterval(clockHandler, 1000);

// handles clock
function clockHandler() {
    var currTime = new Date();
    d3.select("#clock").text(currTime.toLocaleTimeString());
    currTime = seed || new Date();
    d3.select("#digital_clock").text(currTime.toLocaleTimeString());
}

// stops graph update
function stop() {
    clearInterval(bgDataFeeder);
}

// clears the graphre
function clearGraph() {
    if (seed) seed = undefined;
    d3.selectAll("[type='candle'],[rectype='main'],[rectype='open'],[rectype='close'],[optype='s'],[optype='b'],[type='trade-alert'],[type='mark'],[type='autoMark']").remove();
    initAvg();
}

var scrolling = false;

// updates current candle
function refreshCurrentCandle( /*noUpdate*/ ) {

    var candleStyle = getCandleStyle(),
        currData = JSON.parse(sessionStorage.current || '{}');

    /*if (!scrolling && !noUpdate)
        updateHandle(dataWindow.offsetY);*/

    currData.close = JSON.parse(sessionStorage.latestDatum || '{}');
    svg.select("[rid='current'][rectype='mainc']")
        .on("mouseover", function () {
            tooltip.transition()
                .duration(200)
                .style("opacity", 0.9);
            tooltip.html(formatTime(new Date(currData.date)) +
                    "<br/>Open: " + currData.open +
                    "<br/>High: " + currData.high +
                    "<br/>Low: " + currData.low +
                    "<br/>Close: " + currData.close
                )
                .style("left", (d3.event.pageX) + "px")
                .style("top", (d3.event.pageY - 28) + "px");
        })
        .transition().duration(100)
        .attr("data", candleStyle.main.data(currData))
        .attr("date", candleStyle.main.date(currData))
        .attr("y", candleStyle.main.y(currData))
        .attr("x", candleStyle.main.x(currData))
        .attr("height", candleStyle.main.height(currData))
        .attr("width", candleStyle.main.width(currData))
        .style("fill", candleStyle.main.fill(currData))
        .attr("height", function () {
            return (yScale(currData.low) - yScale(currData.high));
        });

    svg.select("[rid='current'][rectype='closec']").transition().duration(100)
        .attr("y", candleStyle.close.y(currData))
        .attr("x", candleStyle.close.x(currData))
        .attr("height", candleStyle.close.height(currData))
        .attr("width", candleStyle.close.width(currData))
        .attr("date", candleStyle.close.date(currData))
        .attr("p", function () {
            return currData.close != "" ? currData.close : JSON.parse(sessionStorage.latestDatum);
        })
        .style('fill', candleStyle.main.fill(currData));

    svg.select("[rid='current'][rectype='openc']").transition().duration(100)
        .attr("y", candleStyle.open.y(currData))
        .attr("x", candleStyle.open.x(currData))
        .attr("height", candleStyle.open.height(currData))
        .attr("width", candleStyle.open.width(currData))
        .attr("date", candleStyle.open.date(currData))
        .attr("p", candleStyle.open.p(currData))
        .style('fill', candleStyle.main.fill(currData));

    svg.select("[rid='current'][type='line'").transition().duration(100)
        .attr("x1", 0)
        .attr("x2", dim.width - margin.left - margin.right)
        .attr("y1", yScale(JSON.parse(sessionStorage.latestDatum)))
        .attr("y2", yScale(JSON.parse(sessionStorage.latestDatum)));

    svg.select("[rid='current'][type='rect']").transition().duration(100)
        .attr("x", svg_size.width)
        .attr("y", yScale(JSON.parse(sessionStorage.latestDatum)) - 7.5);

    svg.select("[rid='current'][type='text']").transition().duration(100)
        .attr("x", svg_size.width)
        .attr("y", yScale(JSON.parse(sessionStorage.latestDatum)) + 4.5)
        .text(JSON.parse(sessionStorage.latestDatum));

    var timeNowString = currData.date;
    var dateNow = new Date(timeNowString);

    if (allData.length) {
        var recent = new Date(allData[allData.length - 1].date);
        if (dateNow - recent != 60000) {
            lostData = dateNow;
        }
    }

    return currData;
}

function addData(data) {
    if (data.length > 0) {
        var myGroupsEnter = svg.selectAll('svg[type="graph"]').data(data).enter().append("g");
        addCandles(myGroupsEnter);
    }
}

function removeOldCandles(dateNow) {

    if (oldCandleDataRestoreInProgress) return;

    var newestCandleDateInWindow = new Date(dateNow.getTime() - (dataWindow.offsetY * 60000 * (dataWindow.interval / 2)));
    var oldestCandleDate = new Date(newestCandleDateInWindow.getTime() - 1000 * 60 * 13 * dataWindow.interval);
    if (oldestCandleDate && dateNow) {

        // calculate 8 hours from the oldest candle
        var hoursBeforeOldest = new Date(oldestCandleDate);
        hoursBeforeOldest.setHours(hoursBeforeOldest.getHours() - hoursToKeepCandlesData);

        // Changed to 51 minutes to debug (50 candles required to create the longest average object)
        //hoursBeforeOldest.setMinutes(hoursBeforeOldest.getMinutes() - 51);

        var maxCandlesCount = (new Date(dateNow).getTime() - hoursBeforeOldest.getTime()) / 60000;

        if (Number.isNaN(maxCandlesCount)) {
            console.log("Error while cleaning old candles. Function parameters are invalid. [graphManager.removeOldCandles]");
            return;
        }

        if (allData.length > maxCandlesCount) {
            var redundantData = allData.splice(0, allData.length - maxCandlesCount);
            d3.selectAll("[type='candle']").filter(function (candle) {
                return xScale(new Date(candle.date)) < xScale(hoursBeforeOldest);
            }).remove();
        }
    }
    // TODO:: Read candles from server to fill the gap
}

//************************************
// Data style
//************************************
function getCandleStyle() {
    var MAIN_WIDTH = 2,
        OPEN_WIDTH = xPad,
        CLOSE_WIDTH = xPad,
        OPEN_X_OFFSET = MAIN_WIDTH - OPEN_WIDTH,
        CLOSE_X_OFFSET = 0;

    return {
        main: {
            y: function (d) {
                return (yScale(d.high));
            },
            x: function (d) {
                return xScale(new Date(d.date));
            },
            height: function (d) {
                return (yScale(d.low) - yScale(d.high));
            },
            width: function (d) {
                return 2;
            },
            fill: function (d) {
                return d.open > d.close ? 'rgb(0,0,0)' : 'rgb(0,255,0)';
            },
            data: function (d) {
                return JSON.stringify(d);
            },
            date: function (d) {
                return JSON.stringify(d.date);
            }
        },
        open: {
            y: function (d) {
                return (yScale(d.open));
            },
            x: function (d) {
                return xScale(new Date(d.date)) + OPEN_X_OFFSET;
            },
            x_offset: function () {
                return OPEN_X_OFFSET;
            },
            height: function () {
                return 2;
            },
            width: function () {
                return OPEN_WIDTH;
            },
            date: function (d) {
                return d.date;
            },
            p: function (d) {
                return d.open;
            }
        },
        close: {
            y: function (d) {
                return (yScale(d.close));
            },
            x: function (d) {
                return xScale(new Date(d.date)) + CLOSE_X_OFFSET;
            },
            x_offset: function () {
                return CLOSE_X_OFFSET;
            },
            height: function () {
                return 2;
            },
            width: function () {
                return CLOSE_WIDTH;
            },
            date: function (d) {
                return d.date;
            },
            p: function (d) {
                return (d.close != undefined && d.close != "") ? d.close : d.open;
            }
        }
    };
}

function getAutoMarkStyle() {

    var MARK_RADIUS = 10;
    var MARK_FILL = "none";
    var MARK_STROKE = "red";
    var MARK_Y_PAD = -5;
    return {
        cx: function (mark) {
            return xScale(new Date(mark.markAt.date))
        },
        //cy: function(mark) {return  yScale(+mark.markAt.price)},
        cy: function (price) {
            return yScale(+price) + yScale(yScale.invert(MARK_Y_PAD + MARK_RADIUS));
        },
        r: function () {
            return MARK_RADIUS
        },
        fill: function () {
            return MARK_FILL
        },
        stroke: function () {
            return MARK_STROKE
        }
    }
}

//************************************
// Data update
//************************************

// listening to new prices
function listen() {
    d3.xhr('/datum').get(function (err, rawData) {
        toggleStream();
    });
}

bgGraphRefresher = setInterval(graphRefreshInterval, 500);

// Refreshes the graph at set intervals, avoid multiple method calls to refresh
function graphRefreshInterval() {

    if (allData.length < 1) return;

    var currentCandle;

    refreshCandles();
    updateShapesLocations();
    updateAvg();
    updateFollowTrades();
    updateAutoMarkLocations();

    currentCandle = refreshCurrentCandle();

    var dateNow = new Date(currentCandle.date || new Date());

    updateXAxis(dateNow);
    updateYAxis(+currentCandle.close);
    fixGrid();
    updateSlider();
    if (!scrolling)
        sliderHandle.attr("x", Math.max(sliderScale(dataWindow.offsetY) - sliderHandle.attr("width"), 0));

    removeOldCandles(dateNow);
}

// refreshes the candles and the markings
function refreshCandles() {
    //setTimeout(function() {
    var candleStyle = getCandleStyle();
    var mainCandles = svg.selectAll("[rectype='main']");

    mainCandles.transition().duration(100)
        .attr("x", function () {
            return xScale(new Date(JSON.parse(this.getAttribute("data")).date));
        })
        .attr("y", function () {
            return yScale(JSON.parse(this.getAttribute("data")).high);
        })
        .attr("height", function () {
            var data = JSON.parse(this.getAttribute("data"));
            return candleStyle.main.height(data);
        });
    svg.selectAll("[rectype='open']").transition().duration(100)
        .attr("y", function () {
            return yScale(this.getAttribute("p"));
        })
        .attr("x", function () {
            return xScale(new Date(this.getAttribute("date"))) + candleStyle.open.x_offset();
        })
        .attr("width", candleStyle.open.width);
    svg.selectAll("[rectype='close']").transition().duration(100)
        .attr("y", function () {
            return yScale(this.getAttribute("p"));
        })
        .attr("x", function () {
            return xScale(new Date(this.getAttribute("date"))) + candleStyle.close.x_offset();
        })
        .attr("width", candleStyle.close.width);

    svg.selectAll("[optype='b']").transition().duration(100)
        .attr("x", function () {
            return xScale(new Date(this.getAttribute("date"))) + OPERATION_PAD.x.b;
        })
        .attr("y", function () {
            return yScale(this.getAttribute("close")) + OPERATION_PAD.y.b;
        });
    svg.selectAll("[optype='s']").transition().duration(100)
        .attr("x", function () {
            return xScale(new Date(this.getAttribute("date"))) + OPERATION_PAD.x.s;
        })
        .attr("y", function () {
            return yScale(this.getAttribute("close")) + OPERATION_PAD.y.s;
        });

    svg.selectAll("[type='bend']").transition().duration(100)
        .attr("x", function () {
            return xScale(new Date(this.getAttribute("date"))) + OPERATION_PAD.x.b;
        })
        .attr("y", function () {
            var up = this.getAttribute('bend') === 'up';
            return yScale(this.getAttribute("data")) + ((up ? 1 : 0) * OPERATION_PAD.y.b);
        });

    svg.selectAll("[type='mark']").transition().duration(100)
        .attr("x", function () {
            return xScale(new Date(this.getAttribute("date"))) + OPERATION_PAD.x.markrect;
        })
        .attr("y", function () {
            return yScale(this.getAttribute("price")) + OPERATION_PAD.y.markrect;
        });

    svg.selectAll("[type='mark'] > circle").transition().duration(100)
        .attr("cx", function () {
            return xScale(new Date(this.parentNode.getAttribute("date"))) + OPERATION_PAD.x.markcirc;
        })
        .attr("cy", function () {
            return yScale(this.parentNode.getAttribute("price")) + OPERATION_PAD.y.markcirc;
        });

    svg.selectAll("[type='mark'] > text").transition().duration(100)
        .attr("x", function () {
            return xScale(new Date(this.parentNode.getAttribute("date"))) + OPERATION_PAD.x.marktext;
        })
        .attr("y", function () {
            return yScale(this.parentNode.getAttribute("price")) + OPERATION_PAD.y.marktext;
        });

    svg.selectAll("[type='trade-alert']").transition().duration(100)
        .attr("x", function () {
            return xScale(new Date(this.getAttribute("date"))) + OPERATION_PAD.x[this.getAttribute("trade-type")];
        })
        .attr("y", function () {
            var reason = +(this.getAttribute("reason"));
            if (reason === 1) {
                return yScale(this.getAttribute("startPrice")) + OPERATION_PAD.y[this.getAttribute("trade-type")];
            } else {
                return yScale(this.getAttribute("price"));
            }
        });

    // var ticks = d3.selectAll('#grid_y .tick')[0];
    // var length = Math.max(1, allData.length - ticks.length + 5);
    // d3.select("#scroller")
    //     .attr("max", length)
    //     .attr("value", dataWindow.offsetY);

    // // var thumbWidth = dim.width;
    // // if (length) {
    // //     thumbWidth = dim.width / length;
    // // }

    // // console.log(thumbWidth);
    // // d3.select("#scroller::-webkit-slider-thumb")
    // //     .style("width", thumbWidth + "px !important");



    //}, 0);
}

function updateFollowTrades() {
    var current = JSON.parse(sessionStorage.current || '{}');
    var value = +JSON.parse(sessionStorage.latestDatum);
    var activeTrades = d3.keys(followTrades);
    var date = playback.seedDataLoaded ? new Date(current.date) : new Date();

    activeTrades.forEach(function (id) {

        var follow = followTrades[id];
        if (new Date(follow.endDate) <= date) {
            removeOperationAlert(false, id);
            return;
        }

        if (!follow.best) {
            follow.best = value;
        } else {
            follow.best = follow.type == 'b' ? Math.max(follow.best, value) : Math.min(follow.best, value);
        }

        var startValue = +follow.startPrice;
        var bestDiff = follow.best - startValue;
        var currDiff = value - startValue;

        var diffRatio = !bestDiff || !currDiff ? 0 : currDiff / bestDiff;

        if (follow.type == 's') {
            bestDiff *= -1;
            currDiff *= -1;
        }

        if ((bestDiff >= 0.0002 && diffRatio <= 1 / 3) ||
            (bestDiff <= 0.00015 && Math.abs(currDiff) >= 0.00015)) {
            delete followTrades[id];
            follow.id = id;
            follow.price = value;
            follow.date = date;
            follow.startPrice = startValue;
            addOperationAlert(follow, (bestDiff >= 0.0002 && diffRatio <= 1 / 3) ? 2 : 1);
        }

    });
}


// fixes x axis
function updateXAxis(dateMax) {
    dateMax = new Date(dateMax.getTime() - (dataWindow.offsetY * 60000 * (dataWindow.interval / 2)));
    var maxDate = dateMax;
    // maxDate.setMinutes(maxDate.getMinutes() + 2 - (dateMax.getMinutes() % 2));
    maxDate.setMinutes(maxDate.getMinutes() + 2);
    var minDate = new Date(maxDate.getTime() - 1000 * 60 * 13 * dataWindow.interval);

    // update x axis only if not in scroll mode
    // if (viewport.empty()) {

    // xScale.domain([minDate, maxDate]).nice(d3.time.minute, dataWindow.interval);
    xScale.domain([minDate, maxDate]).nice(d3.time.minute);

    // navXScale.domain([minDate, maxDate]);
    // } else
    //     xScale.domain(viewport.extent());

    // xScale.domain([minDate, maxDate]).nice(d3.time.minute, dataWindow.interval);
    xPad = ((xScale(new Date(minDate.getTime() + 60000)) - xScale(minDate)) / 2) - 1;

    // if (viewport.empty())
    xAxis.ticks(d3.time.minutes, dataWindow.interval).scale(xScale);
    svg.select("g.x.axis").call(xAxis);

    // update x axis only if not in scroll mode
    // if (viewport.empty()) {
    // navXAxis.ticks(d3.time.minutes, dataWindow.interval).scale(navXScale);
    // navChart.select("g.x.axis").call(navXAxis);
    // }
}

// fixes y axis
function updateYAxis(currentPrice) {
    var min = Number.MAX_SAFE_INTEGER, // currentPrice,
        max = Number.MIN_SAFE_INTEGER; //currentPrice;

    if (allData.length <= 0) return;

    var current = allData[allData.length - 1];
    var latestDatum = JSON.parse(sessionStorage.latestDatum);
    if (current && latestDatum) {
        current.high = Math.max(current.high, latestDatum);
        current.low = Math.min(current.low, latestDatum);
    }

    if (dataWindow.offsetY == 0) {
        min = max = +currentPrice;
    }

    var maxIndex = Math.min(allData.length, allData.length + 4 - ((dataWindow.interval * dataWindow.offsetY) / 2));

    if (maxIndex < 0) {
        maxIndex = Math.floor(Math.random() * allData.length);
    }

    var currWindowAmount = 13 * dataWindow.interval + 1;
    var minIndex = Math.max(0, maxIndex - currWindowAmount);


    var maxDate = xScale.domain()[1];
    var minDate = xScale.domain()[0];

    if (allData.length && lostData && lostData >= minDate) {

        while (allData[minIndex] && allData[minIndex + 1] && new Date(allData[minIndex].date) < minDate && new Date(allData[minIndex + 1].date) <= maxDate) {
            minIndex++;
        }

        while (allData[minIndex] && allData[minIndex - 1] && new Date(allData[minIndex].date) >= minDate && new Date(allData[minIndex - 1].date) >= minDate) {
            minIndex--;
        }

        //        while(allData[maxIndex - 1] && allData[maxIndex - 2] && new Date(allData[maxIndex - 1].date) > maxDate && new Date(allData[maxIndex - 2]).date >= minDate) {
        //          maxIndex--;
        //        }
        if (dataWindow.offsetY > 0) {
            maxIndex = minIndex + 1;
            while (allData[maxIndex - 1] && allData[maxIndex] && new Date(allData[maxIndex - 1].date) <= maxDate && new Date(allData[maxIndex].date) <= maxDate) {
                maxIndex++;
            }
        } else if ((new Date(current.date) - new Date(allData[maxIndex - 1].date)) > maxDate - minDate) {
            minIndex = maxIndex;
        }
    }

    if (minIndex >= maxIndex) {
        min = Math.min(current.low, min);
        max = Math.max(current.high, max);
        maxIndex = minIndex + 1;
    }

    for (var i = minIndex; i < maxIndex; i++) {
        if (allData[i]) {
            min = Math.min(allData[i].low, min);
            max = Math.max(allData[i].high, max);
        }
    }

    var minDate = new Date(current.date);
    var maxDate = minDate;
    if (allData.length) {
        if (allData[minIndex])
            minDate = new Date(allData[minIndex].date);
        if (allData[maxIndex - 1])
            maxDate = new Date(allData[maxIndex - 1].date);
    }


    for (var i = 0; i < avgDefinition.length; i++) {
        var lines = avgDefinition[i].lines;
        for (var k = 0; k < lines.length; k++) {
            var line = lines[k]
            for (var j = 0; j < line.length; j++) {
                var date = line[j].x;
                var value = line[j].y;
                if (date >= minDate && date <= maxDate) {
                    min = Math.min(value, min);
                    max = Math.max(value, max);
                }
            }
        }
    }

    currentPrice = min + ((max - min) / 2);
    currentPrice += (dataWindow.offsetX * 0.0002);

    var minPrice = currentPrice - (yGaps[selectedYGaps]),
        maxPrice = currentPrice + (yGaps[selectedYGaps]);

    minPrice = Math.min(minPrice, min - ((max - min) * .2));
    maxPrice = Math.max(maxPrice, max + ((max - min) * .2));


    yScale.domain([minPrice, maxPrice])
        .range([svg_size.height, 0]);

    yAxis.scale(yScale);
    svg.select("g.y.axis").call(yAxis);

}

// adds candles to the graph
function addCandles(selection) {
    var candleStyle = getCandleStyle();
    selection.attr('type', 'candle');

    selection.append("rect")
        .attr("rectype", "main")
        .attr("y", candleStyle.main.y)
        .attr("x", candleStyle.main.x)
        .attr("height", candleStyle.main.height)
        .attr("width", candleStyle.main.width)
        .attr("data", candleStyle.main.data)
        .attr("date", candleStyle.main.date)
        .style("fill", candleStyle.main.fill)
        .on("mouseover", function (d) {
            tooltip.transition()
                .duration(200)
                .style("opacity", 0.9);
            tooltip.html(formatTime(new Date(d.date)) +
                    "<br/>Open : " + d.open +
                    "<br/>High : " + d.high +
                    "<br/>Low : " + d.low +
                    "<br/>Close : " + d.close
                )
                .style("left", (d3.event.pageX) + "px")
                .style("top", (d3.event.pageY - 28) + "px")
                .style("font-size", "23px");
        })
        .on("mouseout", function () {
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
        });

    selection.append("rect")
        .attr("rectype", "open")
        .attr("y", candleStyle.open.y)
        .attr("x", candleStyle.open.x)
        .attr("height", candleStyle.open.height)
        .attr("width", candleStyle.open.width)
        .attr("date", candleStyle.open.date)
        .attr("p", candleStyle.open.p)
        .style('fill', candleStyle.main.fill);

    selection.append("rect")
        .attr("rectype", "close")
        .attr("y", candleStyle.close.y)
        .attr("x", candleStyle.close.x)
        .attr("height", candleStyle.close.height)
        .attr("width", candleStyle.close.width)
        .attr("date", candleStyle.close.date)
        .attr("p", candleStyle.close.p)
        .style('fill', candleStyle.main.fill);
}

//************************************
// Graph build
//************************************
function initCurrent() {
    svg.append("g").append("rect").attr("rid", "current").attr("rectype", "mainc");
    svg.append("g").append("rect").attr("rid", "current").attr("rectype", "openc");
    svg.append("g").append("rect").attr("rid", "current").attr("rectype", "closec");
    svg.append("g").append("line").attr("rid", "current").attr("type", "line").attr("stroke", "blue");
    var currPriceRect = svg.append("g");
    currPriceRect.append("rect")
        .attr("rid", "current")
        .attr("type", "rect")
        .attr("fill", "blue")
        .attr("width", 50)
        .attr("height", 15)
        .attr("y", -15);
    currPriceRect.append("text")
        .attr("fill", "white")
        .attr("rid", "current")
        .attr("type", "text")
        .attr("font-size", "13px");
}


// adds the x-axis and y-axis to the graph on creation
function addAxis() {
    // X Axis
    xAxis = d3.svg.axis()
        .scale(xScale)
        .orient("bottom")
        .ticks(d3.time.minutes, 2)
        .tickFormat(d3.time.format('%d %b %H:%M'))
        .tickPadding(0);

    svg.append("g")
        .attr("transform", "translate(0, " + (svg_size.height) + ")")
        .attr("class", "x axis")
        .call(xAxis);

    // Y Axis
    yAxis = d3.svg.axis()
        .scale(yScale)
        .orient("right")
        .ticks(30, "")
        .tickFormat(d3.format(".5f"));

    svg.append("g")
        .attr("class", "y axis")
        .attr("transform", "translate(" + (svg_size.width) + ", 0)")
        .call(yAxis);

}

function addSlider() {
    slider = svg.append("g")
        .attr("id", "slider")
        .attr("transform", "translate(" + 0 + "," + (svg_size.height + 30) + ")");


    var drag = d3.behavior.drag()
        .on("dragstart", function () {
            scrolling = true;
            updateHandle(sliderScale.invert(d3.event.sourceEvent.x - 193));
        })
        .on("drag", function () {
            updateHandle(sliderScale.invert(d3.event.x));
        })
        .on("dragend", function () {
            scrolling = false;
        });

    var tracker = slider.append("rect")
        .attr("class", "track")
        .attr("x", sliderScale.range()[0])
        .attr("width", sliderScale.range()[1] - 10)
        .attr("height", 15)
        .call(drag);
    // .select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
    //   .attr("class", "track-inset")
    // .select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
    //   .attr("class", "track-overlay")
    //   

    // slider.append("line")
    //     .attr("class", "track")
    //     .attr("x1", sliderScale.range()[0])
    //     .attr("x2", sliderScale.range()[1])
    //   .select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
    //     .attr("class", "track-inset")
    //   .select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
    //     .attr("class", "track-overlay")
    //     .call(d3.behavior.drag()
    //         .on("dragstart", function() { updateHandle(sliderScale.invert(d3.event.sourceEvent.x - 193)); })
    //         .on("drag", function() { updateHandle(sliderScale.invert(d3.event.x)); }));


    sliderHandle = slider.insert("rect", ".track-overlay")
        .attr("class", "handle")
        .attr("x", sliderScale.range()[0])
        .attr("width", svg_size.width)
        .attr("height", 15)
        .call(drag);
}

function updateHandle(x) {
    sliderHandle.attr("x", Math.max(sliderScale(x) - sliderHandle.attr("width"), 0));

    // Restore old data if reached the left end of the slider
    if (sliderHandle.attr("x") <= 15 && !oldCandleDataRestoreInProgress && allData.length > 0)
        loadCandleDataByTime(allData[0].date, amountOfOldCandlesToRestore);
    dataWindow.offsetY = Math.floor(x);
    /*setTimeout(function() {
      refresh();
    }, 0);
    refreshCurrent(true);*/
}

/**BACKUP**/
/*
function updateSlider() {
    var data = allData.concat([]);
    var current = JSON.parse(sessionStorage.current || 'null');
    if (current) {
        data.push(current);
    }
    var indexMax = Math.max(data.length, 0);
    
    var diff = new Date(data[data.length - 1].date) - new Date(data[0].date);
    var minDiff = Math.round(diff / 60000) + 1;

    //var dataCount = Math.max(data.length, 1);
    var dataCount = Math.max(minDiff, 1);
    dataCount /= (dataWindow.interval / 2);
    dataCount = dataCount - (dataWindow.interval / 2) + 1;
    sliderScale.domain([Math.max(dataCount, 0), 0]);
    //var handleWidth = Math.max(20, Math.round(svg_size.width / dataCount));
    var handleWidth = Math.max(30, Math.round(svg_size.width / Math.max(dataCount, 1)));
    handleWidth = Math.min(handleWidth, svg_size.width);
    sliderScale.rangeRound([10 + handleWidth, svg_size.width])
    sliderHandle
        .attr("width", handleWidth);
        //.attr("x", sliderHandle.attr("x") - handleWidth);
}
*/

function updateSlider() {
    var data = allData;
    var current = JSON.parse(sessionStorage.current || 'null');
    var indexMax = Math.max(current ? data.length + 1 : data.length, 0);

    var diff = new Date(current ? current.date : data[data.length - 1].date) - new Date(data.length ? data[0].date : current.date);
    var minDiff = Math.round(diff / 60000) + 1;

    //var dataCount = Math.max(data.length, 1);
    var dataCount = Math.max(minDiff, 1);
    dataCount /= (dataWindow.interval / 2);
    dataCount = dataCount - (dataWindow.interval / 2) + 1;
    sliderScale.domain([Math.max(dataCount, 0), 0]);
    //var handleWidth = Math.max(20, Math.round(svg_size.width / dataCount));
    var handleWidth = Math.max(30, Math.round(svg_size.width / Math.max(dataCount, 1)));
    handleWidth = Math.min(handleWidth, svg_size.width);
    sliderScale.rangeRound([10 + handleWidth, svg_size.width])
    sliderHandle
        .attr("width", handleWidth);
    //.attr("x", sliderHandle.attr("x") - handleWidth);
}

// configures x-axis
function grid_x_axis() {
    return d3.svg.axis()
        .scale(xScale)
        .orient("bottom")
        .ticks(15);
}

// configures y-axis
function grid_y_axis() {
    return d3.svg.axis()
        .scale(yScale)
        .orient("left")
        .ticks(30);
}

// adds the grid behind the candles
function addGrid() {
    svg.append("g")
        .attr("class", "grid")
        .attr("id", "grid_y")
        .style("stroke-dasharray", ("3, 3"))
        .attr("transform", "translate(0," + svg_size.height + ")")
        .call(grid_x_axis()
            .tickSize(-svg_size.height, 0, 0)
            .tickFormat(""));

    svg.append("g")
        .attr("class", "grid")
        .attr("id", "grid_x")
        .attr("transform", "scale(-1) translate(" + -svg_size.width + "," + -svg_size.height + ")")
        .style("stroke-dasharray", ("3, 3"))
        .call(grid_y_axis()
            .tickSize(-svg_size.width + 10, 0, 0)
            .tickFormat(""));
}

// updates the grid due to new price
function fixGrid() {
    svg.select("#grid_y")
        .call(grid_x_axis().ticks(d3.time.minutes, dataWindow.interval / 2)
            .tickSize(-svg_size.height, 0, 0)
            .tickFormat(""));

    svg.select("#grid_x")
        .call(grid_y_axis()
            .tickSize(-svg_size.width + 10, 0, 0)
            .tickFormat(""));
}

//************************************
// Operation handler
//************************************

function changeYGap(delta) {
    if (selectedYGaps + delta == 0)
        d3.select("#decZoomY").attr('disabled', true);
    else
        d3.select("#decZoomY").attr('disabled', undefined);

    if ((selectedYGaps + delta) == (yGaps.length - 1))
        d3.select("#incZoomY").attr('disabled', true);
    else
        d3.select("#incZoomY").attr('disabled', undefined);

    selectedYGaps = Math.max(0, selectedYGaps + delta) % yGaps.length;

    d3.select("#yZoom").text("x" + (selectedYGaps + 1));
}

// increases the zoom
function increaseDataWindow() {
    //var allData = JSON.parse(sessionStorage.allData || '[]');
    if (dataWindow.current < dataWindow.max) {
        dataWindow.current *= 2;
        dataWindow.interval *= 2;
        updateSlider();
        fixWindowOffset();
    }
}

// decreases the zoom
function decreaseDataWindow() {
    if (dataWindow.current > dataWindow.default) {
        dataWindow.current /= 2;
        dataWindow.interval /= 2;
        updateSlider();
        fixWindowOffset();
    }
}

/**BACKUP**/
/*
function fixWindowOffset() {
  var prev = dataWindow.offsetY;
  dataWindow.offsetY = 0;
  var data = allData.concat([]);
  var current = JSON.parse(sessionStorage.current || 'null');
  if (current) {
      data.push(current);
  }
  // var dataCount = data.length / (dataWindow.interval / 2);
  // dataCount = Math.max(dataCount, 1);

  var diff = new Date(data[data.length - 1].date) - new Date(data[0].date);
  var minDiff = Math.round(diff / 60000) + 1;
  var dataCount = minDiff / (dataWindow.interval / 2);

  dataCount = Math.max(dataCount, 1);

  while (prev && (dataCount > dataWindow.offsetY + (dataWindow.interval / 2) - 1)) {
    dataWindow.offsetY += 1;
    prev--;
  }
  refresh();
  refreshCurrent();
}
*/

function fixWindowOffset() {
    var prev = dataWindow.offsetY;
    dataWindow.offsetY = 0;
    var data = allData;
    var current = JSON.parse(sessionStorage.current || 'null');
    // var dataCount = data.length / (dataWindow.interval / 2);
    // dataCount = Math.max(dataCount, 1);

    var latestDate = new Date(current ? current.date : data[data.length - 1].date);
    var oldestDate = new Date(data.length ? data[0].date : current.date);

    var diff = latestDate.getTime() - oldestDate.getTime();

    var minDiff = Math.round(diff / 60000) + 1;
    var dataCount = minDiff / (dataWindow.interval / 2);

    dataCount = Math.max(dataCount, 1);

    while (prev && (dataCount > dataWindow.offsetY + (dataWindow.interval / 2) - 1)) {
        dataWindow.offsetY += 1;
        prev--;
    }

    //refresh();
    //refreshCurrent();

}

// reset offset
function resetOffsets() {
    dataWindow.offsetX = 0;
    dataWindow.offsetY = 0;
}

// initialize new buy/sell
function tradeOperationsInit() {
    d3.select("#buy").on("click", function () {
        performOperation('b', false);
    });
    d3.select("#sell").on("click", function () {
        performOperation('s', false);
    });
    d3.select("#operation_end").on("input", function () {
        this.setAttribute('value', this.value);
    });
}

//************************************
// Auto Marks
//************************************
var latestMarkDate;
var latestMarks = {};

function startAutoMarksListener() {

    // Check for new auto marks interval recommended to set 60000
    var interval = 6000;

    function getMaxDate() {
        if (allData.length == 0)
            return new Date().toISOString();
        return new Date(allData[allData.length - 1].date).toISOString();

    }

    function getMinDate() {
        if (latestMarkDate)
            return latestMarkDate;

        if (allData.length == 0)
            return new Date().toISOString();

        return new Date(allData[0].date).toISOString();
    }

    startMarkFetcher(getMinDate, getMaxDate, onNewMarkCallback, interval);
}

function stopAutoMarksListener() {
    stopMarkFetcher();
}

var autoTrendMarks = {};

var bottomMarks = ['2.3', '2.5', '2.7', '2.13', '15.X', '15.Y'];
var BOTTOM_MARK_PAD = 45;

function placeTrendMarks(targetMark) {

    // 15. 16. new trend code
    if (targetMark.trendLine) {
        var TREND_LINE_START_OFFSET = 0;
        var TREND_LINE_END_OFFSET = 20;
        var TREND_COLOR = 'cyan';

        var baseY = yScale(targetMark.markAt.price);
        if (targetMark.markType.indexOf('15.') !== -1) {
            baseY += BOTTOM_MARK_PAD;
            TREND_COLOR = 'red';
        }

        var trendLine = d3.select("[type='graph']").append("line").attr("type", "dline");
        var price = targetMark.markAt.price;
        var startDate = new Date(targetMark.markAt.date);
        startDate.setMinutes(startDate.getMinutes() + TREND_LINE_START_OFFSET);
        var endDate = new Date(startDate);
        endDate.setMinutes(endDate.getMinutes() + TREND_LINE_END_OFFSET);
        registerKeyListener(trendLine);
        createLine(trendLine, xScale(startDate), yScale(price), xScale(endDate), yScale(price), TREND_COLOR, true);
    }
}
var buttonId = 0;

function onNewMarkCallback(newMark) {

    var overlapping = false;
    // check overlapping
    for (var m in latestMarks)
        if (latestMarks[m].markAt.date === newMark.markAt.date &&
            latestMarks[m].markAt.price === newMark.markAt.price) {
            overlapping = true;
            if (m === newMark.markType)
                return;
        }

    placeTrendMarks(newMark);

    var baseX = xScale(new Date(newMark.markAt.date));
    var baseY = yScale(newMark.markAt.price);
    if (bottomMarks.indexOf(newMark.markType) !== -1)
        baseY += BOTTOM_MARK_PAD;
    latestMarkDate = newMark.createdOn;
    var autoMarkStyle = getAutoMarkStyle();

    if (overlapping) {
        var direction = bottomMarks.indexOf(newMark.markType) !== -1 ? 1 : -1;
        newMark.markAt.price = overlapNewPrice(newMark.markAt.price, direction);
    }

    baseY = autoMarkStyle.cy(newMark.markAt.price);

    var autoMark = svg.append("g")
        .attr("type", "autoMark")
        .attr("date", newMark.markAt.date)
        .attr("price", newMark.markAt.price)
        .attr("markType", newMark.markType);

    autoMark.append("circle")
        .attr("class", "mark-rect")
        .attr('r', '14px')
        .attr('cx', baseX + OPERATION_PAD.x.markcirc)
        .attr('cy', baseY + OPERATION_PAD.y.markcirc)
        .style("stroke", autoMarkStyle.stroke(newMark));

    autoMark.append("text")
        .attr("class", "mark-text")
        .attr("text-anchor", "middle")
        .attr('x', baseX + OPERATION_PAD.x.marktext)
        .attr('y', baseY + OPERATION_PAD.y.marktext)
        .text(newMark.displayText || newMark.markType);

    registerKeyListener(autoMark);
    latestMarks[newMark.markType] = newMark;
    if (true) {//TODO !isReplay
        var listMarksToCheck = ['3.1', '3.2', '4.1', '4.2'];
        listMarksToCheck.forEach(function (element) {
            if (newMark.markType == element) {
                buttonId = buttonId + 1;
                var alertBox = document.getElementById("alertControls")
                var button = document.createElement("button");
                button.setAttribute("id", "Button" + buttonId);
                button.setAttribute("class", "btn btn-default");
                button.setAttribute("type", "button");
                button.addEventListener("mouseover", function () {
                    drawToolbarForAlertBoxButtons(newMark, button.id);
                }, false);
                button.addEventListener("mouseout", function () {
                    tooltip.transition()
                        .duration(500)
                        .style("opacity", 0);
                }, false);
                button.addEventListener("click", function () {
                    scrollToTime(new Date(newMark.markAt.date));
                }, false);

                playAlert();
                button.setAttribute("aria-label", element);
                button.innerHTML = element;
                alertBox.appendChild(button);
                //display the red ring
                var $element = $('body[ng-controller="HomeController"]');
                var $scope = angular.element($element).scope();
                $scope.$apply(function () {
                    $scope.isAlert = true;
                });
                $scope.$apply();
            }
        }, this);
    }
}

function updateAutoMarkLocations() {

    svg.selectAll("[type='autoMark'] > circle").transition().duration(100)
        .attr("cx", function () {
            return xScale(new Date(this.parentNode.getAttribute("date"))) + OPERATION_PAD.x.markcirc;
        })
        .attr("cy", function () {
            var baseY = getAutoMarkStyle().cy(this.parentNode.getAttribute("price"));
            if (bottomMarks.indexOf(this.parentNode.getAttribute("markType")) != -1)
                baseY += BOTTOM_MARK_PAD;
            return baseY + OPERATION_PAD.y.markcirc;
            //return yScale(this.parentNode.getAttribute("price")) + OPERATION_PAD.y.markcirc;
        });

    svg.selectAll("[type='autoMark'] > text").transition().duration(100)
        .attr("x", function () {
            return xScale(new Date(this.parentNode.getAttribute("date"))) + OPERATION_PAD.x.marktext;
        })
        .attr("y", function () {
            var baseY = getAutoMarkStyle().cy(this.parentNode.getAttribute("price"));
            if (bottomMarks.indexOf(this.parentNode.getAttribute("markType")) !== -1)
                baseY += BOTTOM_MARK_PAD;
            return baseY + OPERATION_PAD.y.marktext;
            //return yScale(this.parentNode.getAttribute("price")) + OPERATION_PAD.y.marktext;
        });
}

// Offset 1 for to move to up and -1 to move to down
function overlapNewPrice(oldPrice, direction) {
    return yScale.invert(yScale(oldPrice) + yScale(yScale.invert(getAutoMarkStyle().r() * 3)) * direction);
}



//************************************


//************************************
// Manual Marks
//************************************

function performMark() {
    var date = g.options.x.invert(g.mouse.x);
    var value = g.options.y.invert(g.mouse.y);

    var postData = {
        day: date.toLocaleDateString('en-US'),
        date: date.toLocaleTimeString('en-US'),
        value: value,
        owner: 'Jovani',
        configuration: markValue.configuration
    };

    d3.xhr('/addMark').header("Content-Type", "application/json")
        .post(JSON.stringify(postData), function (err, xhr) {
            if (typeof xhr !== 'undefined' && xhr.status == 200) { // OK
                var mark = JSON.parse(xhr.response);
                addMarkToGraph({
                    id: mark._id,
                    date: date,
                    configuration: markValue.configuration,
                    price: parseFloat(mark.value)
                });
            }
        });
}

function addMarkToGraph(options) {
    var baseX = xScale(options.date);
    var baseY = yScale(options.price);

    var label = "",
        state = "off";
    marks.some(function (mark) {
        var configured = mark.configuration === options.configuration;
        if (configured) {
            label = mark.label;
            state = "on";
        }
        return configured;
    });

    var mark = svg.append('g')
        .attr("type", "mark")
        .attr("class", "mark")
        .attr("label", label)
        .attr("state", state)
        .attr("configuration", options.configuration)
        .attr('data-id', options.id)
        .attr("date", options.date)
        .attr("price", options.price)
        .attr("x", baseX + OPERATION_PAD.x.markrect)
        .attr("y", baseY + OPERATION_PAD.y.markrect)
        .on("mouseover", function (d) {
            tooltip.html(
                "Date: " + options.date.toLocaleDateString('en-US') +
                "<br/>Time: " + options.date.toLocaleTimeString('en-US') +
                "<br/>Price: " + options.price +
                "<br/>Configuration: " + options.configuration +
                "<br/>Label: " + label
            )
            .style("font-size", "23px");
            tooltip.transition()
                .duration(200)
                .style("opacity", 0.9).style("left", (d3.event.pageX) + "px")
                .style("top", (d3.event.pageY - 28) + "px");
        })
        .on("mouseout", function () {
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
        });

    registerKeyListener(mark);
    //registerKeyListener(g.mark.rect, g.mark.start);
    // registerKeyListener(g.mark.text, g.mark.start);

    //  mark.append("rect")
    //    .attr("class", "mark-rect")
    //    .attr("width", "40px")
    //    .attr("height", "18px")
    //    .attr('x', baseX + OPERATION_PAD.x.markrect)
    //    .attr('y', baseY + OPERATION_PAD.y.markrect);

    mark.append("circle")
        .attr("class", "mark-rect")
        .attr('r', '14px')
        .attr('cx', baseX + OPERATION_PAD.x.markcirc)
        .attr('cy', baseY + OPERATION_PAD.y.markcirc);

    mark.append("text")
        .attr("class", "mark-text")
        .attr("text-anchor", "middle")
        .attr('x', baseX + OPERATION_PAD.x.marktext)
        .attr('y', baseY + OPERATION_PAD.y.marktext)
        .text(label);
}

function updateMarksGraph(changedConfig) {
    var labels = d3.keys(changedConfig);

    labels.forEach(function (label) {
        var config = changedConfig[label];

        // turning off marks
        if (!config || config === '') {
            svg.selectAll("[type='mark'][label='" + label + "']")
                .attr("state", "off")
                .attr("label", "");
        } else {
            svg.selectAll("[type='mark'][configuration='" + config + "']")
                .attr("state", "on")
                .attr("configuration", "config")
                .attr("label", label)
                .selectAll("text").text(label);
        }
    })

}

/**OPERATIONS*/
/*************/

// perform buy/sell operation
function performOperation(type, is_custom) {
    if (!sessionStorage.ohlcData && !sessionStorage.current && !is_custom) return;
    var curr_data, postData;

    if (!is_custom) { // regular buy/sell - refer to last datum
        if (sessionStorage.current) {
            curr_data = JSON.parse(sessionStorage.current);
        } else {
            curr_data = JSON.parse(sessionStorage.ohlcData);
            curr_data = curr_data[curr_data.length - 1];
        }
        if (typeof curr_data === 'undefined') return; // prevent client side errors
    }

    var data_date;
    if (is_custom)
        data_date = g.options.x.invert(g.mouse.x);
    else
        data_date = playback.seedDataLoaded ? new Date(curr_data.date) : new Date();

    var minutesToAdd = +Number(d3.select('#operation_end').attr('value')),
        endDate = new Date(data_date.getTime() + (minutesToAdd * 60000)),
        latestDatum = JSON.parse(sessionStorage.latestDatum);

    postData = {
        day: data_date.toLocaleDateString('en-US'),
        init_date: data_date.toLocaleTimeString('en-US'),
        init_value: is_custom ? g.options.y.invert(g.mouse.y) : latestDatum, // curr_data.close,
        owner: 'Jovany',
        end_value: "",
        status: "",
        operation: type,
        end_date: endDate.toLocaleString('en-US')
    };

    postData.regular = !is_custom && !playback.seedDataLoaded; // regular operation
    postData.custom = is_custom; // custom operation
    postData.replay = playback.seedDataLoaded; // operation during replay

    d3.xhr('/addTrade').header("Content-Type", "application/json")
        .post(JSON.stringify(postData), function (err, xhr) {
            if (typeof xhr !== 'undefined' && xhr.status == 200) { // OK
                var trade = JSON.parse(xhr.response);
                addOperationToGraph({
                    serial_number: trade._id,
                    type: type,
                    open_date: data_date,
                    end_date: endDate,
                    is_custom: is_custom,
                    open_price: parseFloat(trade.init_value)
                }, true);
            }
            console.log(d3.xhr.responseText);
        });

    var minutes_to_add = d3.select('#operation_end').attr('value'),
        end_date = endDate.toLocaleString('en-US');
    console.log("Operation end minutes: " + minutes_to_add + " Date: " + end_date);
}

// adds buy/sell view to the graph
function addOperationToGraph(options, follow) {
    var x = xScale(options.open_date) + OPERATION_PAD.x[options.type];
    var y = yScale(options.open_price) + OPERATION_PAD.y[options.type];
    options.x = x;

    svg.append('g')
        .append('image')
        .attr('x', x)
        .attr('y', y)
        .attr('class', 'trade_operation' + (options.is_replay ? '' : ' blink')) // blink only new trades
        .attr('data-id', options.serial_number)
        .attr('optype', options.type)
        .attr('width', '34px')
        .attr('height', '34px')
        .attr('date', options.open_date)
        .attr('close', options.open_price)
        .attr('xlink:href', options.succeeded ? OPERATION_ICON.success[options.type] : OPERATION_ICON[options.type]) // if trade was succeeded, paint it blue
        .on("mouseover", function (d) {
            var self = this;
            d3.xhr('/getTrade').header("Content-Type", "application/json")
                .post(JSON.stringify({
                    id: options.serial_number
                }), function (err, xhr) {
                    var TRADE_STATUS = {
                        1: 'Succeeded',
                        2: 'Failed',
                        3: 'Stopped'
                    };

                    var trade;
                    if (xhr.status == 200)
                        trade = JSON.parse(xhr.response);
                    else {
                        console.log(xhr.responseText);
                        return;
                    }
                    var open_price = $(self).attr('close') ? parseFloat($(self).attr('close')) : "",
                        close_price = trade.end_value ? parseFloat(trade.end_value) : "",
                        status = trade.status ? TRADE_STATUS[trade.status] : "",
                        date_only = formatDate(new Date($(self).attr('date'))),
                        open_time = formatTimeHMS(new Date($(self).attr('date'))),
                        close_time = trade.end_date ? formatTimeHMS(new Date(trade.end_date)) : formatTimeHMS(options.end_date),
                        difference = close_price ? Math.abs(parseFloat(((close_price - open_price) * 10000).toFixed(2))) : "",
                        is_success = trade.status === 1,
                        pips = is_success ? ('+' + difference) : ('-' + difference);

                    // sell succeeed - price is lower - positive
                    // sell fails - price is higher - negative
                    // same for buy

                    if (is_success) // if trade was succeeded, paint it blue
                        $(self).attr('href', OPERATION_ICON.success[options.type]);

                    // if (new Date() >= new Date(trade.end_date)) // mark a closed buy / sell operation as closed
                    //     $(self).attr('data-closed', true);

                    tooltip.html(
                        "Date: " + date_only +
                        "<br/>Open time: " + open_time +
                        "<br/>Close time: " + close_time +
                        "<br/>Open price: " + open_price +
                        "<br/>Close price: " + close_price +
                        "<br/>Operation: " + (options.type === 'b' ? 'Buy' : 'Sell') +
                        "<br/>Pips: " + pips +
                        "<br/>Status: " + status +
                        "<br/>Serial Number: " + options.serial_number
                    )
                    .style("font-size", "23px");
                });
            tooltip.transition()
                .duration(200)
                .style("opacity", 0.9).style("left", (d3.event.pageX) + "px")
                .style("top", (d3.event.pageY - 28) + "px");
        })
        .on("mouseout", function () {
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
        }).on("click", function () {
            // var is_closed = $(this).data('closed');
            // if (!is_closed) {
            var id = $(this).data('id');
            $('#operation_modal').attr('data-id', id); // embed serial number in modal element
            $('#operation_modal').find('.modal-title').text('Cancel Operation: ' + id);
            $('#operation_modal').find('.modal-text').text('Are you sure you want to stop the ' + ($(this).attr('optype') == 'b' ? 'buy' : 'sell') + '?');
            var alert = svg.select("[type='trade-cancel'][trade-id='" + id + "']");
            if (!alert.empty()) {
                $('#operation_modal').find('.btn-danger').show();
            } else {
                $('#operation_modal').find('.btn-danger').hide();
            }
            $('#operation_modal').modal('show');
            // }
        });

    if (follow) {
        if (!options.is_custom) {
            followTrades[options.serial_number] = {
                type: options.type,
                best: +JSON.parse(sessionStorage.latestDatum),
                endDate: options.end_date,
                startPrice: +options.open_price
            };
        } else {
            followCustomTrade(options);
        }
    }
    isReplay = options.is_replay;
}

function stopOperation(button, id) {
    var $button = $(button);
    var trade_id = id || $('#operation_modal').attr('data-id');

    var tradeSecInput = d3.select("#cancelTradeSec").node();
    var tradeMinInput = d3.select("#cancelTradeMin").node();

    var secondsTimeout = tradeSecInput ? +tradeSecInput.value : 0;
    var minutesTimeout = tradeMinInput ? +tradeMinInput.value : 0;

    var totalSeconds = secondsTimeout + (minutesTimeout * 60);
    var realSeconds = totalSeconds * 1000;
    if (playback.seedDataLoaded) {
        var timeSpeed = Math.min(1000, +d3.select('#timeSpeed').node().value || 1);
        realSeconds /= timeSpeed;
    }

    if (stopOperationTimeouts[trade_id]) {
        clearTimeout(stopOperationTimeouts[trade_id]);
    }
    stopOperationTimeouts[trade_id] = setTimeout(function () {
        if (id || !$button.is(':disabled')) { // prevent multiple invokes to stopOperation()

            if (!sessionStorage.current && !sessionStorage.ohlcData) { // prevent client side errors. probably trying to buy/sell before there is data on graph 
                console.log('Error - probably trying to stop buy/sell before there is data on graph');
                return;
            }

            var end_value = +JSON.parse(sessionStorage.latestDatum);



            d3.xhr('/stopTrade').header("Content-Type", "application/json")
                .post(JSON.stringify({
                    id: trade_id,
                    end_value: end_value
                }), function (err, xhr) {
                    console.log(err, xhr);
                    if (!err) {
                        removeOperationAlert(false, trade_id);
                    }
                    id || $button.removeAttr('disabled');
                });
        }
    }, realSeconds);
}

/**BACKUP**/
/*
function followCustomTrade(trade) {
  var current = JSON.parse(sessionStorage.current);
  var currDate = playback.seedDataLoaded ? new Date(current.date) : new Date();
  
  var data = allData.concat([]);
  if (current) {
      data.push(current);
  }
  var diffStart = new Date(data[data.length - 1].date) - new Date(trade.open_date);
  var minDiffStart = Math.round(diffStart / 60000) + 1;
  
  var diffEnd = new Date(data[data.length - 1].date) - Math.min(currDate, new Date(trade.end_date));
  var minDiffEnd = Math.round(diffEnd / 60000) + 1;
  
  var startIndex = Math.max(data.length - minDiffStart - 1, 0);
  var endIndex = Math.min(data.length - 1, data.length - minDiffEnd - 1);
  
  console.log(startIndex, endIndex);
  console.log(data[startIndex], data[endIndex]);
  
  var follow = {
    id: trade.serial_number,
    type: trade.type,
    endDate: trade.end_date,
    startPrice: +trade.open_price
  }
  
  var startValue = +follow.startPrice;
  
  var added = false;
  
  var startDate = new Date(trade.open_date);
  
  var startValue = +follow.startPrice;
  
  for(var i = startIndex; i < endIndex && !added; i++) {
    var date = new Date(data[i].date);
    var day = formatDate(date).split("-").reverse().join("-");
    var time = formatTimeHMS(date);
    
    d3.xhr('/findMinuteData').header("Content-Type", "application/json")
      .post(JSON.stringify({
        day: day,
        time: time,
      }), function (err, xhr) {
        if(err) {
          console.error(err.stack)
        }
        if(xhr.status == 200) {
          
          var startSecond = 0;
          if (startDate.getMinutes() == date.getMinutes() && startDate.getHours() == date.getHours()) {
            startSecond = startDate.getSeconds();
          }
          
          var values = JSON.parse(xhr.response);
          
          for(var j = 0; j < values.length && !added; j++) {
            if(values[j].second < startSecond)
              continue;
            var value = values[j].value;
            
            if (!follow.best) {
              follow.best = value;
            } 
            else {
              follow.best = follow.type == 'b' ? Math.max(follow.best, value) : Math.min(follow.best, value);
            }

            var bestDiff = follow.best - startValue;
            var currDiff = value - startValue;

            var diffRatio = !bestDiff || !currDiff ? 0 : currDiff / bestDiff;

            if(follow.type == 's') {
              bestDiff *= -1;
              currDiff *= -1;
            }

            if ((bestDiff >= 0.0002  && diffRatio <= 1 / 3)
                || (bestDiff <= 0.00015 && Math.abs(currDiff) >= 0.00015)) {
              follow.id = trade.serial_number;
              follow.price = value;
              follow.date = new Date(new Date(data[i].date).setSeconds(values[j].second));
              follow.startPrice = startValue;
              addOperationAlert(follow);
              added = true;
              break;
            }
          }
        }
    });
  }
  console.log(added);
  
  if (!added && new Date(trade.end_date) > currDate) {
    followTrades[trade.serial_number] = follow;
  }
}
*/

function followCustomTrade(trade) {
    var current = JSON.parse(sessionStorage.current);
    var currDate = playback.seedDataLoaded ? new Date(current.date) : new Date();

    var data = allData;

    //  var diffStart = new Date(current ? current.date : data[data.length - 1].date) - new Date(trade.open_date);
    //  var minDiffStart = Math.round(diffStart / 60000) + 1;
    //  
    //  var diffEnd = new Date(current ? current.date : data[data.length - 1].date) - Math.min(currDate, new Date(trade.end_date));
    //  var minDiffEnd = Math.round(diffEnd / 60000) + 1;
    //  
    //  var dataLength = current ? data.length + 1 : data.length;
    //  
    //  var startIndex = Math.max(dataLength - minDiffStart - 1, 0);
    //  var endIndex = Math.min(dataLength - 1, dataLength - minDiffEnd - 1);
    //  
    //  console.log(startIndex, endIndex);

    var startDate = new Date(trade.open_date);
    var endDate = new Date(trade.end_date);

    /* new */
    var diff = endDate - startDate;
    var minDiff = Math.round(diff / 60000) + 1;

    var date = new Date(startDate);

    /* end new */

    var follow = {
        id: trade.serial_number,
        type: trade.type,
        endDate: trade.end_date,
        startPrice: +trade.open_price
    }

    var added = false;

    var startValue = +follow.startPrice;


    //for(var i = startIndex; i < endIndex && !added; i++) {

    function calculateMinute(callback) {
        date.setSeconds(0);
        if (date > endDate) {
            return callback();
        }
        //var date = new Date(i == data.length ? current.date : data[i].date);
        var day = formatDate(date).split("-").reverse().join("-");
        var time = formatTimeHMS(date);

        d3.xhr('/findMinuteData').header("Content-Type", "application/json")
            .post(JSON.stringify({
                day: day,
                time: time
            }), function (err, xhr) {
                if (err) {
                    console.error(err.stack)
                }
                if (xhr.status == 200) {
                    var startSecond = 0;
                    if (startDate.getMinutes() == date.getMinutes() && startDate.getHours() == date.getHours()) {
                        startSecond = startDate.getSeconds();
                    }

                    var endSecond = 59;
                    if (endDate.getMinutes() == date.getMinutes() && endDate.getHours() == date.getHours()) {
                        endSecond = endDate.getSeconds();
                    }

                    var values = JSON.parse(xhr.response);

                    for (var j = 0; j < values.length && !added; j++) {
                        if (values[j].second < startSecond)
                            continue;
                        if (values[j].second > endSecond)
                            return;
                        var value = values[j].value;

                        if (!follow.best) {
                            follow.best = value;
                        } else {
                            follow.best = follow.type == 'b' ? Math.max(follow.best, value) : Math.min(follow.best, value);
                        }

                        var bestDiff = follow.best - startValue;
                        var currDiff = value - startValue;

                        var diffRatio = !bestDiff || !currDiff ? 0 : currDiff / bestDiff;

                        if (follow.type == 's') {
                            bestDiff *= -1;
                            currDiff *= -1;
                        }

                        if ((bestDiff >= 0.0002 && diffRatio <= 1 / 3) ||
                            (bestDiff <= 0.00015 && Math.abs(currDiff) >= 0.00015)) {
                            follow.id = trade.serial_number;
                            follow.price = value;
                            follow.date = new Date(date.setSeconds(values[j].second));
                            follow.startPrice = startValue;
                            addOperationAlert(follow, (bestDiff >= 0.0002 && diffRatio <= 1 / 3) ? 2 : 1);
                            added = true;
                            return callback();
                        }
                    }
                }

                date.setMinutes(date.getMinutes() + 1);
                calculateMinute(callback);
            });
    }
    calculateMinute(function () {
        if (!added && new Date(trade.end_date) > currDate) {
            followTrades[trade.serial_number] = follow;
        }
    });

}

function drawToolbarForAlertBoxButtons(mark, localButtonId) {
    var bodyRect = document.body.getBoundingClientRect()
    var button = document.getElementById(localButtonId);
    var buttonRect = button.getBoundingClientRect();
    tooltip.html(
        "Date: " + mark.markAt.date +
        "<br/>Price: " + mark.markAt.price
    );
    tooltip.transition()
        .duration(200)
        .style("opacity", 0.9).style("left", (buttonRect.left - bodyRect.left) + "px")
        .style("top", (buttonRect.top - bodyRect.top - 28) + "px");
}


function removeOperationAlert(unfollow, id) {
    var trade_id = id || $('#operation_modal').attr('data-id');
    svg.select("[type='trade-alert'][trade-id='" + trade_id + "']").remove();
    var row = d3.select("tr[operation-id='" + trade_id + "']");
    console.log("tr[operation-id='" + trade_id + "']", row);
    row.remove();
    delete followTrades[trade_id];

    if (unfollow) {
        d3.xhr('/unfollowTrade').header("Content-Type", "application/json")
            .post(JSON.stringify({
                id: trade_id
            }), function (err, xhr) {
                if (xhr.status == 200) {
                    console.log('Unfollowed trade', trade_id);
                } else {
                    console.log('Error unfollowing trade', trade_id, err);
                }
            });
    }
}

function addBendingToGraph(candleIndex, firstStreak, lastStreak, bend, update) {
    var candle = allData[candleIndex];
    var up = (+candle.close - candle.open >= 0);
    var x = xScale(new Date(candle.date)) + OPERATION_PAD.x.b;
    var y = yScale(up ? +candle.high : +candle.low) + ((up ? 1 : 0) * OPERATION_PAD.y.b);

    function drawToolbarForBending() {
        tooltip.html(
            "Date: " + candle.date +
            "<br/>Type: " + (bend === 'top' ? 'Top Bend \u2229' : 'Bottom Bend \u222A') +
            "<br/>" + (up ? 'Streak up: ' : 'Streak down: ') + (Math.round(100000 * Math.abs(firstStreak)) / 100000) +
            "<br/>" + (up ? 'Streak down: ' : 'Streak up: ') + (Math.round(100000 * Math.abs(lastStreak)) / 100000) +
            "<br/>Ratio: " + (Math.round(100000 * Math.abs(firstStreak / lastStreak)) / 100000)
        );
        tooltip.transition()
            .duration(200)
            .style("opacity", 0.9).style("left", (d3.event.pageX) + "px")
            .style("top", (d3.event.pageY - 28) + "px");
    }

    if (update) {
        update.attr('xlink:href', bend === 'top' ? 'images/top-bend.png' : 'images/bot-bend.png')
            .on("mouseover", drawToolbarForBending);
        return update;
    }

    return svg.append('g')
        .append('image')
        .attr('x', x)
        .attr('y', y)
        .attr('class', 'bending') // blink only new trades
        .attr('type', 'bend')
        .attr('bend', bend)
        .attr('width', '20px')
        .attr('height', '20px')
        .attr('date', candle.date)
        .attr('data', up ? +candle.high : +candle.low)
        .attr('xlink:href', bend === 'top' ? 'images/top-bend.png' : 'images/bot-bend.png')
        .on("mouseover", drawToolbarForBending)
        .on("mouseout", function () {
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
        });
}

// reason: 1 = immediately was bad trade, 2 = good trade but later down for 2/3.
function addOperationAlert(trade, reason) {
    function roundProfit(num) {
        return Math.round(num * 100000) / 100000;
    }

    var graphDate = new Date(trade.date);
    graphDate.setSeconds(0);
    var x = xScale(graphDate);
    var y = yScale(trade.startPrice);
    var isBuy = trade.type === 'b';
    var cancel = svg.append('svg')
        .attr("width", 20)
        .attr("height", 20)
        .attr("trade-id", trade.id)
        .attr("date", trade.date)
        .attr("price", trade.price)
        .attr("startPrice", trade.startPrice)
        .attr("trade-type", trade.type)
        .attr("type", "trade-alert")
        .attr("reason", reason)
        .attr('x', x)
        .attr('y', y)
        .on('mouseover', function () {
            var value = +JSON.parse(sessionStorage.latestDatum);
            tooltip.html(
                "Date: " + formatDate(trade.date) +
                "<br/>Time: " + formatTimeHMS(trade.date) +
                "<br/>Operation SN: " + trade.id +
                "<br/>Operation type: " + (isBuy ? 'Buy' : 'Sell') +
                "<br/>Start price: " + trade.startPrice +
                "<br/>Best price: " + trade.best +
                "<br/>Best profit: " + roundProfit((isBuy ? 1 : -1) * (trade.best - trade.startPrice)) +
                "<br/>Recommendation price: " + trade.price +
                "<br/>Recommendation profit: " + roundProfit((isBuy ? 1 : -1) * (trade.price - trade.startPrice)) +
                "<br/>Current price: " + value +
                "<br/>Current profit: " + roundProfit((isBuy ? 1 : -1) * (value - trade.startPrice))
            )
            .style("font-size", "23px");
            tooltip.transition()
                .duration(200)
                .style("opacity", 0.9).style("left", (d3.event.pageX) + "px")
                .style("top", (d3.event.pageY - 28) + "px");
        })
        .on("mouseout", function () {
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
        }).on("click", function () {
            $('#operation_modal').attr('data-id', trade.id);
            $('#operation_modal').find('.modal-title').text('Cancel Operation: ' + trade.id);
            $('#operation_modal').find('.modal-text').text('Are you sure you want to stop the ' + (isBuy ? 'buy' : 'sell') + '?');
            $('#operation_modal').find('.btn-danger').show();
            $('#operation_modal').modal('show');
            // }
        });;

    cancel.append('circle')
        .attr('cx', 10)
        .attr('cy', 10)
        .attr("r", 9)
        .attr("class", "trade_cancel_circle");

    cancel.append('path')
        .attr("class", "trade_cancel_x")
        .attr("d", "M 6,6 L 14,14 M 14,6 L 6,14");

    var tableRow = d3.select('#alert-table-body').append('tr')
        .attr("operation-id", trade.id)
        .html('<th><input type="checkbox"></th>' +
            '<th>' + trade.id + '</th>' +
            '<td>' + formatDate(trade.date) + '</td>' +
            '<td>' + formatTimeHMS(trade.date) + '</td>' +
            '<td><button class="btn btn-default" onclick="gotoAlert(\'' + trade.id + '\')">Go To Alert</button></td>' +
            '<td><button class="btn btn-default" onclick="gotoTrade(\'' + trade.id + '\')">Go To Trade</button></td>'
        );
}

function toggleAllAlertsTable(checkbox) {
    d3.selectAll('#alert-table-body input[type="checkbox"]')
        .property("checked", checkbox.checked);
}

function getCheckedAlertsTable() {
    var rows = d3.selectAll('#alert-table-body tr')[0].map(d3.select).filter(function (tr) {
        return tr.select("input[type='checkbox']").property("checked");
    })
    return rows;
}

function cancelTableTrades() {
    var rows = getCheckedAlertsTable();
    console.log(rows);
    rows.forEach(function (row) {
        console.log(row, row.attr("operation-id"));
        stopOperation(null, row.attr("operation-id"));
    });
}

function dismissTableAlerts() {
    var rows = getCheckedAlertsTable();
    rows.forEach(function (row) {
        console.log(row, row.attr("operation-id"));
        removeOperationAlert(true, row.attr("operation-id"));
    });
}

//************************************
// Records handler
//************************************
// initialize records list
function initRecordsList() {
    d3.json("/getRecordsData", function (error, data) {
        if (!error) {
            data.sort(function (a, b) {
                // Turn your strings into dates, and then subtract them
                // to get a value that is either negative, positive, or zero.
                return new Date(b) - new Date(a);
            });
            d3.select('#dateSeed')
                .selectAll('option')
                .data(data)
                .enter()
                .append('option')
                .attr('value', function (d) {
                    return d.toString();
                })
                .text(function (d) {
                    return new Date(d.toString()).toLocaleDateString('he-IL');
                });
        } else {
            d3.select('#dateSeed')
                .append('option')
                .text("No records could be fetched.");
        }
    });
}

window.onbeforeunload = resetData;

function resetData() {
    sessionStorage.clear();
}

function scrollToTime(time) {
    var diff = new Date(allData[allData.length - 1].date) - time;
    var minDiff = Math.round(diff / 60000) + 1;
    var dataCount = minDiff / (dataWindow.interval / 2);


    dataWindow.offsetY = dataCount;
    //refresh();
    //refreshCurrent();
}

function scrollToX(x) {
    scrollToTime(xScale.invert(x));
}

function gotoAlert(trade_id) {
    scrollToTime(new Date(svg.select('svg[trade-id="' + trade_id + '"][type="trade-alert"]').attr("date")));
}

function gotoTrade(trade_id) {
    scrollToTime(new Date(svg.select('[data-id="' + trade_id + '"]').attr("date")));
}