/**
 * Created by avihay on 20/06/2015.
 */
var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/bootstrap', function (req, res, next) {
    var bootstrap = require('bootstrap/dist/js/bootstrap.min.js');
    res.send(bootstrap);
});

module.exports = router;