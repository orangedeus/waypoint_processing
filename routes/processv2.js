var express = require('express');
var router = express.Router();
const fs = require("fs-extra");
var path = require('path');
var axios = require('axios');
var { promisify } = require('util');
const exec = promisify(require('child_process').exec);
var db = require('../db');
var crypto = require('crypto');
router.use(express.json());

const { WAYPOINT_BACKEND_API } = require('../config');

const generateChecksum = (data, algo, enc) => {
    return crypto.createHash(algo || 'md5').update(data, 'utf8').digest(enc || 'hex');
}

const uploadPath = path.join(process.cwd(), 'process');

var check_tracking = (filename, route, batch) => {
    return new Promise((resolve, reject) => {
        axios.get(`${WAYPOINT_BACKEND_API}/process/tracking_status?filename=${filename}&route=${route}&batch=${batch}`).then((res) => {
            resolve(res.data)
        }).catch((error) => {
            reject(error)
        })
    })
}

var tracking_start = (filename, route, batch) => {
    return new Promise((resolve, reject) => {
        axios.post(`${WAYPOINT_BACKEND_API}/process/tracking`, {
            stage: 'initial',
            status: "Uploading",
            fileName: filename,
            route: route,
            batch: batch
        }).then((res) => {
            resolve(res.data.tracking);
        }).catch((error) => {
            reject(error);
        });
    })
}

var tracking_update = (filename, route, batch, tracking, status) => {
    axios.post(`${WAYPOINT_BACKEND_API}/process/tracking`, {
        stage: 'update',
        status: status,
        fileName: filename,
        route: route,
        batch: batch,
        tracking: tracking
    }).catch((e) => {
        console.log(e);
    });
}

router.get('/check/:filename', (req, res, next) => {
    let filename = req.params.filename;
    let bytes = 0;
    let filePath = path.join(uploadPath, filename);
    if (fs.existsSync(filePath)) {
        try {
            const fileStat = fs.statSync(filePath);
            bytes = fileStat.size;
        } catch (error) {
            console.log(error);
        }
    } else {

    }
    res.send({ bytes: bytes });
});

router.get('/upload_status', (req, res, next) => {
    const { filename, route, batch } = req.query;
    let filePath = path.join(uploadPath, filename);
    let response = {
        tracking: undefined,
        bytes: 0
    }
    if (fs.existsSync(filePath)) {
        check_tracking(filename, route, batch).then((data) => {
            if (data.status) {
                response.tracking = data.tracking;
                try {
                    const fileStat = fs.statSync(filePath);
                    response.bytes = fileStat.size;
                } catch (error) {
                    console.log(error);
                }
            } else {
                tracking_start(filename, route, batch).then((tracking) => {
                    response.tracking = tracking;
                })
            }
            res.send(response);
            return;
        })
    } else {
        tracking_start(filename, route, batch).then((tracking) => {
            response.tracking = tracking;
            res.send(response);
        })
        return;
    }
})

router.get('/finish', function (req, res, next) {
    fs.emptyDir(uploadPath, (err) => {
        if (err) {
            res.status(404).send('error');
        } else {
            res.send('ok');
        }
    })
});

router.post('/delete', (req, res, next) => {
    body = req.body;

    for (const key of Object.keys(body)) {
        fs.removeSync(path.join(uploadPath, body[key].filename));
    }
    res.send('success');
})

router.post('/convert', (req, res, next) => {
    body = req.body;

    req.socket.setKeepAlive(true, 60000);

    files = body.files;

    req.on('timeout', () => {
        console.log('request timed out');
    });

    let response = {}

    let conversion = async () => {

        for (const key of Object.keys(files)) {
            let filename = `/home/ec2-user/team1_backend/process/${files[key].name}`;

            let run;
            if (fs.existsSync(filename)) {
                run = await exec(`ffmpeg -y -f h264 -i ${filename} -threads 4 -c:v libx264 -preset ultrafast ${filename.split(".")[0]}.mp4`);
                response[files[key].name] = 'ok';
            } else {
                response[files[key].name] = 'failed';
            }
            console.log(run)
        }
    }

    conversion().then(() => {
        res.send(response)
    })
});

router.post('/process', (req, res, next) => {
    body = req.body;

    req.socket.setKeepAlive(true, 60000);

    req.on('timeout', () => {
        console.log('request timed out');
    });

    let video_types = ['.avi', '.mp4', '.mov'];
    let response = {}

    let conversion = async (filename) => {
        let run;
        let output = `${filename.split(".")[0]}.mp4`
        if (fs.existsSync(filename)) {
            run = await exec(`ffmpeg -y -f h264 -i ${filename} -threads 2 -c:v libx264 -preset ultrafast ${output}`);
            return output;
        } else {
            return filename;
        }
    }

    let execution = async () => {
        console.log('Processing', body);
        for (const key of Object.keys(body)) {
            let file = `/home/ec2-user/team1_backend/process/${body[key].filename}`;
            let filenameArr = file.split(".");
            if (filenameArr[filenameArr.length - 1] == 'ifv') {
                console.log('converting');
                tracking_update(body[key].filename, body[key].route, body[key].batch, body[key].tracking, 'Converting')
                file = await conversion(file);
                tracking_update(body[key].filename, body[key].route, body[key].batch, body[key].tracking, 'Converted')
                console.log('conversion done');
            }
            // console.log(file, fs.existsSync(file), ((video_types.includes(path.extname(`file`).toLowerCase())) && (!fs.existsSync(file))));
            let gpx = `${filenameArr[0]}.gpx`;
            let csv = `${filenameArr[0]}.csv`;
            let xls = `${filenameArr[0]}.xls`;

            // assume file process is ok
            response[body[key].filename] = 'ok';
            if (!video_types.includes(path.extname(file).toLowerCase())) {
                continue;
            }
            let run;
            if (fs.existsSync(gpx)) {
                run = await exec(`conda run python /home/ec2-user/processing/process.py -F ${file} -G ${gpx} -R '${body[key].route}' -B ${body[key].batch} -T ${body[key].tracking}`);
            } else if (fs.existsSync(csv) || fs.existsSync(xls)) {
                run = await exec(`conda run python /home/ec2-user/processing/process.py -F  ${file} -SH ${fs.existsSync(csv) ? csv : xls} -R '${body[key].route}' -B ${body[key].batch} -T ${body[key].tracking}`);
            } else {
                run = await exec(`conda run python /home/ec2-user/processing/process.py -F ${file} -R '${body[key].route}' -B ${body[key].batch} -T ${body[key].tracking}`);
            }
            if (run.stderr.includes("ERROR ENCOUNTERED")) {
                response[body[key].filename] = 'failed';
            }
            console.log(run) // for logging
        }
    }
    execution().then(() => {
        res.send(response);
    })
});


