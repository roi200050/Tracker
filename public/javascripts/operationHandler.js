/**
 * Created by avihay on 07/08/2015.
 */
'use strict';

var OPERATION_PAD = {
    x: {
        b: -17,
        s: -17,
        markrect: -17,
        markcirc: 2,
        marktext: 2,
    },
    y: {
        b: -34,
        s: 0,
        markrect: -34,
        markcirc: -23,
        marktext: -19,
    }
};

var OPERATION_ICON = {
    b: "images/buy_transparent.png",
    s: "images/sell_transparent.png",
    success: {
        b: "images/buy_transparent_blue.png",
        s: "images/sell_transparent_blue.png"
    }
};

var selectedOperation = null,
    g = {
        drawer: {
            inProgress: false
        },
        cross: {
            inProgress: false
        },
        angle: {
            inProgress: false
        },
        ruler: {
            inProgress: false
        },
        custom_buy: {
            inProgress: false
        },
        custom_sell: {
            inProgress: false
        },
        mark: {
            inProgress: false
        }
    },
    handlers = {
        'drawLine': {
            mouseover: updateLine,
            click: drawLine,
            end: cleanEnhancers
        },
        'cross': {
            mouseover: crossUpdate,
            click: crossClick,
            end: crossEnd
        },
        'ruler': {
            mouseover: rulerUpdate,
            click: rulerClick,
            end: rulerEnd
        },
        'buy': {},
        'sell': {},
        'custom_buy': {
            mouseover: customBuyUpdate,
            click: customBuyClick,
            end: customBuyEnd
        },
        'custom_sell': {
            mouseover: customSellUpdate,
            click: customSellClick,
            end: customSellEnd
        },
        'angle': {
            mouseover: updateAngle,
            click: drawAngle,
            end: cleanEnhancers
        },
        'mark': {
            mouseover: updateMark,
            click: addMark,
            end: endMark
        }
    },
    operationListener = function (svg, options) {
        var operations = d3.keys(handlers), //["buy", "sell", "drawLine", "custom_buy", "custom_sell", "cross", "angle", "mark"],
            events = ["begin", "mouseover", "click", "end"];

        operations.forEach(function (operation) {
            d3.select("#" + operation)
                .attr("onclick", "selectOperation(this.id)");
        });
        g.options = options;
        g.svg = svg;

        svg.on("click", opClick);
        svg.on("mouseover", opMouseover);

        g.shapes = [];
        g.children = {};
    };

function opMouseover() {
    g.mouse = {
        x: d3.mouse(this)[0],
        y: d3.mouse(this)[1]
    };
    if (selectedOperation && handlers[selectedOperation].mouseover)
        handlers[selectedOperation].mouseover();
}

function opClick() {
    g.mouse = {
        x: d3.mouse(this)[0],
        y: d3.mouse(this)[1]
    };
    if (selectedOperation && handlers[selectedOperation].click)
        handlers[selectedOperation].click();
}

function cleanEnhancers() {
    d3.selectAll("[type='mouseEnhancer']").remove();
}

function createLine(line, x1, y1, x2, y2, stroke, passBorder) {

    if (!passBorder) {
        x1 = Math.min(g.options.width, Math.max(x1, 0));
        x2 = Math.min(g.options.width, Math.max(x2, 0));
        y1 = Math.min(g.options.height, Math.max(y1, 0));
        y2 = Math.min(g.options.height, Math.max(y2, 0));
    }

    line.attr("x1", x1)
        .attr("y1", y1)
        .attr("x2", x2)
        .attr("y2", y2)
        .attr("stroke", stroke)
        .attr("stroke-width", 3)
        .attr("d1", g.options.x.invert(x1))
        .attr("d2", g.options.x.invert(x2))
        .attr("p1", g.options.y.invert(y1))
        .attr("p2", g.options.y.invert(y2));

    return line;
}

function drawLine() {
    if (!g.drawer.inProgress) {
        g.drawer.prevX = g.mouse.x;
        g.drawer.prevY = g.mouse.y;
        g.drawer.line = g.svg.append("line");
        registerKeyListener(g.drawer.line);
        g.shapes.push(g.drawer.line);
        g.drawer.inProgress = true;
    } else {
        g.drawer.line.attr("type", "dline");
        g.drawer.inProgress = false;
        g.drawer.line = undefined;
        cleanEnhancers();
        selectedOperation = null;
    }
}

