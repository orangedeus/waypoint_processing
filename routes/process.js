var express = require('express');
var router = express.Router();
const fs = require("fs");
var path = require('path');
const { exec } = require('child_process');
router.use(express.json())

router.post('/', function(req, res) {
    if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).send('No files were uploaded.');
    }

    let videos = '';

    if (Array.isArray(req.files.upload)) {
        videos = req.files.upload
    } else {
        videos = [req.files.upload]
    }
    fs.readdir('./process', (err, files) => {
        if (err) throw err;
        for (const file of files) {
          fs.unlink(path.join('./process', file), err => {
            if (err) throw err;
          });
        }
        for (const key of Object.keys(videos)) {
            videos[key].mv('./process/' + videos[key].name, function(err) {
                if (err) {
                    return res.status(500).send(err);
                }
            });
        }
        let run = exec(`conda run python C:\\Users\\jpcha\\Tree\\Files\\Acad\\CS198-199\\ExtendedTinyFaces\\process.py -D C:\\Users\\jpcha\\Tree\\Files\\Acad\\CS198-199\\testing\\backend\\process`, (e, out, err) => {console.log(out)});
        console.log(run);
        res.send('Uploaded!');
    }); 
});

/* "conda run python \"C:\\Users\\jpcha\\Tree\\Files\\Acad\\CS198-199\\ExtendedTinyFaces\\process.py\"" */
module.exports = router;