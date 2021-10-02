require('dotenv').config()

const http = require('http')
const pool = require('./DatabaseFunctions/dbconnection.js');
const express = require('express')
const app = express()
const cors = require('cors');
const session = require('express-session')
const cookieParser = require('cookie-parser')
const sessionConfig = require('./sessionSetup/sessionConfig')
const flash = require('connect-flash')
const path = require('path')
const executeQuerySync = require('./DatabaseFunctions/executeDBquery')
const {
  Server
} = require("socket.io");

const adminRouter = require('./router/router')
const smsRouter = require('./router/smsRouter')

app.use(cors())
//Json parser for reading post request data
app.use(cookieParser())

app.use(session(sessionConfig))
app.use(flash())

//Json parser for reading post request data
app.use(express.json())
app.use(express.urlencoded({
  extended: false
}))

app.set('trust proxy', 1) // trust first proxy
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '/views'));
app.use(express.static(__dirname + '/views/public'));

app.get('/', (req, res) => {
  try {
    const {
      logged_in
    } = req.session

    const error_msg = req.flash('error_msg')
    const success_msg = req.flash('success_msg')

    if (req.session.type == "admin" && req.session.logged_in) {
      return res.redirect('/dashboard')
    }

    pool.getConnection((err, connection) => {
      //checking if any errors
      if (err) {
        console.log(err)
        error_msg.push({
          msg: 'Failed to connect to services'
        })

        return res.render('Welcome', {
          error_msg,
          success_msg
        })
      }

      connection.release()
      res.render('welcome', {
        error_msg,
        success_msg,
        logged_in
      })

    })

  } catch (e) {
    if (env) {
      console.log(e)
    }
    res.render('welcome', {
      error_msg: "Internal website error"
    })
  }
})

app.use('/', adminRouter)
app.use('/', smsRouter)

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5000",
    methods: ["GET", "POST"],
    path: '/admin/sensro_msg/notify'
  }
})

io.on('connection', (socket) => {
  console.log('a user connected');

  socket.on('disconnect', () => {
    console.log('user disconnected')
  })

  socket.on('msg_clinet', () => {
    console.log('msg from client')
  })

  io.on('custome_event', (msg) => {
    console.log("in io", msg)
  })
})


app.post('/sensro_msg/notify', async (req, res) => {
  try {
    const {to, from, body, sentTimestamp, messageId, userMsgRef} = req.body
    console.log(req.body)/* {
      to: '+61472881148',
      from: '+61477280939',
      body: 'Receive:Set Err\n*123123,001,123123#',
      sentTimestamp: '2021-10-03T00:07:23+10:00',
      messageId: 'QFRO3ApiA0010298537'
    } */
    res.send({status:1})
    
    const [response_data, response_error] = [1, null] //await executeQuerySync('CALL add_response(?,?,?,?);', [messageId, from, body, sentTimestamp.split('+')[0]])
    console.log(response_data, response_error)
    if(response_error){
      console.log("DB ERROR")
      io.emit('unstored_msg', {response: body, from:from})
    } else {
      io.emit('stored_msg', {response: body, from:from})
    }
    
  } catch (e) {
    console.log(e)
    res.send('error')
  }
})


//server for user
module.exports = {
  appServer: server
}