function drawAngle() {
    if (!g.angle.inProgress) {
        g.angle.srcX = g.mouse.x;
        g.angle.srcY = g.mouse.y;
        g.angle.line = g.svg.append("line");
        g.angle.dynamic_line = g.svg.append("line");
        createLine(g.angle.line, g.mouse.x, g.mouse.y, g.options.width, g.mouse.y, "red");
        createLine(g.angle.dynamic_line, g.mouse.x, g.mouse.y, g.options.width, g.mouse.y, "red");
        g.angle.text = g.svg.append("text");
        g.children[g.angle.dynamic_line] = g.angle.text
        registerKeyListener(g.angle.dynamic_line);
        registerKeyListener(g.angle.text, g.angle.dynamic_line);
        g.shapes.push(g.angle.dynamic_line);
        g.angle.inProgress = true;
    } else {
        g.angle.dynamic_line.attr("type", "angle");
        g.angle.text.attr("type", "angle_text");
        g.angle.inProgress = false;
        g.angle.line.remove();
        cleanEnhancers();
        selectedOperation = null;
    }
}

// Milliseconds around cross to ceil up
var CROSS_ERROR_AREA = 5000,
    CROSS_SECONDS_CEIL = 10;

// Draw and update cross
function crossUpdate() {
    if (!g.cross.inProgress) {
        var cross = g.svg.append("g")
            .attr("x", g.mouse.x)
            .attr("y", g.mouse.y)
            .attr("d", g.options.x.invert(g.mouse.x))
            .attr("p", g.options.y.invert(g.mouse.y));
        g.cross.vline = cross.append("line");
        g.cross.hline = cross.append("line");
        g.cross.center = cross;
        g.cross.tempLine = g.svg.append("line");
        g.cross.text = g.svg.append("g");
        g.cross.textBG = g.cross.text.append("rect")
            .attr("type", "rect")
            .attr("fill", "white")
            .attr("width", 90)
            .attr("height", 15)
            .attr("y", -15);
        g.cross.text.append("text")
            .attr('font-size', '13px')
            .attr('type', 'text')
            .fill('black');
        registerKeyListener(cross);
        g.cross.inProgress = true;
    } else {
        enhanceMouseSensitivity();
        createLine(g.cross.vline, 0, g.mouse.y, g.options.width, g.mouse.y, "grey");
        createLine(g.cross.hline, g.mouse.x, 0, g.mouse.x, g.options.height, "grey");
        if (g.cross.start) {
            var newStartX = g.options.x(new Date(g.cross.start.attr('d'))),
                newStartY = g.options.y(g.cross.start.attr('p'));
            createLine(g.cross.tempLine, newStartX, newStartY, g.mouse.x, g.mouse.y, "red");

            var dateBeg = new Date(g.cross.start.attr('d')),
                dateEnd = g.options.x.invert(g.mouse.x),
                minutesPassed = Math.floor((dateEnd.getTime() - dateBeg.getTime()) / 60000),
                pipsesDiff = Math.floor(Math.abs(g.cross.start.attr('p') - g.options.y.invert(g.mouse.y)) / 0.00010);

            g.cross.text.select("[type='text']").text(minutesPassed + " / " + pipsesDiff + " / " + g.options.y.invert(g.mouse.y).toFixed(5));
            g.cross.text.select("[type='text']")
                .attr('x', g.mouse.x + 3)
                .attr('y', g.mouse.y - 3);
            g.cross.textBG.attr('x', g.mouse.x + 3)
                .attr('y', g.mouse.y - 3 - 15);
            //console.log(Math.round(Math.abs((new Date(g.mouse.x).getTime() - new Date(newStartX).getTime()) / 45)) + " / " + Math.round(Math.abs(g.mouse.y - newStartY) / 5) + " / " + g.options.y.invert(g.mouse.y).toFixed(5));
        }
    }
}

