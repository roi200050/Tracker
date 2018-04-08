var marksDim = {
        width: Math.max(Math.floor($(window).width() * 0.8), 900), // 1670,
        height: $(window).height() * 1.25 // 830
    },
    marksSvg_size = {
        width: marksDim.width - margin.left - margin.right,
        height: marksDim.height - margin.top - margin.bottom
    };

var marksRadius = Math.min(marksDim.width, marksDim.height) / 2;

var marksSvg = d3.select("#mark-body").append("svg")
    .attr("width", marksDim.width)
    .attr("height", marksDim.height)
    .append("g")
    .attr("transform", "translate(" + marksDim.width / 2 + "," + marksDim.height / 2 + ")")
    .attr("style", "position: relative");

var arc = d3.svg.arc()
    .outerRadius(marksRadius - 40)
    .innerRadius(0);

var labelArc = d3.svg.arc()
    .outerRadius(marksRadius - 15)
    .innerRadius(marksRadius - 15)
    .startAngle(function (d) {
        return 2 * d.startAngle - d.endAngle;
    })

var labelSmallArc = d3.svg.arc()
    .outerRadius(marksRadius - 28)
    .innerRadius(marksRadius - 28)
    .startAngle(function (d) {
        return 2 * d.startAngle - d.endAngle;
    })

var pie = d3.layout.pie()
    .sort(null)
    .value(function (mark, i) {
        return 1
    });

var marks;

//var marksG = marksSvg.append("g").attr("transform", "translate(" + marksDim.width / 2 + "," + marksDim.height / 2 + ")");

var marksG;

var marksTicks;

var configureMarkAngular;

function drawMarks() {
    var data = marks.filter(function (m) {
        return m.label.indexOf('.') == -1;
    });

    marksBigG = marksSvg.selectAll(".markBigG")
        .data(pie(data))
        .enter().append("g")
        .attr("class", "markBigG markG")
        .attr("label", function (d) {
            return d.data.label
        })
        .attr("configuration", function (d) {
            return d.data.configuration
        })
        .on('click', configureMarkAngular);

    marksBigG.append("path")
        .attr("d", arc)
        .attr("class", "mark-arc")
        .style("fill", "white")
        .style("stroke", "black");

    marksBigG.append("rect")
        .attr("transform", function (d) {
            return "translate(" + labelArc.centroid(d) + ")";
        })
        .attr("x", -10)
        .attr("y", -10)
        .attr("width", 20)
        .attr("height", 20)
        .attr("class", "mark-all-rect");

    marksBigG.append("text")
        .attr("transform", function (d) {
            return "translate(" + labelArc.centroid(d) + ")";
        })
        .attr("dy", ".35em")
        .attr("text-anchor", "middle")
        .attr("class", "mark-big-text")
        .text(function (d) {
            return d.data.label
        });

    var marksAllG = marksSvg.selectAll(".markAllG")
        .data(pie(marks))
        .enter().append("g")
        .attr("class", "markAllG markG")
        .attr("label", function (d) {
            return d.data.label
        })
        .attr("configuration", function (d) {
            return d.data.configuration
        })
        .on('click', configureMarkAngular);;

    marksAllG.append("line")
        .attr("class", "markTicks")
        .attr("x1", 0)
        .attr("x2", 0)
        .attr("y1", -marksRadius + 40)
        .attr("y2", function (d) {
            if (d.data.label.indexOf('.') == -1)
                return -marksRadius + 30;
            return -marksRadius + 35;
        })
        .attr("stroke", "black")
        .attr("transform", function (d) {
            return "rotate(" + d.startAngle * (180 / Math.PI) + ")";
        });

    marksAllG.append("rect")
        .attr("transform", function (d) {
            return "translate(" + labelSmallArc.centroid(d) + ")";
        })
        .attr("x", -5)
        .attr("y", -5)
        .attr("width", 10)
        .attr("height", 10)
        .attr("class", "mark-all-rect");

    marksAllG.append("text")
        .attr("transform", function (d) {
            return "translate(" + labelSmallArc.centroid(d) + ")";
        })
        .attr("dy", ".35em")
        .attr("text-anchor", "middle")
        .attr("class", "mark-all-text")
        .text(function (d) {
            var t = d.data.label;
            var sep = t.indexOf('.');
            if (sep == -1)
                return '';
            return t.substring(sep + 1);
        });

    d3.selectAll(".markAllG").filter(function (x) {
        return x.data.label.indexOf('.') == -1
    }).remove();
}