// loads trades list
function loadTradesDatesList() {
    d3.json("/getTradesData", function (error, data) {
        if (!error) {
            data.sort(function (a, b) {
                // Turn your strings into dates, and then subtract them
                // to get a value that is either negative, positive, or zero.
                return new Date(b) - new Date(a);
            });
            d3.select('#tradesSelect')
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
            d3.select('#tradesSelect')
                .append('option')
                .text("Could not load trades.");
        }
    });
}

// requests details of a specific trade from server
function queryTrades() {
    var date = d3.select('#tradesSelect').node().value,
        operation_type = $("input[name=operation_types]:checked").val(), // regular/custom/replay
        xhr = new XMLHttpRequest();

    xhr.open('POST', '/findTrades', true);
    xhr.setRequestHeader("Content-type", "application/json");
    xhr.onreadystatechange = function () {
        if (xhr.readyState == 4 && xhr.status == 200) {
            var tradesData = JSON.parse(xhr.responseText);

            // sort rows before populating
            tradesData.sort(function (a, b) {
                var aInitTime = a.init_date.split(":"),
                    bInitTime = b.init_date.split(":"),
                    aDate = new Date(),
                    bDate = new Date();

                aDate.setHours(aInitTime[0]);
                aDate.setMinutes(aInitTime[1]);
                aDate.setSeconds(aInitTime[2]);

                bDate.setHours(bInitTime[0]);
                bDate.setMinutes(bInitTime[1]);
                bDate.setSeconds(bInitTime[2]);

                return aDate - bDate;
            });

            d3.select("#tradesBody").selectAll("tr").remove();
            var classer = {
                Sell: "glyphicon glyphicon-log-out btn-xs rotate_90",
                Buy: "glyphicon glyphicon-log-out btn-xs rotate_270"
            };
            var successes = 0,
                total_closed_operations = 0,
                total_positive_pipses = 0,
                total_negative_pipses = 0;
            for (var i = 0; i < tradesData.length; i++) {
                var trade = tradesData[i],
                    endDate = new Date(trade.end_date),
                    newRow = d3.select("#tradesBody")
                    .append("tr")
                    .attr("style", "color:" + (trade.operation_name == "Buy" ? "green" : "red"));
                newRow.append("td").text(trade.id);
                newRow.append("td").text(i + 1);
                newRow.append("td").text(new Date(trade.day).toLocaleDateString('he-IL'));
                newRow.append("td").text(trade.operation_name)
                    .append("span")
                    .attr("class", classer[trade.operation_name]);
                newRow.append("td").text(trade.init_date);
                newRow.append("td").text(endDate.toLocaleTimeString('he-IL') + " " + endDate.toLocaleDateString('he-IL'));

                var init_price = trade.init_value,
                    end_price = trade.end_value,
                    difference = end_price - init_price;

                newRow.append("td").text(init_price);
                newRow.append("td").text(end_price);

                var succeeded = trade.succeeded,
                    is_success = succeeded == "True",
                    is_failure = succeeded == "False";
                newRow.append("td").text(succeeded);
                if (is_success) successes++;

                newRow.append("td").text(''); // succeeded (%)

                if (is_success)
                    total_positive_pipses += Math.abs(difference);
                else if (is_failure)
                    total_negative_pipses += Math.abs(difference);

                if (is_success || is_failure) {
                    total_closed_operations++;
                    newRow.append("td").text((is_success ? '+' : '-') + Math.abs(difference * 10000).toFixed(2)); // pipses
                } else
                    newRow.append("td").text('');

                // add summary row every 10 rows
                var add_summary_row = i > 0 && ((i + 1) % 10 === 0);
                if (add_summary_row) {
                    newRow = d3.select("#tradesBody")
                        .append("tr");
                    for (var j = 0; j < 8; j++)
                        newRow.append("td").text('');
                    var success_percent = (successes / total_closed_operations * 100).toFixed(2) + '%';
                    newRow.append("td").text(total_closed_operations === 0 ? '-' : success_percent); // succeeded (%)
                    newRow.append("td").text('-' + Math.abs(total_negative_pipses * 10000).toFixed(2) + '/ +' + Math.abs(total_positive_pipses * 10000).toFixed(2)); // pipses
                    successes = total_positive_pipses = total_negative_pipses = total_closed_operations = 0; // reset parameters
                    newRow.append("td").text('');
                }
            }
        }
    };
    var options = {
        date: date,
        regular: false,
        custom: false,
        replay: false
    };
    options[operation_type] = true;

    if (options.replay) { // if replay trades are requested, display regular & custom
        delete options.regular;
        delete options.custom;
    }

    xhr.send(JSON.stringify(options));
}

// requests from server to calculate whether the buy/sell operations succeeded or not
function resolveTrades() {
    var date = d3.select('#tradesSelect').node().value,
        // operation_type = $("input[name=operation_types]:checked").val(), // regular/custom/replay
        xhr = new XMLHttpRequest();

    xhr.open('POST', '/resolveTrades', true);
    xhr.setRequestHeader("Content-type", "application/json");
    xhr.onreadystatechange = function () {
        if (xhr.readyState == 4 && xhr.status == 200) {
            location.reload();
        }
    };

    // var options = {
    //     date: date,
    //     regular: false,
    //     custom: false,
    //     replay: false
    // };
    // options[operation_type] = true;

    // if (options.replay) { // if replay trades are requested, display regular & custom
    //     delete options.regular;
    //     delete options.custom;
    // }

    // xhr.send(JSON.stringify(options));

    xhr.send(JSON.stringify({
        date: date
    }));
}