function crossClick() {
    if (g.cross.inProgress) {
        if (!g.cross.start) {
            g.cross.start = g.svg.append('g')
                .attr("x", g.mouse.x)
                .attr("y", g.mouse.y)
                .attr("d", g.options.x.invert(g.mouse.x))
                .attr("p", g.options.y.invert(g.mouse.y));
        } else {
            crossEnd();
        }
    }
}

// Remove the cross
function crossEnd() {
    if (g.cross.inProgress) {
        if (g.cross.tempLine)
            g.cross.tempLine.remove();

        if (g.cross.center)
            g.cross.center.remove();

        if (g.cross.start) {
            g.cross.start.remove();
            g.cross.start = null;
        }

        if (g.cross.text)
            g.cross.text.remove();

        if (g.cross.vline)
            g.cross.vline.remove();

        if (g.cross.hline)
            g.cross.hline.remove();

        g.cross.inProgress = false;
        selectedOperation = null;
        cleanEnhancers();
    }
}

var d = $("<div id='dpi' />").css({
    position: 'absolute',
    top: '-100%',
    left: '-100%',
    height: '1in',
    width: '1in'
}).appendTo('body');
var dpi = document.getElementById("dpi").offsetHeight;
var px_per_cm = Math.round(dpi / 2.54);
d.remove();

function px2cm(px) {
    return Math.round(px / px_per_cm * 100) / 100;
}

// Draw and update ruler
function rulerUpdate() {
    if (!g.ruler.inProgress) {
        var ruler = g.svg.append("g")
            .attr("x", g.mouse.x)
            .attr("y", g.mouse.y)
            .attr("d", g.options.x.invert(g.mouse.x))
            .attr("p", g.options.y.invert(g.mouse.y));
        g.ruler.vline = ruler.append("line");
        g.ruler.hline = ruler.append("line");
        g.ruler.center = ruler;
        g.ruler.line = g.svg.append("line")
            .attr("type", "ruler");
        g.ruler.text = g.svg.append("g");
        g.ruler.text.append("text")
            .attr('font-size', '13px')
            .attr('type', 'ruler_text')
            .fill('black');
        g.shapes.push(g.ruler.line);
        g.children[g.ruler.line] = g.ruler.text;
        registerKeyListener(g.ruler.line);
        registerKeyListener(g.ruler.text, g.ruler.line);
        g.ruler.inProgress = true;
    } else {
        enhanceMouseSensitivity();
        createLine(g.ruler.vline, 0, g.mouse.y, g.options.width, g.mouse.y, "grey");
        createLine(g.ruler.hline, g.mouse.x, 0, g.mouse.x, g.options.height, "grey");
        if (g.ruler.start) {
            var newStartX = g.options.x(new Date(g.ruler.start.attr('d'))),
                newStartY = g.options.y(g.ruler.start.attr('p'));
            createLine(g.ruler.line, newStartX, newStartY, g.mouse.x, g.mouse.y, "red");

            var dateBeg = new Date(g.ruler.start.attr('d')),
                dateEnd = g.options.x.invert(g.mouse.x),
                minutesPassed = Math.floor((dateEnd.getTime() - dateBeg.getTime()) / 60000),
                pipsesDiff = Math.floor(Math.abs(g.ruler.start.attr('p') - g.options.y.invert(g.mouse.y)) / 0.00010),
                distance = Math.sqrt(Math.pow(g.mouse.y - newStartY, 2) + Math.pow(g.mouse.x - newStartX, 2));

            g.ruler.text.select("[type='ruler_text']").text(px2cm(distance) + " / " + g.options.y.invert(g.mouse.y).toFixed(5));
            g.ruler.text.select("[type='ruler_text']")
                .attr('x', g.mouse.x + 3)
                .attr('y', g.mouse.y - 3)
                .attr('d', g.options.x.invert(g.mouse.x + 3))
                .attr('p', g.options.y.invert(g.mouse.y - 3));
            //console.log(Math.round(Math.abs((new Date(g.mouse.x).getTime() - new Date(newStartX).getTime()) / 45)) + " / " + Math.round(Math.abs(g.mouse.y - newStartY) / 5) + " / " + g.options.y.invert(g.mouse.y).toFixed(5));
        }
    }
}

