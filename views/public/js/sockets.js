const socket = io('http://localhost:5000')

socket.on("connect", () => {
    socket.send("Hello!")
});

socket.on('custome_event', (msg) => {
    console.log("out io", msg)
})
