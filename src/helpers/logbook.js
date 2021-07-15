const mongoMgt = require('../config/mongo');
const { nonRecordableCollections } = require('./constants');

module.exports = (req, res, next) => {
  try {
    const colName = 'logBook';
    const {dbname, collection} = req.params;

    if(nonRecordableCollections.includes(collection)){
      return next()
    }
    
    const object = {
      collection: collection,
      method: req.method,
      payload: req.body,
      timestamp: new Date().toISOString(),
      userEmail: req.userData.email,
      userId: req.userData.id,
      userLastName: req.userData.lastName,
      userName: req.userData.name,
    }

    const reqInfo = {
      dbName: dbname,
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


