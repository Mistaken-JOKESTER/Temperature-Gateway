const net = require("net");
const fs = require('fs')
const path = require('path');
const parseData = require("../parser/parser_4g");

const server = net.createServer();

server.on('connection', (socket) => {
 
    var clientAddress = `Client IP : ${socket.remoteAddress}, Port: ${socket.remotePort}`;
    console.log(`Clinet coonected on 4g`);

    socket.on('data', (data) => {
        console.log()
        if(data[0].toString(16) + data[1].toString(16) == '545a'){
            console.log(`\t${clientAddress}: Data recieved`)

            let str = ''
            for (let i = 0; i < data.length; i++) {
                str += `0x${data[i].toString(16)} `
            }

            parseData(data, socket.remoteAddress, socket.remotePort)
        } else {
            console.log(`${clientAddress}: Invalid packet`)
        }
    })

    socket.on('close', () => {
        console.log(`*****************************\nconnection closed: ${clientAddress}\n*****************************\n`);
    })

    socket.on('error', (err) => {
        console.log(err)
        console.log(`Error occurred in ${clientAddress}: ${err.message}`);
    })
})

//http://ec2-13-126-103-205.ap-south-1.compute.amazonaws.com:5000/

module.exports = server