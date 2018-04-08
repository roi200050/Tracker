'use strict';
// Defines the averages
var avgDefinition = [];

// Function that draws each line of the average graph
var lineFunction = d3.svg.line()
  .x(function (d) {
    return xScale(d.x);
  })
  .y(function (d) {
    return yScale(d.y);
  })
  .interpolate("linear");

function getStreakType(data) {
  return data.close - data.open >= 0 ? 'up' : 'down';
}

function checkBendingStatus(end) {
  var latestStreak = end ? allData.slice(-1 * avgDefinition.latestStreakCount - 1, -1) : allData.slice(-1 * avgDefinition.latestStreakCount);
  var prevStreak = end ?
    allData.slice(-1 * (avgDefinition.prevStreakCount + avgDefinition.latestStreakCount) - 1, -1 * avgDefinition.latestStreakCount - 1) :
    allData.slice(-1 * (avgDefinition.prevStreakCount + avgDefinition.latestStreakCount), -1 * avgDefinition.latestStreakCount);

  var prevMax = -1,
    prevMin = Number.MAX_SAFE_INTEGER,
    latestMax = -1,
    latestMin = Number.MAX_SAFE_INTEGER;

  var lastLine = avgDefinition[0].lines.length - 1;

  var prevMinDate = new Date(prevStreak[0].date);
  var prevMaxDate = new Date(prevStreak[prevStreak.length - 1].date);

  var prevAvg = avgDefinition[4].lines[lastLine].filter(function (avg) {
    return avg.x >= prevMinDate && avg.x <= prevMaxDate;
  })

  var checkBending = prevStreak.some(function (d, i) {
    var type = getStreakType(d);

    if (!prevAvg || prevAvg.length <= i) return false;

    var diff = +d.close - prevAvg[i].y;
    if ((diff >= 0.0003 && type === 'up') || (diff <= -0.0003 && type === 'down')) {
      return true;
    }
    return false;
  });
  // var pinkAvg = avgDefinition[4].lines[lastLine][avgDefinition[4].lines[lastLine].length - avgDefinition.latestStreakCount].y;

  prevStreak.forEach(function (d) {
    prevMax = Math.max(prevMax, d.high);
    prevMin = Math.min(prevMin, d.low);
  });
  latestStreak.forEach(function (d) {
    latestMax = Math.max(latestMax, d.high);
    latestMin = Math.min(latestMin, d.low);
    if (end) {
      // var diff = +d.close - pinkAvg;
      var type = getStreakType(d);
      // console.log(type, diff);
      // if ((diff >= 0 && type === 'up') || (diff < 0 && type !== 'up')) {
      //console.log('bending + end', type);
      avgDefinition.bending = false;
      avgDefinition.endBending = true;
      // avgDefinition.prevStreakPinkAvg = avgDefinition.latestStreakPinkAvg;
      // avgDefinition.latestStreakPinkAvg = pinkAvg;
      // }
    }
  });

  var prevChange = prevMax - prevMin;
  var latestChange = latestMax - latestMin;

  var up = getStreakType(allData[allData.length - avgDefinition.latestStreakCount - 2]) === 'up';
  //console.log(up, prevChange, latestChange);
  //console.log(prevStreak, latestStreak);

  if (checkBending) {
    if (Math.abs(prevChange) < latestChange) {
      console.log(prevStreak, latestStreak);
      console.log(prevChange, prevMax, prevMin, latestChange, latestMax, latestMin);
      var index = allData.length - avgDefinition.latestStreakCount - 2;
      console.log(end);
      if (!end) {
        index++;
      }
      avgDefinition.updateBending = addBendingToGraph(index, prevChange, latestChange, up ? 'bot' : 'top', avgDefinition.updateBending);
      if (end) {
        avgDefinition.updateBending = null;
      }
    } else if (end) {
      console.log(prevStreak, latestStreak);
      console.log(prevChange, prevMax, prevMin, latestChange, latestMax, latestMin);
      var index = allData.length - avgDefinition.latestStreakCount - 2;
      addBendingToGraph(index, prevChange, latestChange, up ? 'top' : 'bot');
      avgDefinition.updateBending = null;
    }
  }
}