router.post('/chunk', function (req, res) {
    let uploadState = 'uploading';

    const busboy = req.busboy;

    const headers = req.headers;

    const route = headers['x-route'];
    const batch = headers['x-batch'];
    const checksum = headers['x-file-checksum'];
    const fileName = req.headers['x-file-name'];
    const chunkStart = parseInt(req.headers['x-chunk-start'], 10);
    const chunkSize = parseInt(req.headers['x-chunk-size'], 10);
    const fileSize = parseInt(req.headers['x-file-size'], 10);
    const tracking = parseInt(req.headers['x-tracking'], 10);

    const filePath = path.join(uploadPath, fileName);

    console.log('Starting upload session with headers: ', {
        fileName: fileName,
        route: route,
        batch: batch,
        checksum: checksum,
        chunkStart: chunkStart,
        chunkSize: chunkSize,
        fileSize: fileSize,
        tracking: tracking
    })

    if (fileSize == chunkStart) {
        uploadState = 'uploaded';
        res.send({ status: 1 });
    }

    req.pipe(busboy);

    busboy.on("file", (fieldname, file, filename) => {
        let fstream;
        if (chunkStart) {
            fs.truncateSync(filePath, chunkStart);
            fstream = fs.createWriteStream(filePath, {
                flags: "r+",
                start: chunkStart
            });
        } else {
            fstream = fs.createWriteStream(filePath, {
                flags: "w"
            });
        }

        file.pipe(fstream);

        file.on("error", (e) => { console.log(e) });
        file.on("limit", (e) => { console.log(e) });

        fstream.on("close", () => {
            console.log(" - Chunk finished.");
        });
    });

    busboy.on("finish", function (a) {
        state = 'uploaded';
        let currFileSize = fs.statSync(filePath).size;

        fs.open(filePath, 'r', function (errOpen, fd) {
            if (errOpen) {
                throw errOpen;
            }
            fs.read(fd, Buffer.alloc(chunkSize), 0, chunkSize, currFileSize - chunkSize, function (errRead, bytesRead, buffer) {
                console.log('Validating checksum...');
                let resChecksum = generateChecksum(buffer);
                console.log('Upload session finished (busboy): ', {
                    fileName: fileName,
                    route: route,
                    batch: batch,
                    checksum: checksum,
                    chunkStart: chunkStart,
                    chunkSize: chunkSize,
                    currentSize: fs.statSync(filePath).size,
                    tracking: tracking,
                    'File integrity?': `${resChecksum} == ${checksum} - ${resChecksum == checksum}`
                });
                if (resChecksum == checksum) {
                    res.send({ status: 1 })
                } else {
                    res.send({ status: 0 })
                }
            })
        })
    });
    busboy.on("error", function (a) {
        return res.send({ status: 0 });
    });
})

// router.post('/', function(req, res) {
//     let busboy = req.busboy;
//     let body = req.body;
//     state = 'uploading'
//     let xFileName = req.headers['x-file-name'];
//     let xStartByte = parseInt(req.headers['x-start-byte'], 10);
//     let xFileSize = parseInt(req.headers['x-file-size'], 10);
//     let xTracking = parseInt(req.headers['x-tracking'], 10);

//     let xFilePath = path.join(uploadPath, xFileName);



//     console.log('starting upload session with headers:', xFileName, xStartByte, xFileSize);

//     req.socket.on('close', () => {
//         let fileStat = fs.statSync(filePath)
//         let fileSize = fileStat.size;
//         console.log('session ended for', xFileName, fileSize, xFileSize, xTracking, state);
//         if (state == 'uploaded') {
//             tracking_update(xFileName, xTracking, 'Uploaded')
//         }
//     });

//     if (xFileSize <= xStartByte) {
//         state = 'uploaded'
//         return res.send("File already uploaded");
//     }

//     req.pipe(busboy);

//     busboy.on("file", (fieldname, file, filename) => {
//         let filePath = path.join(uploadPath, filename);
//         let fstream;
//         if (xStartByte) {
//             fstream = fs.createWriteStream(filePath, {
//                 flags: "a"
//             });
//         } else {
//             fstream = fs.createWriteStream(filePath, {
//                 flags: "w"
//             });
//         }
//         file.pipe(fstream);

//         file.on("error", (e) => {console.log(e)});
//         file.on("limit", (e) => {console.log(e)});

//         fstream.on("close", () => {
//             console.log("finished");
//         });
//     });

//     busboy.on("finish", function(a) {
//         state = 'uploaded'
//         console.log('session ended 2');
//         return res.send("ok");
//     });
//     busboy.on("error", function(a) {
//         return res.send("error");
//     });
// });

module.exports = router;