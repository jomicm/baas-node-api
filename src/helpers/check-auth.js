const jwt = require('jsonwebtoken');
module.exports = (req, res, next) => {
    try {
        return next();
        let token = req.headers.authorization;
        if(!token){
            return res.status(401).send({ errorMessage: 'No token provided'});    
        }
        token = token.split(' ').slice(-1)[0];
        const {type: tokenType, email: tokenUser, id: tokenId } = jwt.decode(token);
        Object.assign(req, { tokenId, tokenType, tokenUser });
        const decoded = jwt.verify(token, res.locals.JWT_KEY);
        req.userData = decoded;
        next();
    } catch (error) {
        return res.status(401).send({ errorMessage: 'Auth failed: ' + error.message});
    }
}