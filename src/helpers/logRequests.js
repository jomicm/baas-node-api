const LogRequest = require('../models/LogRequest');
module.exports = (req, res) => {
    const logInfo = {
        method : req.method,
        url : req.path,
        ip : req.ip,
        status : res.statusCode,
        message : res.statusMessage,
        responseTime : process.hrtime(req.hrtimestart)[0] + 's ' + (process.hrtime(req.hrtimestart)[1]/1e6).toFixed(3) + 'ms',
        dataSent : ((res.get('Content-Length')/1024) || 0) + 'Kb sent',
        userType : req.tokenType || "unknown",
        user: req.tokenUser || "unknown"
    }
    const newLogRequest = new LogRequest(logInfo);
    newLogRequest.save();
    console.info(`${logInfo.method} ${logInfo.path} ${logInfo.ip} ${logInfo.status} ${logInfo.message} > ${logInfo.elapsedtime}; ${logInfo.datasent} ${logInfo.userType} ${logInfo.user}`);
}