function rulerClick() {
    if (g.ruler.inProgress) {
        if (!g.ruler.start) {
            g.ruler.start = g.svg.append('g')
                .attr("x", g.mouse.x)
                .attr("y", g.mouse.y)
                .attr("d", g.options.x.invert(g.mouse.x))
                .attr("p", g.options.y.invert(g.mouse.y));
        } else {
            rulerEnd();
        }
    }
}

// Remove the ruler cursor
function rulerEnd() {
    if (g.ruler.inProgress) {
        //        if (g.ruler.line)
        //            g.ruler.line.remove();

        if (g.ruler.center)
            g.ruler.center.remove();

        if (g.ruler.start) {
            g.ruler.start.remove();
            g.ruler.start = null;
        }

        //        if (g.ruler.text)
        //            g.ruler.text.remove();

        if (g.ruler.vline)
            g.ruler.vline.remove();

        if (g.ruler.hline)
            g.ruler.hline.remove();

        g.ruler.inProgress = false;
        selectedOperation = null;
        cleanEnhancers();
    }
}

function updateLine() {
    if (g.drawer.inProgress) {
        //var far = getFarPoint(g.mouse.x, g.mouse.y, g.drawer.prevX, g.drawer.prevY, Math.max(g.svg.attr("width"), g.svg.attr("height")));
        var far = getFarPoint2(g.drawer.prevX, g.drawer.prevY, g.mouse.x, g.mouse.y);
        createLine(g.drawer.line, g.drawer.prevX, g.drawer.prevY, /*g.mouse.x, g.mouse.y*/ far.x, far.y, "red");
    }
}

function updateAngle() {
    if (g.angle.inProgress) {
        //var farPoint = getFarPoint(g.mouse.x, g.mouse.y, g.angle.srcX, g.angle.srcY, Math.max(g.svg.attr("width"), g.svg.attr("height")));
        var farPoint = getFarPoint2(g.angle.srcX, g.angle.srcY, g.mouse.x, g.mouse.y);
        var alpha = (-farPoint.alpha) * 180 / Math.PI; //(Math.asin(short/d) * 180) / Math.PI;
        var x2 = Math.min(farPoint.x, g.options.width),
            y2 = Math.min(farPoint.y, g.options.height);

        g.angle.dynamic_line
            .attr("x2", x2)
            .attr("y2", y2)
            .attr("d2", g.options.x.invert(x2))
            .attr("p2", g.options.y.invert(y2))
            .attr("d1", g.options.x.invert(g.angle.srcX))
            .attr("p1", g.options.y.invert(g.angle.srcY));
        g.angle.text
            .attr('x', g.angle.srcX)
            .attr('y', g.angle.srcY)
            .attr('d', g.options.x.invert(g.angle.srcX))
            .attr('p', g.options.y.invert(g.angle.srcY))
            .text(alpha.toFixed(2))
            .attr("font-size", 15)
            .style("font-weight", "bold");
    }
}

// Custom Buy & Sell operations
function customBuyClick() {
    if (g.custom_buy.inProgress) {
        if (!g.custom_buy.start) {
            g.custom_buy.start = g.svg.append('g')
                .attr("optype", 'b')
                .attr("x", g.mouse.x + OPERATION_PAD.x.b)
                .attr("y", g.mouse.y + OPERATION_PAD.y.b)
                .attr("d", g.options.x.invert(g.mouse.x))
                .attr("p", g.options.y.invert(g.mouse.y));
        } else {
            performOperation('b', true);
            customBuyEnd();
        }
    }
}

function customBuyUpdate() {
    if (!g.custom_buy.inProgress) {
        g.custom_buy.start = g.svg.append("g")
            .attr("optype", 'b')
            .attr("x", g.mouse.x + OPERATION_PAD.x.b)
            .attr("y", g.mouse.y + OPERATION_PAD.y.b);

        g.custom_buy.image = g.custom_buy.start.append("image");

        g.custom_buy.image
            .attr('xlink:href', OPERATION_ICON['b'])
            .attr('width', '34px')
            .attr('height', '34px');
        g.custom_buy.inProgress = true;
    } else {
        enhanceMouseSensitivity();
        g.custom_buy.image.attr('x', g.mouse.x + OPERATION_PAD.x.b).attr('y', g.mouse.y + OPERATION_PAD.y.b);
    }
}

