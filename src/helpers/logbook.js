const router = require('express').Router();
const messages = require('./messages');
const mongoMgt = require('../config/mongo');

const apilvl = 'v1';

module.exports = (req, res, next) => {
  try {
    const colName = 'logBook';
    const date = new Date();
    const {dbname, collection} = req.params;
    const object = {
      who: req.tokenUser,
      when: date,
      method: req.method,
      collection: collection,
      payload: req.body
    }

    const reqInfo = {
      dbName:dbname,
      colName: colName,
      obj: object,
    };


    const response = postData(reqInfo);
    console.log(response);

    next();

  } catch (error) {
      return res.status(500).send({ errorMessage: error.message});
  }
}

async function postData(data){
  const value = await  mongoMgt.postMethod(data);

  return value;
} 


