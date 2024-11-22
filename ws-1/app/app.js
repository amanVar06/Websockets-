const socket = new WebSocket("ws://localhost:3000")


function sendMessage(e) {
    e.preventDefault();
    const input = document.querySelector('input')
    if(input.value) {
        socket.send(input.value)
        input.value = ""
    }
    input.focus()
}

document.querySelector('form')
    .addEventListener('submit', sendMessage);

// listen for message

socket.addEventListener("message", ({ data }) => {
    console.log("Message from server: ", data)
    const li = document.createElement('li')
    li.textContent = data
    document.querySelector('ul').appendChild(li)
})