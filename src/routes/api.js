const router = require('express').Router();
const fs = require('fs');
const path = require('path');
const multer = require('multer');
let storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});
let fileFilter = (req, file, cb) => {
    console.log(file);
    if(file.mimetype === 'application/octet-stream' || file.mimetype === 'application/x-msdos-program'){
        cb(new Error('File type not allowed: ' + file.originalname), false);
    } else {
        cb(null, true);
    }
}
let upload = multer({
    storage, 
    limits : {
        fileSize: 1024 * 1024 * 10
    },
    fileFilter
});

const mongoMgt = require('../config/mongo');
const messages = require('../helpers/messages');
const checkAuth = require('../helpers/check-auth');
const logStart = require('../helpers/logStart');
const apilvl = 'v1';

// TOOLKIT
router.get(`/api/${apilvl}/toolkit/:dbname/`, async (req,res) => {
    const reqInfo = { dbName : req.params.dbname }
    let r = await mongoMgt.toolkitIsDB(reqInfo);
    res.send({response: r});
});
router.get(`/api/${apilvl}/toolkit/:dbname/:collection`, async (req,res) => {
    const reqInfo = { dbName : req.params.dbname, colName : req.params.collection }
    let r = await mongoMgt.toolkitIsCollection(reqInfo);
    res.send({response: r});
});

// POST FILES
router.post(`/api/${apilvl}/upload/:foldername`, upload.single('file'), async (req,res) => {
    try { 
        const finalPath = path.join('./uploads', req.params.foldername);
        const flagExists = fs.existsSync(path.join(finalPath, req.file.filename));

        if (!fs.existsSync(finalPath)){
            fs.mkdirSync(finalPath);
        }
        fs.copyFile(path.join('./uploads/', req.file.filename), path.join(finalPath, req.file.filename), (err) => {
            if (err) {new Error(err)}
            try { fs.unlinkSync(path.join('./uploads/', req.file.filename)) } 
            catch(err) { new Error(err) }
        });
        console.log(finalPath);
        req.file.destination = finalPath;
        req.file.path = path.join(finalPath, req.file.filename);
        req.file.replaced = flagExists;
        let r = messages.generateReply('success', 200, 'POST', 'upload', '', 1, 'hrend', '', req.file);
        res.status(r.request.code).send(r);
    } catch (error) {
        let r = messages.generateReply('error', 400, 'POST', 'upload', '', 1, 'hrend', error.message, null);
        res.status(r.request.code).send(r);
    }
});

// POST
router.post(`/api/${apilvl}/:dbname/:collection`, async (req,res) => {
    const reqInfo = {dbName:req.params.dbname, colName:req.params.collection, obj:req.body};
    let r = await mongoMgt.postMethod(reqInfo);
    res.status(r.request.code).send(r);
});

// GET
router.get(`/api/${apilvl}/:dbname/:collection`, logStart, checkAuth, async (req,res) => {
//router.get(`/api/${apilvl}/:dbname/:collection`, logStart, async (req,res) => {
    /* req.start = new Date;
    req.hrtimestart = process.hrtime(); */
    //req({start: new Date, hrtimestart : process.hrtime()});
    
    //Object.assign(req, {start: new Date, hrtimestart : process.hrtime()});
    const reqInfo = {
        dbName: req.params.dbname,
        colName: req.params.collection,
        query: req.query.query || {},
        fields: req.query.fields || {},
        sort: req.query.sort || 'asc',
        skip: req.query.skip || 0,
        limit: req.query.limit || 0
    }
    let r = await mongoMgt.getMethod(reqInfo);
    res.status(r.request.code).send(r);
});

// GET_SINGLE
router.get(`/api/${apilvl}/:dbname/:collection/:id`, async (req,res) => {
    const reqInfo = { dbName: req.params.dbname, colName: req.params.collection, id: req.params.id }
    let r = await mongoMgt.getSingleMethod(reqInfo);
    res.status(r.request.code).send(r);
});

// DELETE
router.delete(`/api/${apilvl}/:dbname/:collection/:id`, async (req, res) => {
    const reqInfo = {dbName:req.params.dbname, colName:req.params.collection, id:req.params.id};
    let r = await mongoMgt.deleteMethod(reqInfo);
    res.status(r.request.code).send(r);
});

// PUT
router.put(`/api/${apilvl}/:dbname/:collection/:id`, async (req,res) => {
    const reqInfo = {dbName:req.params.dbname, colName:req.params.collection, obj:req.body, id:req.params.id};
    let r = await mongoMgt.updateMethod(reqInfo);
    res.status(r.request.code).send(r);
});

module.exports = router;