function customBuyEnd() {
    if (g.custom_buy.inProgress) {
        if (g.custom_buy.start) {
            g.custom_buy.start.remove();
            g.custom_buy.start = null;
        }

        if (g.custom_buy.image)
            g.custom_buy.image.remove();

        g.custom_buy.inProgress = false;
        selectedOperation = null;
        cleanEnhancers();
    }
}

function customSellClick() {
    if (g.custom_sell.inProgress) {
        if (!g.custom_sell.start) {
            g.custom_sell.start = g.svg.append('g')
                .attr("optype", 's')
                .attr("x", g.mouse.x + OPERATION_PAD.x.s)
                .attr("y", g.mouse.y + OPERATION_PAD.y.s)
                .attr("d", g.options.x.invert(g.mouse.x))
                .attr("p", g.options.y.invert(g.mouse.y));
        } else {
            performOperation('s', true);
            customSellEnd();
        }
    }
}

function customSellUpdate() {
    if (!g.custom_sell.inProgress) {
        g.custom_sell.start = g.svg.append("g")
            .attr('optype', 's')
            .attr("x", g.mouse.x + OPERATION_PAD.x.s)
            .attr("y", g.mouse.y + OPERATION_PAD.y.s);

        g.custom_sell.image = g.custom_sell.start.append("image");

        g.custom_sell.image
            .attr('xlink:href', OPERATION_ICON['s'])
            .attr('width', '34px')
            .attr('height', '34px');
        g.custom_sell.inProgress = true;
    } else {
        enhanceMouseSensitivity();
        g.custom_sell.image.attr('x', g.mouse.x + OPERATION_PAD.x.s).attr('y', g.mouse.y + OPERATION_PAD.y.s);
    }
}

function customSellEnd() {
    if (g.custom_sell.inProgress) {
        if (g.custom_sell.start) {
            g.custom_sell.start.remove();
            g.custom_sell.start = null;
        }

        if (g.custom_sell.image)
            g.custom_sell.image.remove();

        g.custom_sell.inProgress = false;
        selectedOperation = null;
        cleanEnhancers();
    }
}

var markValue;

function updateMark() {
    if (!g.mark.inProgress) {
        g.mark.start = g.svg.append("g")
            .attr("label", markValue.label)
            .attr("configuration", markValue.configuration)
            .attr("x", g.mouse.x + OPERATION_PAD.x.markrect)
            .attr("y", g.mouse.y + OPERATION_PAD.y.markrect);

        //    g.mark.rect = g.mark.start.append("rect")
        //      .attr("class", "mark-rect")
        //      .attr("width", "40px")
        //      .attr("height", "18px")
        //      .attr('x', g.mouse.x + OPERATION_PAD.x.markrect)
        //      .attr('y', g.mouse.y + OPERATION_PAD.y.markrect);

        g.mark.rect = g.mark.start.append("circle")
            .attr("class", "mark-rect")
            .attr("r", "14px")
            .attr('cx', g.mouse.x + OPERATION_PAD.x.markcirc)
            .attr('cy', g.mouse.y + OPERATION_PAD.y.markcirc);

        g.mark.text = g.mark.start.append("text")
            .attr("class", "mark-text")
            .attr("text-anchor", "middle")
            .attr('x', g.mouse.x + OPERATION_PAD.x.marktext)
            .attr('y', g.mouse.y + OPERATION_PAD.y.marktext)
            .text(markValue.label);

        registerKeyListener(g.mark.start);
        registerKeyListener(g.mark.rect, g.mark.start);
        registerKeyListener(g.mark.text, g.mark.start);

        g.mark.inProgress = true;
    } else {
        enhanceMouseSensitivity();
        g.mark.rect
            .attr('cx', g.mouse.x + OPERATION_PAD.x.markcirc)
            .attr('cy', g.mouse.y + OPERATION_PAD.y.markcirc);
        g.mark.text
            .attr('x', g.mouse.x + OPERATION_PAD.x.marktext)
            .attr('y', g.mouse.y + OPERATION_PAD.y.marktext);
    }
}

