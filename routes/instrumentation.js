var express = require('express');
var router = express.Router();
var db = require('../db');

/* GET users listing. */
router.post('/', function(req, res, next) {
    body = req.body;
    db.any(`INSERT INTO instrumentation values ('${body.code}', '${body.file}', ${body.time});`)
    .then(() => {
        res.send("Success!")
    })
    .catch(error => {
        console.log(error)
    });
});

router.get('/test', function(req, res, next) {
    res.send('instrumentation route reached');
});

module.exports = router;