// Add one datum to the avg graphs
function addAvgDatum() {
  var current = allData[allData.length - 1];
  var datum = +current.close;
  var date = new Date(current.date);

  if (isNaN(datum + 1))
    throw new Error("Cannot add datum, " + datum + " of type " + typeof (datum) + " is not a number");

  // BENDINGS TO UNCOMMENT MAYBE

  if (avgDefinition.latestStreakCount && allData.length && getStreakType(allData[allData.length - 1]) === getStreakType(allData[allData.length - 2])) {
    avgDefinition.latestStreakCount++;

    if (avgDefinition.endBending) {
      checkBendingStatus(false);
    }
  } else if (!avgDefinition.latestStreakCount) {
    avgDefinition.latestStreakCount = 1;
  } else {
    if (avgDefinition.bending) {
      //console.log('end bending');
      avgDefinition.endBending = true;
      avgDefinition.bending = false;
    } else if (avgDefinition.endBending) {
      avgDefinition.bending = false;
      avgDefinition.endBending = false;

      checkBendingStatus(true);
    }

    avgDefinition.prevStreakCount = avgDefinition.latestStreakCount;
    // avgDefinition.prevStreakPinkAvg = avgDefinition.latestStreakPinkAvg;
    avgDefinition.latestStreakCount = 1;
  }


  var lastLine = avgDefinition[0].lines.length - 1;

  //    if (avgDefinition.recent.length === avgDefinition.MAX_AVG_DATA_COUNT) {
  //        avgDefinition.recent = avgDefinition.recent.splice(1, avgDefinition.recent.length);
  //    }
  //    avgDefinition.recent.push({
  //        datum: datum,
  //        date: date
  //    });

  // http://stackoverflow.com/questions/7709803/javascript-get-minutes-between-two-dates
  var diffMs = date - avgDefinition.recentDate, // diff in milliseconds
    diffMins = Math.round(((diffMs % 86400000) % 3600000) / 60000); // diff in minutes

  if (avgDefinition.recentDate && diffMins > 1) { // check minutes diff, expect to maximum 1 minute diff 
    // avgDefinition.recentDate.getTime() + 60000 != date.getTime() && // check if seconds are match
    // avgDefinition.recentDate.getMinutes() + 1 !== date.getMinutes()) { // check if minutes are match
    console.log("Error mismatch " + (avgDefinition.recentDate.getTime() + 60000) + " not equals " + date.getTime());
    console.log("Dates", avgDefinition.recentDate, date);
    console.log("Diff (minutes)", diffMins);
    //initAvg(true);

    lostData = date;

    avgDefinition.recent = [];

    avgDefinition.findPositiveStreak = true;
    avgDefinition.posStreakCount = avgDefinition.TARGET_STREAK_COUNT;
    avgDefinition.findNegativeStreak = true;
    avgDefinition.negStreakCount = avgDefinition.TARGET_STREAK_COUNT;

    avgDefinition.latestStreakCount = 0;
    avgDefinition.prevStreakCount = 0;
    avgDefinition.bending = false;
    avgDefinition.endBending = false;
    avgDefinition.updateBending = null;

    avgDefinition.topPeaks = [];
    avgDefinition.bottomPeaks = [];

    for (var avg = 0; avg < avgDefinition.length; avg++) {
      avgDefinition[avg].selections.push(svg.append("path").attr("type", "avg"));
      avgDefinition[avg].lines.push([]);
      avgDefinition[avg].curr_sum.push(0);
      avgDefinition[avg].curr_count.push(0);
    }

    avgDefinition.recentDate = date;

    return;
  }

  avgDefinition.recentDate = date;

  for (var avg = 0; avg < avgDefinition.length; avg++) {
    avgDefinition[avg].curr_sum[lastLine] += datum;
    avgDefinition[avg].curr_count[lastLine]++;
    if (avgDefinition[avg].curr_count[lastLine] === avgDefinition[avg].count_goal) {
      avgDefinition[avg].lines[lastLine].push({
        x: new Date(date),
        y: (avgDefinition[avg].curr_sum[lastLine] / avgDefinition[avg].curr_count[lastLine]).toFixed(5)
      });
      avgDefinition[avg].curr_count[lastLine] = avgDefinition[avg].count_goal - 1;
      avgDefinition[avg].curr_sum[lastLine] -= Number(allData[allData.length - avgDefinition[avg].count_goal].close);
    }
  }

  if (!avgDefinition.bending && !avgDefinition.endBending) {
    findBendings(current);
  }

  findStreaks();

  // findPeaks();

  updateAvg();
}

