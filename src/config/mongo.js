const _ = require('lodash');
const mongo = require('mongodb');
const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');
const messages = require('../helpers/messages');
const jwt = require('jsonwebtoken');

const { encryptPassword, matchPassword } = require('../helpers/encryption');
const connString = 'mongodb://localhost';
// const connString = 'mongodb://mongo:27017';
const client = new MongoClient(connString, { useNewUrlParser: true });

// Initializating
exports.initializate = async () => {
    await client.connect();
}

// Mongo Methods
exports.postMethod = async reqInfo => {
    let hrstart = process.hrtime();
    const { dbName, colName, obj, isEncryption = false } = reqInfo;
    if (isEncryption) {
        const passwordEncrypted = await encryptPassword(obj.password || '');
        obj.password = passwordEncrypted;
    }
    try {
        let r = obj.length === undefined ?
            await client.db(dbName).collection(colName).insertOne(obj) :
            await client.db(dbName).collection(colName).insertMany(obj);
        assert.equal(obj.length == undefined ? 1 : obj.length, r.insertedCount);
        let hrend = process.hrtime(hrstart);
        return messages.generateReply('success', 200, 'POST', dbName, colName, r.insertedCount, hrend, '', r.ops);
    } catch (error) {
        let hrend = process.hrtime(hrstart);
        return messages.generateReply('error', 400, 'POST', dbName, colName, 0, hrend, error.message, null);
    }
}

// Custom Method to validate user
exports.postGetUserValidated = async reqInfo => {
    let hrstart = process.hrtime();
    const { dbName, colName, obj, res } = reqInfo;
    try {
        const { user, password } = obj;
        let hrend = process.hrtime(hrstart);
        if (!user || !password) {
            return messages.generateReply('error', 400, 'POST', dbName, colName, 0, hrend, 'User or Password are not present', null);
        }
        let r = await client.db(dbName).collection(colName).find({email: user}).toArray();
        if (!r || !r.length) {
            return messages.generateReply('error', 400, 'POST', dbName, colName, 0, hrend, 'User does not exist', null);
        }
        const matchPwd = await matchPassword(password, r[0].password);
        if (!matchPwd) {
            return messages.generateReply('error', 403, 'POST', dbName, colName, 0, hrend, 'Access does not allowed', null);
        }
        console.log(r)
        const { name, lastName, email, _id: id, fileExt = '' } = r[0];
        const accessToken = await jwt.sign({ id: id, type:'user', email, name, lastName }, res.locals.JWT_KEY, { expiresIn: '100d' });
        const response = { id, fileExt, name, lastName, email, accessToken };
        return messages.generateReply('success', 200, 'GET', reqInfo.dbName, reqInfo.colName, r.length, hrend, '', response, reqInfo.query, reqInfo.fields, reqInfo.sort, reqInfo.skip, reqInfo.limit);
    } catch (error) {
        let hrend = process.hrtime(hrstart);
        return messages.generateReply('error', 400, 'POST', dbName, colName, 0, hrend, error.message, null);
    }
}

exports.updateMethod = async reqInfo => {
    let hrstart = process.hrtime();
    const { dbName, colName, obj, id } = reqInfo;
    try {
        const o_id = new mongo.ObjectId(id);
        let r0 = await client.db(dbName).collection(colName).findOne({ '_id': o_id });
        const { password } = r0;
        const objSecure = { ...obj, ...(password ? { password } : {}) };
        let r = await client.db(dbName).collection(colName).findOneAndUpdate({ '_id': o_id }, { $set: objSecure });
        let hrend = process.hrtime(hrstart);
        return messages.generateReply('success', 200, 'UPDATE', dbName, colName, r.value ? 1 : 0, hrend, '', r);
    } catch (error) {
        let hrend = process.hrtime(hrstart);
        return messages.generateReply('error', 400, 'UPDATE', dbName, colName, 0, hrend, error.message, null);
    }
}

exports.getMethod = async reqInfo => {
    let hrstart = process.hrtime();
    try {
        reqInfo = clearParams(reqInfo);
        let r = await client.db(reqInfo.dbName).collection(reqInfo.colName).find(reqInfo.query).skip(reqInfo.skip).limit(reqInfo.limit).sort(reqInfo.sort).project(reqInfo.fields).toArray();
        let hrend = process.hrtime(hrstart);
        return messages.generateReply('success', 200, 'GET', reqInfo.dbName, reqInfo.colName, r.length, hrend, '', r, reqInfo.query, reqInfo.fields, reqInfo.sort, reqInfo.skip, reqInfo.limit);
    } catch (error) {
        let hrend = process.hrtime(hrstart);
        return messages.generateReply('error', 400, 'GET', reqInfo.dbName, reqInfo.colName, 0, hrend, error.message, null);
    }
}

