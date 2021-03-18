var express = require('express');
var router = express.Router();
var db = require('../db');

/* GET users listing. */
router.post('/', function(req, res, next) {
    body = req.body;
    console.log(req.body);
    db.one(`SELECT * FROM codes WHERE code = '${body.code}';`).then(data => {
        console.log(data);
        if (data.admin == true) {
            res.send({user: 1, admin: 1, code: body.code})
        } else {
            res.send({user: 1, admin: 0})
        }
    })
    .catch(error => {
        console.log(error);
        res.send({user: 0, admin: 0})
    });
});

router.get('/test', function(req, res, next) {
    res.send('login route reached');
});

module.exports = router;