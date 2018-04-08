/**
 * Created by avihay on 4/26/2017.
 */

var markFetcher = null;

function startMarkFetcher(getMinDate, getMaxDate, newMarkCallback, fetchInterval) {

    if (markFetcher)
        clearInterval(markFetcher);

    markFetcher = setInterval(function () {

        var searchCriteria = {
            from: getMinDate(),
            till: getMaxDate()
        };

        d3.xhr('/graph/autoMarks/getBetween').header("Content-Type", "application/json")
            .post(JSON.stringify(searchCriteria), function (err, xhr) {
                if (typeof xhr !== 'undefined' && xhr.status == 200) { // OK
                    var responseData = JSON.parse(xhr.response);

                    if (responseData.error) {
                        console.log("Error while reading marks. Details: " + responseData.data);
                    } else {
                        for (var i = 0; i < responseData.data.length; i++) {
                            newMarkCallback(responseData.data[i]);
                        }
                    }
                }
            });
    }, fetchInterval);
}

function stopMarkFetcher() {
    if (markFetcher) {
        clearInterval(markFetcher);
        markFetcher = null;
    }
}