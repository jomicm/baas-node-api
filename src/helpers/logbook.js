const router = require('express').Router();

const mongoMgt = require('../config/mongo');

const apilvl = 'v1';

router.post(`/api/${apilvl}/:dbname/logbook`, async(req, res) => {
  const {dbname, collection} = req.params;
  const reqInfo = {dbName:dbname, colName:collection};

  const response = await mongoMgt.postMethod(reqInfo);
  res.status(response.request.code).send(response);
});