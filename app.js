require('dotenv').config()
const pool = require('./DatabaseFunctions/dbconnection.js');
const express = require('express')
const app = express()
const cors = require('cors');
const session = require('express-session')
const cookieParser = require('cookie-parser')
const sessionConfig = require('./sessionSetup/sessionConfig')
const flash = require('connect-flash')
const path = require('path')

const adminRouter = require('./router/router')

app.use(cors())
//Json parser for reading post request data
app.use(cookieParser())

app.use(session(sessionConfig))
app.use(flash())

//Json parser for reading post request data
app.use(express.json())
app.use(express.urlencoded({extended:false}))

app.set('trust proxy', 1) // trust first proxy
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '/views'));
app.use(express.static(__dirname + '/views/public'));

app.get('/', (req, res) => {
    try{
        const {logged_in} = req.session

        const error_msg = req.flash('error_msg')
        const success_msg = req.flash('success_msg')

        if (req.session.type == "admin" && req.session.logged_in) {
            return res.redirect('/dashboard')
        }

        pool.getConnection((err, connection) => {
            //checking if any errors
            if(err){
                console.log(err)
                error_msg.push({msg:'Failed to connect to services'})

                return res.render('Welcome',{
                    error_msg,
                    success_msg
                })
            }

            connection.release()
            res.render('welcome',{
                error_msg,
                success_msg,
                logged_in
            })

        })

    } catch(e) {
      if(env){
        console.log(e)
      }
      res.render('welcome', {
        error_msg:"Internal website error"
      })
    }
})

app.use('/', adminRouter)

//server for user
module.exports =  app.listen(5000, () => {
    console.log('listning on 5000')
})