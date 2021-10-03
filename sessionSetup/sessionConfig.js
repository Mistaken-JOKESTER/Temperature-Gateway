const session = require('express-session');
const genuuid = require('./sessionUUID')
const MySQLStore = require('express-mysql-session')(session)

const sessionStore = new MySQLStore({
  host     :process.env.DB_HOST,
  port     :process.env.DB_PORT,
  user     :process.env.DB_USER,
  password :process.env.DB_PASSWORD,
  database :process.env.DB_DATABASE,
  clearExpired: true,
checkExpirationInterval: 60 * 60 * 1000,
expiration:  60 * 60 * 1000,
createDatabaseTable: true,
endConnectionOnClose: true,
charset: 'utf8mb4_bin',
  schema: {
  tableName: 'sessions',
  columnNames: {
    session_id: 'sid',
    expires: 'expires',
    data: 'data'
  }
}
})

//Session Setup
const sessionConfig= ({
    genid: function(req){
        return genuuid()
    },
    name:'sid',
    store: sessionStore,
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