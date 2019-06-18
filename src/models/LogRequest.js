const mongoose = require('mongoose');
const {Schema} = mongoose;

const LogRequestSchema = new Schema({
    method: {type:String, required:true},
    url: {type:String, required:true},
    ip: {type:String, required:true},
    status: {type:String, required:true},
    message: {type: String, required:true},
    responseTime: {type: String, required:true},
    dataSent: {type: String, required:true},
    userType: {type: String, required:true},
    user: {type: String, required:true},
});

module.exports = mongoose.model('LogRequest', LogRequestSchema);