exports.getCountMethod = async reqInfo => {
    let hrstart = process.hrtime();
    try {
        reqInfo = clearParams(reqInfo);
        const count = await client.db(reqInfo.dbName).collection(reqInfo.colName).find(reqInfo.query).count();
        let hrend = process.hrtime(hrstart);
        return messages.generateReply('success', 200, 'GET', reqInfo.dbName, reqInfo.colName, count, hrend, '', { count }, reqInfo.query, reqInfo.fields, reqInfo.sort, reqInfo.skip, reqInfo.limit);
    } catch (error) {
        let hrend = process.hrtime(hrstart);
        return messages.generateReply('error', 400, 'GET', reqInfo.dbName, reqInfo.colName, 0, hrend, error.message, null);
    }
}

exports.getSingleMethod = async reqInfo => {
    let hrstart = process.hrtime();
    try {
        const o_id = new mongo.ObjectId(reqInfo.id);
        let r = await client.db(reqInfo.dbName).collection(reqInfo.colName).findOne({ '_id': o_id });
        let hrend = process.hrtime(hrstart);
        return messages.generateReply('success', 200, 'GET_SINGLE', reqInfo.dbName, reqInfo.colName, r ? 1 : 0, hrend, '', r);
    } catch (error) {
        let hrend = process.hrtime(hrstart);
        return messages.generateReply('error', 400, 'GET_SINGLE', reqInfo.dbName, reqInfo.colName, 0, hrend, error.message, null);
    }
}

exports.deleteMethod = async reqInfo => {
    let hrstart = process.hrtime();
    try {
        const o_id = new mongo.ObjectId(reqInfo.id);
        let r = await client.db(reqInfo.dbName).collection(reqInfo.colName).findOneAndDelete({ '_id': o_id });
        let hrend = process.hrtime(hrstart);
        return messages.generateReply('success', 200, 'DELETE', reqInfo.dbName, reqInfo.colName, r.value ? 1 : 0, hrend, '', r);
    } catch (error) {
        let hrend = process.hrtime(hrstart);
        return messages.generateReply('error', 400, 'DELETE', reqInfo.dbName, reqInfo.colName, 1, hrend, error.message, null);
    }
}

// Toolkit area
exports.toolkitIsDB = async reqInfo => {
    const admDB = client.db('test').admin();
    const dbs = await admDB.listDatabases();
    console.log(dbs.databases);
    return dbs.databases.map(c => c.name).includes(reqInfo.dbName);
}

exports.toolkitIsCollection = async reqInfo => {
    const collections = await client.db(reqInfo.dbName).collections();
    return collections.map(c => c.s.name).includes(reqInfo.colName);
}

exports.post2DB = (dbName, colName, obj) => {
    client.connect().then(() => {
        const db = dbName;
        const r = client.db(dbName).collection(colName).insertOne(obj)
            .then(() => {
                console.log('Inserted Corretly');
                return 'Inserted Corretly';
            })
            .catch(err => err.stack);
    }).
        catch(err => err.stack);
}

exports.hello = (dbName, colName, obj) => {
    console.log(`DataBase: ${dbName} Collection: ${colName} Obj: ${obj}`);
}

clearParams = reqInfo => {
    reqInfo.limit = Number.isInteger(parseInt(reqInfo.limit)) != NaN ? parseInt(reqInfo.limit) : 0;
    reqInfo.skip = Number.isInteger(parseInt(reqInfo.skip)) != NaN ? parseInt(reqInfo.skip) : 0;
    reqInfo.sort = isJSON(reqInfo.sort) ? JSON.parse(reqInfo.sort) : {};
    // reqInfo.fields = isJSON(reqInfo.fields) ? JSON.parse(reqInfo.fields) : {};
    // reqInfo.query = isJSON(reqInfo.query) ? JSON.parse(reqInfo.query) : {};
    console.log('reqInfo.query:11111\n', reqInfo.query)
    // const a = (JSON.stringify(reqInfo.query)).replace(/(?:\\[rn])+/g, '').replace(/\'/g, '"');
    // const a = (JSON.stringify(reqInfo.query)).replace(/(?:\\[rn])+/g, '').replace(/\'/g, '"');
    // console.log('reqInfo.query:33333\n', a)
    // const b = JSON.parse(a);
    // console.log('reqInfo.query:4444\n', typeof b)
    // console.log('reqInfo.query:><<<>\n', isJSON(reqInfo.query))
    // console.log('reqInfo.query:><<<>Str\n', testJSON(reqInfo.query))
    // reqInfo.query = isJSON(reqInfo.query) ? reqInfo.query : testJSON(reqInfo.query);
    reqInfo.query = sanitizeObject(reqInfo.query);
    reqInfo.fields = sanitizeObject(reqInfo.fields);
    return reqInfo;
}
const sanitizeObject = (obj) => {
    if (!obj) return {};
    if (_.isObject(obj)) return obj;
    try {
        const objJS = JSON.parse(obj);
        return _.isObject(objJS) ? objJS : {};
    } catch (ex) {
        return {};
    }
};
const testJSON = (str) => {
    console.log('str:\n', str)
    try {
        const res = JSON.parse(str);
        return res;
    } catch(e) {
        return {};
    }
};

isJSON = testString => {
    try {
        let o = JSON.parse(testString);
        if (o && typeof o === "object") {
            return true;
        } else {
            return false;
        }
    }
    catch (e) {
        return false;
    }
}