const mongoMgt = require('../config/mongo');
const { nonRecordableCollections } = require('./constants');

module.exports = (req, res, next) => {
  try {
    const colName = 'logBook';
    const date = new Date();
    const {dbname, collection} = req.params;

    if(nonRecordableCollections.includes(collection)){
      return next()
    }

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

    return next();
  } catch (error) {
      return res.status(500).send({ errorMessage: error.message});
  }
}

const postData = async(data) => {
  const value = await  mongoMgt.postMethod(data);

  return value;
};