function findBendings(data) {
  var lastLine = avgDefinition[0].lines.length - 1;
  if (!avgDefinition[4].lines[lastLine].length) {
    return;
  }
  // var pinkAvg = avgDefinition[4].lines[lastLine][avgDefinition[4].lines[lastLine].length - 1].y;
  // var diff = data.close - pinkAvg;
  var type = getStreakType(data);
  //if ((diff >= 0 && type === 'up') || (diff < 0 && type !== 'up')) {
  //console.log('bending', type);
  avgDefinition.bending = true;
  //    avgDefinition.latestStreakPinkAvg = pinkAvg;
  // }
}

function findPeaks() {
  var previous = allData.slice(-3, -1);
  var current = allData[allData.length - 1];
  var currentDate = new Date(current.date);
  if (previous.length && (currentDate - new Date(previous[0].date)) / 60000 <= 3) {
    var prevChange1 = +previous[0].open - previous[0].close;
    var prevChange2 = +previous[previous.length - 1].open - previous[previous.length - 1].close;
    var prevChange = prevChange1 + prevChange2;
    var currChange = +current.open - current.close;
    var totalChange = Math.abs(prevChange) + Math.abs(currChange);
    if (prevChange1 * prevChange2 >= 0 && currChange * prevChange < 0 && totalChange >= 0.00015) { // record
      if (prevChange < 0) { //top
        findTopPeak();
      } else {
        findBottomPeak();
      }
    }
  }
}

function findTopPeak() {
  var found = -1;
  var curr = allData[allData.length - 2];
  for (var i = 0; i < avgDefinition.topPeaks.length && found == -1; i++) {
    var peak = allData[avgDefinition.topPeaks[i]];
    if (Math.abs(+peak.high - curr.high) <= 0.000075) {
      found = i;
    }
  }
  if (found != -1) {
    if ((new Date(curr.date) - new Date(avgDefinition.topPeaks[found].date)) > (18 * 60 * 1000)) {
      avgDefinition.topPeaks.splice(0, found + 1);
      avgDefinition.topPeaks.push(allData.length - 2);
    } else {
      var p = allData[avgDefinition.topPeaks.splice(found, 1)[0]];
      if (!avgDefinition.lastTopPeak || new Date(p.date) >= avgDefinition.lastTopPeak) {
        var line = g.svg.append("line")
          .attr("type", "dline")
          .attr("auto", "true");

        var currentLast = new Date(xScale.domain()[1]);
        avgDefinition.lastTopPeak = currentLast;

        createLine(
          line,
          xScale(new Date(p.date)),
          yScale(+p.high),
          xScale(currentLast), // xScale(new Date(curr.date)),
          yScale(+p.high),
          "red",
          true
        );

        avgDefinition.topPeaks = avgDefinition.topPeaks.filter(function (index) {
          return new Date(allData[index].date) >= currentLast;
        });

        registerKeyListener(line);
      }
    }
  } else {
    avgDefinition.topPeaks.push(allData.length - 2);
  }
}

