var express = require('express');
var router = express.Router();
var db = require('../db');

router.get('/', function(req, res, next) {
    db.many('SELECT id as value, route as label FROM ROUTES;').then(data => {
        console.log(data);
        res.send(data);
    })
    .catch((e) => {
        console.log(e);
        res.send(e);
    });
});

router.post('/insert', function (req, res, next) {
    body = req.body;
    db.any(`INSERT INTO routes(route) values ('${body.route}');`).then(() => {
        res.send('Success!');
    })
    .catch((e) =>{
        console.log(e);
    });
});

router.get('/test', function(req, res, next) {
    res.send('routing route reached');
});

module.exports = router;