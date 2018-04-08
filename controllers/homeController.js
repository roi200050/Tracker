/**
 * Created by avihay on 20/06/2015.
 */
var homeController = function () {},
    dataHandler = require('../model/dataHandler');

// initialize the main part that is responsible of networking with DB
homeController.prototype = {
    'init': function (app) {
        dataHandler.init(app);
        /*dataHandler.readData(
            function(d) {
                console.log(d);
            });*/
    },
    'cleanup': function () {
        dataHandler.cleanup();
    }
};

module.exports = new homeController();