function addMark() {
    if (g.mark.inProgress) {
        if (!g.mark.start) {
            g.mark.start = g.svg.append('g')
                .attr("label", markValue.label)
                .attr("configuration", markValue.configuration)
                .attr("x", g.mouse.x + OPERATION_PAD.x.markrect)
                .attr("y", g.mouse.y + OPERATION_PAD.y.markrect)
                .attr("d", g.options.x.invert(g.mouse.x))
                .attr("p", g.options.y.invert(g.mouse.y));
        } else {
            performMark();
            endMark();
        }
    }
}

function endMark() {
    if (g.mark.inProgress) {
        if (g.mark.start) {
            g.mark.start.remove();
            g.mark.start = null;
        }

        if (g.mark.rect) {
            g.mark.rect.remove();
        }

        if (g.mark.text) {
            g.mark.text.remove();
        }

        g.mark.inProgress = false;
        cleanEnhancers();
        selectedOperation = null;
    }
}

function linear_equation(x1, y1, x2, y2, q, req) {
    var m = (y2 - y1) / (x2 - x1);

    if (req == 'y') {
        return (m * (q - x1) + y1);
    } else {
        if (m != 0) {
            return (((q - y1) / m) + x1);
        } else {
            throw new Error("No equation");
        }
    }
}

function select(item) {
    g.selectedItem = item;
}

function registerKeyListener(target, del) {

    if (target.on) {
        target.on("click", function () {
            g.mouse = {
                x: d3.mouse(this)[0],
                y: d3.mouse(this)[1]
            };
            d3.event.stopPropagation();
            g.selectedItem = (del && del.node()) || this;
            if (selectedOperation && handlers[selectedOperation].click)
                handlers[selectedOperation].click();
        });
    }
}

function selectOperation(op) {
    var is_same_operation = selectedOperation === op;
    if (selectedOperation && handlers[selectedOperation].end) // end last operation
        handlers[selectedOperation].end();

    selectedOperation = is_same_operation ? null : op; // toggle operation

    if (selectedOperation && handlers[selectedOperation].begin)
        handlers[selectedOperation].begin();
}

/**BACKUP**/
/*
function scrollLeft() {
//  var ticks = d3.selectAll('#grid_y .tick')[0];
//  var data = d3.selectAll('rect[rectype="main"]')[0];
//  if(data.length - dataWindow.offsetY > ticks.length - 5) {    
  var data = allData.concat([]);
  var current = JSON.parse(sessionStorage.current || 'null');
  if (current) {
      data.push(current);
  }
  if (!data.length)
    return;
  
  var diff = new Date(data[data.length - 1].date) - new Date(data[0].date);
  var minDiff = Math.round(diff / 60000) + 1;
  //var dataCount = data.length / (dataWindow.interval / 2);
  var dataCount = minDiff / (dataWindow.interval / 2);
  dataCount = Math.max(dataCount, 1);
  
  if (dataCount > dataWindow.offsetY + (dataWindow.interval / 2) - 1) {
    dataWindow.offsetY += 1;// * (2 / dataWindow.interval);
    //changeOffsetX(dataWindow.offsetY + 1);
    refresh();
    refreshCurrent();
  }
}
*/

function scrollLeft() {
    //  var ticks = d3.selectAll('#grid_y .tick')[0];
    //  var data = d3.selectAll('rect[rectype="main"]')[0];
    //  if(data.length - dataWindow.offsetY > ticks.length - 5) {    
    var data = allData;
    var current = JSON.parse(sessionStorage.current || 'null');
    if (!data.length && !current)
        return;

    var diff = new Date(current ? current.date : data[data.length - 1].date) - new Date(data.length ? data[0].date : current.date);
    var minDiff = Math.round(diff / 60000) + 1;
    //var dataCount = data.length / (dataWindow.interval / 2);
    var dataCount = minDiff / (dataWindow.interval / 2);
    dataCount = Math.max(dataCount, 1);

    if (dataCount > dataWindow.offsetY + (dataWindow.interval / 2) - 1) {
        dataWindow.offsetY += 1; // * (2 / dataWindow.interval);
        //changeOffsetX(dataWindow.offsetY + 1);
        //refresh();
        //refreshCurrent();
    }
}

