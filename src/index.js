const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const exphbs = require('express-handlebars');
const methodOverride = require('method-override');
const session = require('express-session')
const flash = require('connect-flash');
const passport = require('passport');
const morgan = require('morgan');
const mongoMgt = require('./config/mongo');
const logRequests = require('./helpers/logRequests');


// Initializations
const app = express();
require('./database');
require('./config/passport');
mongoMgt.initializate();

// Settings
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.engine('.hbs', exphbs({
    defaultLayout:'main',
    layoutsDir: path.join(app.get('views'),'layouts'),
    partialsDir: path.join(app.get('views'),'partials'),
    extname:'.hbs'
}));
app.set('view engine', '.hbs');

// Middlewares
app.use(express.urlencoded({extended:false}));
app.use(express.json());
app.use(methodOverride('_method'));
app.use(session({
    secret:'mysecretapp',
    resave:true,
    saveUninitialized:true
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
app.use('/uploads', express.static('uploads'));
app.use(morgan('dev'));
/*
app.use(morgan('common', () => {
    console.log('From Morgan Common!');
})); */

// Global Variables
app.use((req, res, next) => {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');
    res.locals.user = req.user || null;
    res.locals.JWT_KEY = 'this is my key';
    res.on('finish', () => logRequests(req, res));
    next();
});

// Routes
app.use(require('./routes/index'));
app.use(require('./routes/notes'));
app.use(require('./routes/users'));
app.use(require('./routes/api'));
// Route Not Found route
app.use((req, res, next) => {
    req.hrtimestart = process.hrtime();
    const error = new Error('Not Found');
    error.status = 404;
    next(error);
});
// Route all errors in api
app.use((error, req, res, next) => {
    res.status(error.status || 500);
    res.json({
        "platform" : {
            "type" : "api",
            "version" : "v1",
            "resource" : req.path
        },
        "request" : {
            "status" : "error",
            "code" : error.status || 500,
            "errormessage" : error.message,
            "method" : req.method,
            "query" : {},
            "fields" : {},
            "sort" : {},
            "skip" : 0,
            "limit" : 0,
            "total" : 0
        },
        "response" : null
    });
});

// Static Fields
app.use(express.static(path.join(__dirname,'public')));

// Server StartUp
app.listen(app.get('port'), () => {
    console.log(`Server is Listening to on port: ${app.get('port')}`);
});
