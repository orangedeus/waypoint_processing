var express = require('express');
var router = express.Router();
var haversine = require('haversine');
var db = require('../db');
router.use(express.json());


router.get('/', function(req, res, next) {
    db.one('SELECT * FROM test;').then(data => {
        console.log(data)
        res.send('Message from database: ' + data.message);
    })
    .catch(error => {
        console.log(error)
    });
});
router.get('/all', function(req, res, next) {
    db.multi('SELECT * FROM stops;').then(data => {
        res.json({data: data[0]});
    })
    .catch(error => {
        console.log(error)
    });
});

router.get('/all/annotated', function(req, res, next) {

    db.multi('SELECT location, annotated as people, url FROM stops;').then(data => {
        stops = data[0]
        res.json({data: stops});
    })
    .catch(error => {
        console.log(error)
    });
});

router.get('/all/screened', function(req, res, next) {
    db.multi('SELECT location, people FROM screened;').then(data => {
        stops = data[0]
        res.json({data: stops});
    })
    .catch(error => {
        console.log(error)
    });
});

router.get('/all/cleaned', function(req, res, next) {
    let distance = (x1, y1, x2, y2) => {
        let x = (x2 - x1) ** 2;
        let y = (y2 - y1) ** 2;
        return ((x + y) ** (1/2));
    }
    let clean = (stops) => {
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

    db.multi('SELECT * FROM stops;').then(data => {
        stops = data[0]
        console.log(stops)
        cleaned_stops = clean(stops)
        res.json({data: cleaned_stops});
    })
    .catch(error => {
        console.log(error)
    });
});
router.get('/all/clean_annotated', function(req, res, next) {
    let clean = (stops) => {
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

    db.multi('SELECT location, annotated as people, url FROM stops;').then(data => {
        stops = data[0]
        cleaned_stops = clean(stops)
        console.log(cleaned_stops.length)
        res.json({data: cleaned_stops});
    })
    .catch(error => {
        console.log(error)
    });
});

router.post('/update', function(req, res, next) {
    body = req.body;
    db.any(`UPDATE stops SET annotated = ${body.people} WHERE location ~= point(${body.location.x}, ${body.location.y});`).then(data => {
        res.send('Success!');
    })
    .catch(error => {
        console.log(error)
    });
});


router.post('/insert', function(req, res, next) {
    body = req.body;
    db.any(`INSERT INTO stops values (point(${body.location.x}, ${body.location.y}), ${body.people}, '${body.url}');`)
    .then(() => {
        res.send("Success!")
    })
    .catch(error => {
        console.log(error)
    });
});

router.post('/update2', function(req, res, next) {
    body = req.body;
    db.any(`UPDATE stops SET annotated = ${body.people} WHERE location ~= point(${body.location.x}, ${body.location.y});`)
    .catch(error => {
        console.log(error)
    });

    db.multi()
});

router.post('/insert_screened', function(req, res, next) {
    body = req.body;
    db.any(`INSERT INTO screened values (point(${body.location.x}, ${body.location.y}), ${body.people});`)
    .then(() => {
        res.send("Success!")
    })
    .catch(error => {
        console.log(error)
    });
});

router.post('/insert2', function(req, res, next) {
    let clean = (stops) => {
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
                if (dist < 1) {
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

    body = req.body;
    console.log(`INSERT INTO stops values (point(${body.location.x}, ${body.location.y}), ${body.people}, '${body.url}');`);
    db.any(`INSERT INTO stops values (point(${body.location.x}, ${body.location.y}), ${body.people}, '${body.url}');`).then(data => {
        res.send('Success!');
    })
    .catch(error => {
        console.log(error)
    });

    db.multi('SELECT location, annotated as people, url FROM stops;').then(data => {
        stops = data[0]
        cleaned_stops = clean(stops)
        
    })
    .catch(error => {
        console.log(error)
    });
});

module.exports = router;