function findBottomPeak() {
  var found = -1;
  var curr = allData[allData.length - 2];
  for (var i = 0; i < avgDefinition.bottomPeaks.length && found == -1; i++) {
    var peak = allData[avgDefinition.bottomPeaks[i]];
    if (Math.abs(+peak.low - curr.low) <= 0.000075) {
      found = i;
    }
  }
  if (found != -1) {
    if ((new Date(curr.date) - new Date(avgDefinition.bottomPeaks[found].date)) > (18 * 60 * 1000)) {
      avgDefinition.bottomPeaks.splice(0, found + 1);
      avgDefinition.bottomPeaks.push(allData.length - 2);
    } else {
      var p = allData[avgDefinition.bottomPeaks.splice(found, 1)[0]];
      if (!avgDefinition.lastBotPeak || new Date(p.date) >= avgDefinition.lastBotPeak) {
        var line = g.svg.append("line")
          .attr("type", "dline")
          .attr("auto", "true");

        var currentLast = new Date(xScale.domain()[1]);
        avgDefinition.lastBotPeak = currentLast;

        createLine(
          line,
          xScale(new Date(p.date)),
          yScale(+p.low),
          xScale(currentLast), // xScale(new Date(curr.date)),
          yScale(+p.low),
          "red",
          true
        );

        avgDefinition.bottomPeaks = avgDefinition.bottomPeaks.filter(function (index) {
          return new Date(allData[index].date) >= currentLast;
        });

        registerKeyListener(line);
      }
    }
  } else {
    avgDefinition.bottomPeaks.push(allData.length - 2);
  }
}

function findStreaks() {
  var current = allData[allData.length - 1];
  if (!avgDefinition.findNegativeStreak && +current.open <= +current.close) {
    avgDefinition.findNegativeStreak = true;
    avgDefinition.negStreakCount = avgDefinition.TARGET_STREAK_COUNT;
    return;
  } else if (!avgDefinition.findPositiveStreak && +current.open > +current.close) {
    avgDefinition.findPositiveStreak = true;
    avgDefinition.posStreakCount = avgDefinition.TARGET_STREAK_COUNT;
    return;
  }

  if (avgDefinition.findPositiveStreak) {
    var lasts = allData.slice(-1 * avgDefinition.posStreakCount);
    var toReturn = !lasts.length;
    for (var i = 0; i < lasts.length - 2 && !toReturn; i++) {
      toReturn = (new Date(lasts[i + 1].date) - new Date(lasts[i].date) !== 60000);
    }
    if (toReturn) {
      return;
    }

    if (lasts.length == avgDefinition.posStreakCount) {
      var draw = false,
        y1 = 0,
        y2 = 0,
        x1, x2;
      var isPos = lasts.every(function (d) {
        return +d.open <= +d.close;
      });

      if (isPos) {
        y1 = yScale(+lasts[0].low);
        x1 = xScale(new Date(lasts[0].date));
        y2 = yScale(+lasts[lasts.length - 1].close);
        //y2 = y1 + ((y2 - y1) * 2.5);
        x2 = xScale(new Date(lasts[lasts.length - 1].date));
        //x2 = x1 + ((x2 - x1) * 2.5);

        draw = Math.abs(y2 - y1) >= 35;

        if (draw) {
          var line = g.svg.append("line")
            .attr("type", "dline")
            .attr("auto", "true");

          createLine(line, x1, y1, x2, y2, "red", true);
          registerKeyListener(line);

          avgDefinition.findPositiveStreak = false;

          avgDefinition.posStreakCount = avgDefinition.TARGET_STREAK_COUNT;
        } else {
          avgDefinition.posStreakCount++;
        }
      } else {
        avgDefinition.posStreakCount = avgDefinition.TARGET_STREAK_COUNT;
      }
    }
  }

  if (avgDefinition.findNegativeStreak) {
    var lasts = allData.slice(-1 * avgDefinition.negStreakCount);

    var toReturn = !lasts.length;
    for (var i = 0; i < lasts.length - 2 && !toReturn; i++) {
      toReturn = (new Date(lasts[i + 1].date) - new Date(lasts[i].date) !== 60000);
    }
    if (toReturn) {
      return;
    }

    if (lasts.length == avgDefinition.negStreakCount) {
      var draw = false,
        y1 = 0,
        y2 = 0,
        x1, x2;
      var isNeg = lasts.every(function (d) {
        return +d.open > +d.close;
      });

      if (isNeg) {
        y1 = yScale(+lasts[0].high);
        y2 = yScale(+lasts[lasts.length - 1].close);
        //y2 = y1 + ((y2 - y1) * 2.5);
        x1 = xScale(new Date(lasts[0].date));
        x2 = xScale(new Date(lasts[lasts.length - 1].date));
        //x2 = x1 + ((x2 - x1) * 2.5);
        draw = Math.abs(y2 - y1) >= 35;

        if (draw) {

          console.log(lasts);
          var line = g.svg.append("line")
            .attr("type", "dline")
            .attr("auto", "true");

          createLine(line, x1, y1, x2, y2, "red", true);
          registerKeyListener(line);

          avgDefinition.findNegativeStreak = false;

          avgDefinition.negStreakCount = avgDefinition.TARGET_STREAK_COUNT;
        } else {
          avgDefinition.negStreakCount++;
        }
      } else {
        avgDefinition.negStreakCount = avgDefinition.TARGET_STREAK_COUNT;
      }
    }
  }
}

