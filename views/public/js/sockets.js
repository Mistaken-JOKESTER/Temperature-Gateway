const socket = io('http://3.105.116.226/')

socket.on("connect", () => {
    socket.send("Hello!")
});

socket.on('unstored_msg', (data) => {
    console.log("out io", data)
    document.getElementById('alert').innerHTML = `
            <div class="alert alert-primary alert-dismissible fade show" role="alert">
                <strong>SMS from</strong> ${data.from}, Response - ${data.response}. This sms failed to store in database.
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
    `
})

socket.on('stored_msg', (data) => {
    console.log("out io", data)
    document.getElementById('alert').innerHTML = `
            <div class="alert alert-primary alert-dismissible fade show" role="alert">
                <strong>SMS from</strong> ${data.from}, Response - ${data.response}
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
    `
})
