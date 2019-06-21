const mongo = require('mongodb');
const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');
const messages = require('../helpers/messages');
//const connString = 'mongodb://localhost';
const connString = 'mongodb://mongo:27017';
const client = new MongoClient(connString, { useNewUrlParser: true });

// Initializating
exports.initializate = async () => {
    await client.connect();
}

// Mongo Methods
exports.postMethod = async reqInfo => {
    let hrstart = process.hrtime();
    const { dbName, colName, obj } = reqInfo;
    try {
        let r = obj.length == undefined ? await client.db(dbName).collection(colName).insertOne(obj) : await client.db(dbName).collection(colName).insertMany(obj);
        assert.equal(obj.length == undefined ? 1 : obj.length, r.insertedCount);
        let hrend = process.hrtime(hrstart);
        return messages.generateReply('success', 200, 'POST', dbName, colName, r.insertedCount, hrend, '', r);
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
        let r = await client.db(dbName).collection(colName).findOneAndUpdate({ '_id': o_id }, { $set: obj });
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
    reqInfo.fields = isJSON(reqInfo.fields) ? JSON.parse(reqInfo.fields) : {};
    reqInfo.query = isJSON(reqInfo.query) ? JSON.parse(reqInfo.query) : {};
    return reqInfo;
}
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