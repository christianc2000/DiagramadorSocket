const express = require("express")
const app = express();
const server = require("http").createServer(app);

const io = require('socket.io')(server, {
    cors: { origin: "*" }
});

server.listen(3000, () => {
    console.log("Server is running");
})
let usuariosConectados = {};
io.on('connection', (socket) => {
    console.log('Un cliente se ha conectado al servidor socket');
    // Unirse a un canal
    socket.on('unirse', (data) => {
        const canal = data.canal;
        const userId = data.userId;
        console.log("el usuario con id: " + userId + " está tratando de unirse al " + canal);
        // Si el canal no existe en usuariosConectados, inicialízalo
        if (!usuariosConectados[canal]) {
            usuariosConectados[canal] = new Set();
            io.emit('sesionActiva', canal);
        }

        // Si el usuario no está en el canal, añádelo
        if (!usuariosConectados[canal].has(userId)) {
            usuariosConectados[canal].add(userId);
            socket.join(canal);
            console.log(`El usuario con ID ${userId} se unió al canal: ${canal}`);
        } else {
            console.log(`El usuario con ID ${userId} ya está en el canal: ${canal}`);
        }

        // Muestra la cantidad de usuarios conectados al canal
        console.log(`Hay ${usuariosConectados[canal].size} usuario(s) conectado(s) al canal: ${canal}`);

        // Enviar una respuesta al cliente
        io.emit('usuariosConectados', {
            usuarios: Array.from(usuariosConectados[canal]),
            canal: canal
        });
    });

    // Dejar un canal
    socket.on('dejar', (data) => {
        const canal = data.canal;
        const userId = data.userId;

        // Si el usuario está en el canal, elimínalo
        if (usuariosConectados[canal] && usuariosConectados[canal].has(userId)) {
            usuariosConectados[canal].delete(userId);
            socket.leave(canal);
            console.log(`El usuario con ID ${userId} dejó el canal: ${canal}`);
        } else {
            console.log(`El usuario con ID ${userId} no está en el canal: ${canal}`);
        }

        // Si el canal está vacío, elimínalo de usuariosConectados
        if (usuariosConectados[canal] && usuariosConectados[canal].size === 0) {
            delete usuariosConectados[canal];
            console.log(`El canal ${canal} no tiene usuarios conectados y ha sido eliminado.`);
        }

        // Enviar una respuesta al cliente
        io.emit('usuariosConectados', {
            usuarios: usuariosConectados[canal] ? Array.from(usuariosConectados[canal]) : [],
            canal: canal
        });
    });


    // Cerrar canal
    socket.on('cerrarCanal', (canal) => {
        console.log(canal);
        // Obtener todos los sockets en el canal
        var sockets = io.sockets.adapter.rooms.get(canal);
        console.log(sockets);
        // Si hay sockets en el canal
        if (sockets) {
            // Para cada socket en el canal
            sockets.forEach((socketId) => {
                console.log("desconectado socket...")
                // Obtener el socket
                let socket = io.sockets.sockets.get(socketId);
                // Si el socket existe
                if (socket) {
                    console.log(socketId, " deja el canal");
                    // Hacer que el socket deje el canal
                    socket.leave(canal);
                    // Desconectar el socket
                    // socket.disconnect(true);
                }
            });
        }
        console.log(`Todos los usuarios se han desconectado del canal ${canal}.`);
        // Limpiar los usuarios conectados al canal
        if (usuariosConectados[canal]) {
            usuariosConectados[canal].clear();
        }
        console.log("usuarion conectados ", usuariosConectados[canal] ? usuariosConectados[canal].size : 0);
        io.emit('canalCerrado', {
            usuarios: usuariosConectados[canal] ? Array.from(usuariosConectados[canal]) : [],
            canal: canal
        });
        console.log("se emite el cerrado");
    });

    socket.on('moverDiagrama', (data) => {
        var diagrama = data.diagrama;
        var canal = data.canal;
        console.log("Diagrama recibido: ", diagrama);
        console.log("canal a enviar: ", canal);
        // Verificar si el canal existe en usuariosConectados
        if (usuariosConectados[canal]) {
            console.log("tiene usuarios conectados")
            var sockets = io.sockets.adapter.rooms.get(canal);
            console.log(sockets);
            // Enviar el diagrama a todos los usuarios en el canal, excepto al que emitió el evento
            socket.broadcast.to(canal).emit('moverDiagrama', { canal: canal, diagrama: diagrama });
        } else {
            console.log("no tiene usuarios conectados");
        }
    });

    // Enviar y recibir mensajes en un canal
    socket.on('enviarMensaje', (data) => {
        io.to(data.canal).emit('recibirMensaje', data.mensaje);
    });
});
