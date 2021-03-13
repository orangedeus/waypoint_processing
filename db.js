var pgp = require('pg-promise')({});
var db = pgp('postgresql://cs199ndsg:ndsg@localhost:5432/cs199ndsg');

module.exports = db;