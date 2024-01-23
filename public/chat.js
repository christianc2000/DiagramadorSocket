const socket = io();

// DOM elements
let message = document.getElementById('message');
let username = document.getElementById('username');
let btn = document.getElementById('send');
let output = document.getElementById('output');
let actions = document.getElementById('actions');

btn.addEventListener('click', function () {
    socket.emit('chat:message', {
        username: username.value,
        message: message.value
    });
    message.value = ''; // Limpia el campo de mensaje después de enviarlo
});

// Escucha eventos de chat:message y muestra el mensaje en el DOM
socket.on('chat:message', function (data) {
    actions.innerHTML = '';
    output.innerHTML += `<p><strong>${data.username}:</strong> ${data.message}</p>`;
});

// Puedes agregar eventos adicionales para manejar acciones o mensajes de usuario aquí
message.addEventListener('keypress', function () {
    socket.emit('chat:typing', username.value);
});

socket.on('chat:typing', function (data) {
    actions.innerHTML = `<p><em>${data} está escribiendo un mensaje.</em></p>`
});
