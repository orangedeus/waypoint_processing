var express = require('express');
var router = express.Router();
var db = require('../db');

/* GET users listing. */
router.post('/', function(req, res, next) {
    body = req.body;
    console.log(req.body);
    db.one(`SELECT code FROM codes WHERE code = '${body.code}';`).then(data => {
        console.log(data);
        res.send({valid: 1});
    })
    .catch(error => {
        console.log(error);
        res.send({valid: 0});
    });
});

router.get('/test', function(req, res, next) {
    res.send('login route reached');
});

module.exports = router;