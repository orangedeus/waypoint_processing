var express = require('express');
var router = express.Router();
var haversine = require('haversine');
var db = require('../db');
router.use(express.json());

var clean = (stops) => {
    new_stops = []
    for (var i = 0; i < stops.length; i++) {
        let curr_num_x = (stops[i].people * stops[i].location.x)
        let curr_num_y = (stops[i].people * stops[i].location.y)
        let curr_den = stops[i].people
        let gathered_n = 1
        for (var j = 0; j < stops.length; j++) {
            if (i == j) {
                continue;
            }
            let coord1 = {
                latitude: stops[i].location.x,
                longitude: stops[i].location.y
            }
            let coord2 = {
                latitude: stops[j].location.x,
                longitude: stops[j].location.y
            }
            let dist = haversine(coord1, coord2)
            if (dist < 0.1) {
                console.log(dist)
                curr_num_x += (stops[j].people * stops[j].location.x)
                curr_num_y += (stops[j].people * stops[j].location.y)
                curr_den += stops[j].people
                gathered_n += 1
                stops.splice(j, 1)
                j = j - 1
            }
        }
        // for (var k = 0; k < new_stops.length; k++) {
        //     let dist = distance(stops[i].location.x, stops[i].location.y, new_stops[k].location.x, new_stops[k].location.y)
        //     if (dist < 0.001) {
        //         console.log(dist)
        //         curr_num_x += (new_stops[k].people * new_stops[k].location.x)
        //         curr_num_y += (new_stops[k].people * new_stops[k].location.y)
        //         curr_den += new_stops[k].people
        //         gathered_n += 1
        //         new_stops.splice(k, 1)
        //     }
        // }
        if (curr_den == 0) {
            continue
        }
        new_x = curr_num_x / curr_den
        new_y = curr_num_y / curr_den
        new_people = curr_den / gathered_n
        new_stop = 
        {
            location: {
                x: new_x,
                y: new_y
            },
            people: new_people,
            annotated: 0
        }
        new_stops.push(new_stop)
    }
    return (new_stops)
}

router.get('/test', function(req, res, next) {
    db.one('SELECT * FROM test;').then(data => {
        console.log(data)
        res.send('Message from database: ' + data.message);
    })
    .catch(error => {
        console.log(error)
    });
});

router.get('/', function(req, res, next) {
    console.log(req.params)
    db.multi('SELECT * FROM stops;').then(data => {
        console.log(data[0]);
        res.json(data[0]);
    })
    .catch(error => {
        res.send(error)
        console.log(error)
    });
});

router.get('/:route', function (req, res, next) {
    console.log(req.params)
    route = req.params.route;
    db.many(`SELECT * FROM stops WHERE route = '${route}'`).then(data => {
        res.json(data);
    }).catch(e => {
        res.send(e);
    });
});

router.post('/update', function(req, res, next) {
    body = req.body;
    db.any(`UPDATE stops SET annotated = ${body.annotated}, boarding = ${body.boarding}, alighting = ${body.alighting} WHERE location ~= point(${body.location.x}, ${body.location.y});`).then(data => {
        res.send('Success!');
    })
    .catch(error => {
        console.log(error)
    });
});


router.post('/insert', function(req, res, next) {
    body = req.body;
    db.any(`INSERT INTO stops(location, people, url, route) values (point(${body.location.x}, ${body.location.y}), ${body.people}, '${body.url}', '${body.route}');`)
    .then(() => {
        res.send("Success!")
    })
    .catch(error => {
        res.send(error)
        console.log(error)
    });
});

module.exports = router;