function initAvg(reset) {
  svg.selectAll("[type='avg']").remove();
  if (reset) {
    //svg.selectAll("rect[rectype='main'], rect[rectype='open'], rect[rectype='close']").remove();
  }

  avgDefinition = [{
    stroke: 'brown',
    stroke_width: 4,
    count_goal: 50,
    curr_sum: [0],
    curr_count: [0],
    lines: [
      []
    ],
    selections: []
  }, {
    stroke: 'blue',
    stroke_width: 4,
    count_goal: 30,
    curr_sum: [0],
    curr_count: [0],
    lines: [
      []
    ],
    selections: []
  }, {
    stroke: 'black',
    stroke_width: 4,
    count_goal: 20,
    curr_sum: [0],
    curr_count: [0],
    lines: [
      []
    ],
    selections: []
  }, {
    stroke: 'orange',
    stroke_width: 4,
    count_goal: 10,
    curr_sum: [0],
    curr_count: [0],
    lines: [
      []
    ],
    selections: []
  }, {
    stroke: 'rgb(225,40,238)',
    stroke_width: 4,
    count_goal: 6,
    curr_sum: [0],
    curr_count: [0],
    lines: [
      []
    ],
    selections: []
  }];

  avgDefinition.MIN_AVG_DATA_COUNT = 6;
  avgDefinition.MAX_AVG_DATA_COUNT = 50;
  avgDefinition.recent = [];

  avgDefinition.findPositiveStreak = true;
  avgDefinition.TARGET_STREAK_COUNT = 4;
  avgDefinition.posStreakCount = avgDefinition.TARGET_STREAK_COUNT;
  avgDefinition.findNegativeStreak = true;
  avgDefinition.negStreakCount = avgDefinition.TARGET_STREAK_COUNT;

  avgDefinition.latestStreakCount = 0;
  avgDefinition.prevStreakCount = 0;
  avgDefinition.prevStreakPinkAvg = 0;
  avgDefinition.latestStreakPinkAvg = 0;
  avgDefinition.bending = false;
  avgDefinition.endBending = false;
  avgDefinition.updateBending = null;

  avgDefinition.topPeaks = [];
  avgDefinition.bottomPeaks = [];

  for (var i = 0; i < avgDefinition.length; i++) {
    avgDefinition[i].selections.push(svg.append("path").attr("type", "avg"));
  }
}

function updateAvg() {
  for (var avg = 0; avg < avgDefinition.length; avg++) {
    for (var line = 0; line < avgDefinition[avg].selections.length; line++)
      avgDefinition[avg].selections[line].transition().duration(100)
      .attr("d", lineFunction(avgDefinition[avg].lines[line]))
      .attr("stroke", avgDefinition[avg].stroke)
      .attr("stroke-width", avgDefinition[avg].stroke_width)
      .attr("fill", "none");
  }
}