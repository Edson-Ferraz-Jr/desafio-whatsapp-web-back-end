const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const config = require('dotenv').config;


config();


const app = express();
const server = http.createServer(app);
const io = socketIo(server);


let users = [];

let groupMembers = {
    grupo1: [],
    grupo2: [],
    grupo3: [],
    grupo4: []
};

const messages = {
    grupo1: [],
    grupo2: [],
    grupo3: [],
    grupo4: []
};


io.on("connection", (socket) => {     
    socket.on("join app", (username) => {
        socket.data.username = username;

        const user = { id: socket.id, username: username };

        users.push(user);
        
        io.emit("update users", users);
    });

    
    socket.on("join room", (roomName, callback) => {
        socket.join(roomName);

        callback(messages[roomName]);

        const member = { id: socket.id, username: socket.data.username };
        
        groupMembers[roomName].push(member);

        io.to(roomName).emit("update groups members", roomName, groupMembers[roomName]);
    });


    socket.on("send message", ({ sender, to, content, chatName, isGroup }) => {
        if(isGroup) {
            const payload = {
                sender,
                content,
                chatName,
                senderId: socket.id
            };

            socket.to(to).emit("new message", payload);
        } else {
            const payload = {
                sender,
                content,
                chatName: sender,
                senderId: socket.id
            };

            socket.to(to).emit("new message", payload);
        }

        if(messages[chatName]) {
            messages[chatName].push({
                sender,
                content
            });
        }
    });

    
    socket.on("disconnecting", () => {
        for(const room of socket.rooms) {
            if(groupMembers[room]) {
                groupMembers[room] = groupMembers[room].filter(member => member.id !== socket.id);

                io.to(room).emit("update groups members", room, groupMembers[room]);
            }
        }
    });
    

    socket.on("disconnect", () => {
        users = users.filter(user => user.id !== socket.id);

        io.emit("update users", users);
    });
});


const port = process.env.PORT || 4000;

server.listen(port)
