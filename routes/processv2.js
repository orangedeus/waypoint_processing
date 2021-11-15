var express = require('express');
var router = express.Router();
const fs = require("fs-extra");
var path = require('path');
var axios = require('axios');
var { promisify } = require('util');
const exec = promisify(require('child_process').exec);
var db = require('../db');
router.use(express.json());

const uploadPath = path.join(process.cwd(), 'process');
let state = ''

router.get('/check/:filename', (req, res, next) => {
    state = 'checking'
    const filename = req.params.filename;
    let bytes = 0;
    let filePath = path.join(uploadPath, filename);
    if (fs.existsSync(filePath)) {
        try {
            const fd = fs.openSync(filePath, "r");
            const fileStat = fs.fstatSync(fd);
            bytes = fileStat.size;
        } catch (error) {
            console.log(error);
        }
    }
    res.send({bytes: bytes});
});

router.get('/finish', function(req, res, next) {
    state = 'finishing'
    fs.emptyDir(uploadPath, (err) => {
        if (err) {
            res.status(404).send('error');
        } else {
            res.send('ok');
        }
    })
});

router.post('/delete', (req, res, next) => {
    state = 'deleting'
    body = req.body;

    for (const key of Object.keys(body)) {
        fs.removeSync(path.join(uploadPath, body[key].filename));
    }
    res.send('success');
})

router.post('/process', (req, res, next) => {
    state = 'processing'
    body = req.body;

    req.socket.setKeepAlive(true, 60000);

    req.on('timeout', () => {
        console.log('request timed out');
    });

    let video_types = ['.avi', '.mp4', '.mov'];
    let response = {}
    let execution = async () => {
        console.log('Processing');
        for (const key of Object.keys(body)) {
            let file = `/home/ec2-user/team1_backend/process/${body[key].filename}`;
            // console.log(file, fs.existsSync(file), ((video_types.includes(path.extname(`file`).toLowerCase())) && (!fs.existsSync(file))));
            let gpx = `${file.split('.')[0]}.gpx`;
            let csv = `${file.split('.')[0]}.csv`;
            let xls = `${file.split('.')[0]}.xls`;
            if (!video_types.includes(path.extname(file).toLowerCase())) {
                response[body[key].filename] = 'ok';
                continue;
            }
            let run;
            if (fs.existsSync(gpx)) {
                run = await exec(`conda run python /home/ec2-user/processing/process.py -F ${file} -G ${gpx} -R '${body[key].route}' -B ${body[key].batch}`);
            } else if (fs.existsSync(csv) || fs.existsSync(xls)) {
                run = await exec(`conda run python /home/ec2-user/processing/process.py -F  ${file} -SH ${fs.existsSync(csv) ? csv : xls} -R '${body[key].route}' -B ${body[key].batch}`);
            } else {
                run = await exec(`conda run python /home/ec2-user/processing/process.py -F ${file} -R '${body[key].route}' -B ${body[key].batch}`);
            }
            if (run.stderr.includes("ERROR ENCOUNTERED")) {
                response[body[key].filename] = 'failed';
            } else {
                response[body[key].filename] = 'ok';
            }
            console.log(run) // for logging
        }
    }
    execution().then(() => {
        console.log('ended', req.socket.destroyed);
        res.send(response);
    })
});

router.post('/', function(req, res) {
    let busboy = req.busboy;
    let body = req.body;
    state = 'uploading'
    let xFileName = req.headers['x-file-name'];
    let xStartByte = parseInt(req.headers['x-start-byte'], 10);
    let xFileSize = parseInt(req.headers['x-file-size'], 10);

    console.log('starting upload session with headers:', xFileName, xStartByte, xFileSize);

    req.socket.on('close', () => {
        console.log('session ended for', xFileName, xStartByte, xFileSize, state);
        if (state == 'uploaded') {
            axios.post('http://18.136.217.164:3001/process/tracking', {
                stage: 'update',
                status: 'Uploaded',
                fileName: xFileName
            });
        }
    });

    if (xFileSize <= xStartByte) {
        state = 'uploaded'
        return res.send("File already uploaded");
    }

    req.pipe(busboy);
 
    busboy.on("file", (fieldname, file, filename) => {
        let filePath = path.join(uploadPath, filename);
        let fstream;
        if (xStartByte) {
            fstream = fs.createWriteStream(filePath, {
                flags: "a"
            });
        } else {
            fstream = fs.createWriteStream(filePath, {
                flags: "w"
            });
        }
        file.pipe(fstream);

        file.on("error", (e) => {console.log(e)});
        file.on("limit", (e) => {console.log(e)});

        fstream.on("close", () => {
            console.log("finished");
        });
    });

    busboy.on("finish", function(a) {
        state = 'uploaded'
        console.log('session ended 2');
        return res.send("ok");
    });
    busboy.on("error", function(a) {
        return res.send("error");
    });

});

module.exports = router;