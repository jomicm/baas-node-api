module.exports = (req, res, next) => {
    try {
        Object.assign(req, {start: new Date, hrtimestart : process.hrtime()});
        next();
    } catch (error) {
        return res.status(500).send({ errorMessage: error.message});
    }
}