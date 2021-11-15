var express = require('express');
var router = express.Router();
const fs = require("fs");
var path = require('path');
var axios = require('axios');
var { promisify } = require('util');
const exec = promisify(require('child_process').exec);
router.use(express.json())

router.post('/', function(req, res) {
    if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).send('No files were uploaded.');
    }

    if (Array.isArray(req.files.upload)) {
        videos = req.files.upload
    } else {
        videos = [req.files.upload]
    }
    body = req.body;
    console.log(body)
    console.log(videos.length)
    fs.readdir('./process', (err, files) => {
        if (err) throw err;
        for (const file of files) {
          fs.unlink(path.join('./process', file), err => {
            if (err) throw err;
          });
        }
        for (const key of Object.keys(videos)) {
            axios.post('http://18.136.217.164:3001/process/tracking', {
                stage: 'update',
                status: 'Uploaded',
                fileName: videos[key].name
            });
            videos[key].mv('./process/' + videos[key].name, function(err) {
                if (err) {
                    return res.status(500).send(err);
                }
            });
        }
        let execution = async () => {
            let video_types = ['.mp4', '.mov'];
            for (const key of Object.keys(videos)) {
                let file = `/home/ec2-user/team1_backend/process/${videos[key].name}`;
                let gpx = `${file.split('.')[0]}.gpx`
                if (video_types.includes(path.extname(`file`).toLowerCase())) {
                    continue;
                }
                if (fs.existsSync(gpx)) {
                    await exec(`conda run python /home/ec2-user/processing/process.py -F ${file} -G ${gpx} -R '${body.route}'`);
                } else {
                    await exec(`conda run python /home/ec2-user/processing/process.py -F ${file} -R '${body.route}'`);
                }
            }
        }
        execution().then(() => {
            axios.get('http://18.136.217.164:3001/instance/stop');
        });
        res.send('Uploaded!');
    });
});

/* "conda run python \"C:\\Users\\jpcha\\Tree\\Files\\Acad\\CS198-199\\ExtendedTinyFaces\\process.py\"" */
//let run = exec(`conda run python /home/ec2-user/processing/process.py -D /home/ec2-user/team1_backend/process -R '${body.route}'`, (e, out, err) => {console.log(out)});
//console.log(run);

// let execution = new Promise((resolve, reject) => {
//     let count = 0;
//     for (const key of Object.keys(videos)) {
//         let run = exec(`conda run python /home/ec2-user/processing/process.py -F /home/ec2-user/team1_backend/process/${videos[key].name} -R '${body.route}'`);
//         console.log("Count: ", count, " ", run, " ", videos.length);
//         count += 1;
//     }
//     if (count == videos.length) {
//         console.log(count);
//         resolve();
//     }
// });
module.exports = router;