function scrollRight() {
    if (dataWindow.offsetY > 0) {
        dataWindow.offsetY -= 1; // * (2 / dataWindow.interval);
        //changeOffsetX(dataWindow.offsetY - 1);
        //refresh();
        //refreshCurrent();
    }
}

function keyEventHandler() {
    switch (d3.event.keyCode) {
        case 0x25: // left
            scrollLeft();
            break;
        case 0x27: // right
            scrollRight();
            break;
        case 0x6B: // plus
            increaseDataWindow();
            break;
        case 0x6D: // minus
            decreaseDataWindow();
            break;
        case 0x2E: // delete
            if (g.selectedItem) {
                if (g.selectedItem.getAttribute("data-id")) {
                    d3.xhr('/removeMark').header("Content-Type", "application/json")
                        .post(JSON.stringify({
                            id: g.selectedItem.getAttribute("data-id")
                        }), function (err, xhr) {
                            if (typeof xhr !== 'undefined' && xhr.status == 200) { // OK
                                if (g.children[g.selectedItem])
                                    g.children[g.selectedItem].remove();
                                g.selectedItem.remove();
                            }
                        });
                } else {
                    if (g.children[g.selectedItem])
                        g.children[g.selectedItem].remove();
                    g.selectedItem.remove();
                }
            }
            g.shapes.splice(g.shapes.indexOf(g.selectedItem), 1);
            break;
        case 0x20: //space
            if (g.selectedItem && g.selectedItem.tagName == "line") {
                var line = d3.select(g.selectedItem);
                var far = getFarPoint2(+line.attr("x1"), +line.attr("y1"), +line.attr("x2"), +line.attr("y2"));
                createLine(line, +line.attr("x1"), +line.attr("y1"), far.x, far.y, line.attr("stroke"));
            }
            break;
        case 0x0D: // enter
        case 0x11: // ctrl?
            if (handlers[selectedOperation])
                handlers[selectedOperation].click();
            break;
    }
}

function wheelScrollHandler() {
    var event = d3.event;
    event.preventDefault();
    var delta = event.wheelDelta;
    var times = Math.max(1, Math.abs(Math.round(delta / 60)));
    if (delta < 0) {
        for (var i = 0; i < times; i++) {
            scrollLeft();

        }
    } else if (delta > 0) {
        for (var i = 0; i < times; i++) {
            scrollRight();
        }
    }
}

var startX = 0;

function dragScrollHandler(event, state) {
    if (state === 'start') {
        startX = event.x;
        return;
    }
    if (state === 'end') {
        var endX = event.x;
        var delta = endX - startX;
        if (delta < 0) {
            scrollRight();
        } else if (delta > 0) {
            scrollLeft();
        }
        return;
    } else {
        if (event.x === 0) {
            return;
        }
        var delta = event.x - startX;
        if (Math.abs(delta) >= 20) {
            startX = event.x;
            var times = Math.max(1, Math.abs(Math.round(delta / 10)));
            if (delta < 0) {
                for (var i = 0; i < times; i++) {
                    scrollRight();
                }
            } else if (delta > 0) {
                for (var i = 0; i < times; i++) {
                    scrollLeft();
                }
            }
        }
    }
}

function packShapes() {
    var packed = [];

    g.shapes.forEach(function (shape) {
        packed.push(packShape(shape));
    });
}

function loadPackedShapes(shapes) {
    shapes.forEach(function (element) {
        switch (element.type) {

        }
    });
}

function updateShapesLocations() {
    try {
        svg.selectAll("[type='cross'],[type='dline'],[type='angle'],[type='ruler']").transition().duration(100)
            .attr("x1", function () {
                return g.options.x(new Date(this.getAttribute("d1")));
            })
            .attr("x2", function () {
                return g.options.x(new Date(this.getAttribute("d2")));
            })
            .attr("y1", function () {
                return g.options.y(this.getAttribute("p1"));
            })
            .attr("y2", function () {
                return g.options.y(this.getAttribute("p2"));
            });
        svg.selectAll("[type='custom_buy'],[type='custom_sell'],[type='cross'],[type='angle_text'],[type='ruler_text']").transition().duration(100)
            .attr("x", function () {
                return g.options.x(new Date(this.getAttribute("d")));
            })
            .attr("y", function () {
                return g.options.y(this.getAttribute("p"));
            });
    } catch (ex) {
        console.log("Could not refresh drawings. Exception: " + ex);
    }
}

