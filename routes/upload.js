var express = require('express');
var router = express.Router();


router.post('/', function(req, res) {
    if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).send('No files were uploaded.');
    }

    let video = req.files.upload_file;
    video.mv('./videos/' + video.name, function(err) {
        if (err) {
            return res.status(500).send(err);
        }
    });
    res.send('Uploaded!');
});


module.exports = router;