const session = require('express-session');
const genuuid = require('./sessionUUID')
const MongoDBStore = require('connect-mongodb-session')(session);

var store = new MongoDBStore({
    uri: process.env.MONGO_URL,
    collection: 'mySessions'
  });

  // Catch errors
store.on('error', function(error) {
    console.log(error);
  });

//Session Setup
const sessionConfig= ({
    genid: function(req){
        return genuuid()
    },
    name:'sid',
    store: store,
    resave:false,
    secret: process.env.SESSION_SECRETE,
    resave: false,
    saveUninitialized: true,
    rolling:true,
    resave:false,
    cookie: { 
        httpOnly: true,
        // secure: true,  //Turn it on in Production
        maxAge: 1000 * 60 * 60 * 2,
        sameSite:true
    }
})

module.exports = sessionConfig