function packShape(shape) {
    switch (shape.attr("type")) {
        case "cross":
            return {
                type: shape.attr("type"),
                center: {
                    x: (shape.attr("d")),
                    y: (shape.attr("p"))
                }
            };
        case "custom_buy":
        case "custom_sell":
            return {
                type: shape.attr("type"),
                center: {
                    x: (shape.attr("d")),
                    y: (shape.attr("p"))
                }
            };
        case "line":
        case "angle":
            return {
                type: shape.attr("type"),
                pntA: {
                    x: (shape.attr("d1")),
                    y: (shape.attr("p1"))
                },
                pntB: {
                    x: (shape.attr("d2")),
                    y: (shape.attr("p2"))
                }
            };
    }
}

function playAlert() {
    var audio = document.getElementById("alertAudio");
    audio.play();
};

function removeAllShapes() {
    var newShapes = [];
    var domain = xScale.domain();
    g.shapes.forEach(function (shape) {
        if (shape.attr("auto")) {
            newShapes.push(shape);
            return;
        }
        var d1 = new Date(shape.attr("d1"));
        var d2 = new Date(shape.attr("d2"));
        if ((d1 >= domain[0] && d1 <= domain[1]) || (d2 >= domain[0] && d2 <= domain[1])) {
            if (g.children[shape]) {
                g.children[shape].remove();
                delete g.children[shape];
            }
            shape.remove();
        } else {
            newShapes.push(shape);
        }
    });
    g.shapes = newShapes;
}


var RELAX_FACTOR = 1,
    relaxCount = 0;

function enhanceMouseSensitivity() {
    g.svg.append("rect")
        .attr("type", "mouseEnhancer")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", g.svg.attr("width"))
        .attr("height", g.svg.attr("height"))
        .attr("fill", "transparent");
}

function getFarPoint(x, y, cx, cy, r) {
    function pointOnCircle(cx, cy, r, a) {
        return {
            x: cx + (r * Math.cos(a)),
            y: cy + (r * Math.sin(a)),
            alpha: a
        };
    }

    function getAngle(cx, cy, x1, y1) {
        return Math.atan2(y1 - cy, x1 - cx);
    }

    enhanceMouseSensitivity();
    return pointOnCircle(cx, cy, r, getAngle(cx, cy, x, y));
}

function getFarPoint2(x1, y1, x2, y2) {
    var m = (y2 - y1) / (x2 - x1);
    var left = +xScale.range()[0];
    var right = +xScale.range()[1];
    var top = +yScale.range()[1];
    var bottom = +yScale.range()[0];
    var shouldBeLeft = x2 < x1;
    var shouldBeBottom = y2 > y1;

    var points = [];

    var a = Math.atan2(y2 - y1, x2 - x1);

    points.push(shouldBeLeft ? {
        y: Math.round(m * (left - x1) + y1),
        x: left,
        alpha: a
    } : {
        y: Math.round(m * (right - x1) + y1),
        x: right,
        alpha: a
    });

    points.push(shouldBeBottom ? {
        y: bottom,
        x: Math.round((bottom - y1) / m + x1),
        alpha: a
    } : {
        y: top,
        x: Math.round((top - y1) / m + x1),
        alpha: a
    });

    points = points.filter(function (p) {
        return p.x >= left && p.x <= right && p.y <= bottom && p.y >= top;
    });

    return points.length ? points[0] : {
        x: x1,
        y: y1,
        alpha: 0
    };
}

function restartRecorder() {
    if (confirm("Are you sure you want to restart the data recorder?")) {
        d3.xhr('/restartRecorder').get(function (err, data) {
            console.log(err, data);
            if (!err && data.response) {
                alert(data.response);
            }
        });
    }
}