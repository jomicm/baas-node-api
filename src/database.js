const mongoose = require('mongoose');

mongoose.connect('mongodb://mongo/notes-db-app', {
    useCreateIndex:true,
    useNewUrlParser:true,
    useFindAndModify:false
})
.then(db => console.log('DB is connected!'))
.catch(error => console.log(error));