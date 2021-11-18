// client.js
const net = require("net"); // import net
const readline = require("readline").createInterface({
    input: process.stdin,
    output: process.stdout
}); // this will be important later

const options = {
    port: 15691,
    host: '1.132.107.51'

};

let client = net.connect(options, () => {
    console.log("connected!");
});

function newProblem(){ 
    readline.question("Press any number to send and q to quit", (num) => {
        if (num == "q") {
            client.end()
        }


        const str = 'Server UTC time: 2024-11-18 04:41:00' 
        var buf = Buffer.from(str, 'utf8')
        console.log(buf)
        client.write(buf)
        client.end()
    })
}

client.on("data", data => {
    console.log(data.toString());
    newProblem();
});

client.on("end", () => {
    console.log("disconnected");
    readline.close();
})

console.log("enter q to quit");
newProblem()