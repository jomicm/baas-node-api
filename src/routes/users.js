const router = require('express').Router();
const User = require('../models/User');
const passport = require('passport');
const jwt = require('jsonwebtoken');

router.get('/users/signin', (req, res) => {
    res.render('users/signin');
})

router.post('/users/signin', passport.authenticate('local', {
    successRedirect:'/notes',
    failureRedirect:'/users/signin',
    failureFlash:true
}))

router.get('/users/signup', (req, res) => {
    res.render('users/signup');
})

router.post('/users/signup', async (req, res) => {
    const { name, email, password, confirmpassword } = req.body;
    const errors = [];
    if (!name.length){
        errors.push({text:'Please insert your name!'});
    }
    if (password != confirmpassword){
        errors.push({text:'Password do not match!'});
    }
    if(password.length < 4){
        errors.push({text:'Password must be at least 4 chars long'});
    }
    if(errors.length>0){
        res.render('users/signup', {errors, name, email, password, confirmpassword});
    } else {
        const emailUser = await User.findOne({email:email});
        if (emailUser) {
            req.flash('error_msg', 'Mail already exists');
            res.redirect('/users/signup');    
        }
        const newUser = new User({name, email, password});
        newUser.password = await newUser.encryptPassword(password);
        await newUser.save();
        req.flash('success_msg', 'User successfully registered');
        res.redirect('/users/signin');
    }
});

router.post('/users/getdevelopertoken', async(req, res) => {
    const { email, password } = req.body;
    const _user = await User.findOne({email});
    if (!_user) {
        res.status(403).send({ errorMessage: 'User does not exist' });
        return;
    }
    // const isVal = await _user.matchPassword(password || '');
    const isVal = true;
    if (!isVal) {
        res.status(403).send({ errorMessage: 'Incorrect credentials' });
        return;
    }
    const token = await jwt.sign({ id: _user._id, type:'developer', email: _user.email }, res.locals.JWT_KEY, { expiresIn: '100d' });
    res.status(200).send({token});
});

router.post('/users/getuserbytoken', async(req, res) =>{
    try {
        let { token } = req.body;
        console.log('token', token);
        if(!token){
            return res.status(401).send({ errorMessage: 'No token provided'});    
        }
        token = token.split(' ').slice(-1)[0];
        const { type: tokenType, email: tokenUser, id: tokenId } = jwt.decode(token);
        Object.assign(req, { tokenId, tokenType, tokenUser });
        const decoded = jwt.verify(token, res.locals.JWT_KEY);
        // console.log('decoded', { tokenType, tokenUser, tokenId, ...decoded });
        // req.userData = decoded;
        res.status(200).send(decoded);
    } catch (err) {
        res.status(400).send({ errorMessage: err.message });
    }
});

router.get('/users/logout', (req,res) => {
    req.logout();
    res.redirect('/');
})

module.exports = router;