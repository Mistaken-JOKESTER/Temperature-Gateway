require('dotenv').config()
const server_4g = require("./server/server_4g.js");
const wifiServer = require("./server/server_wifi.js");
const {appServer} = require('./app');

//server for user
appServer.listen(5000, () => {
    console.log("APP Pakcets on 3000")
})

// //server for 4g packet
// server_4g.listen(3000, () => {
//     console.log("4G Pakcets on 3000")
// })

// //server for wifi packets
// wifiServer.listen(8000, () => {
//     console.log("Wifif Pakcets on 8000")
// })