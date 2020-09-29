const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/notes-db-app', {
// mongoose.connect('mongodb://mongo:27017/assetsapi', {
    useCreateIndex:true,
    useNewUrlParser:true,
    useFindAndModify:false
})
.then(db => console.log('DB is connected now!'))
.catch(error => console.log('An error ocurred:', error));
