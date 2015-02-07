var express = require('express');
var routes = require('./routes');
var http = require('http');
var path = require('path');

var app = express();
app.use(express.static(path.join(__dirname, '/public')));

var httpServer = http.createServer(app).listen(13000);
var io = require('socket.io').listen(httpServer);

var socket_ids = [];

function registerUser(socket, nickname) {
    // socket_id와 nickname 테이블을 셋업
    socket.get('nickname', function (err, pre_nick) {
        if (pre_nick != undefined) delete socket_ids[pre_nick];
        socket_ids[nickname] = socket.id;
        socket.set('nickname', nickname, function () {
        });
    });
}

io.sockets.on('connection', function (socket) {
    console.log('connection', socket.id);
    socket.emit('new');

    socket.on('newSend', function (data) {
        registerUser(socket, data);
    });

    socket.on('btn', function (data) {
        socket_id = socket_ids['webPage'];
        if (socket_id != undefined) {
            io.sockets.socket(socket_id).emit('broadcast_msg', {msg: data});
        }// if
    });

    socket.on('disconnect', function () {
        socket.get('nickname', function (err, nickname) {
            if (nickname != undefined) {
                delete socket_ids[nickname];
                io.sockets.emit('userlist', {users: Object.keys(socket_ids)});

            }// if
        });
    });

    socket.on('send_msg', function (data) {
        socket.get('nickname', function (err, nickname) {

            data.msg = nickname + ' : ' + data.msg;
            if (data.to == 'ALL') socket.broadcast.emit('broadcast_msg', data); // 자신을 제외하고 다른 클라이언트에게 보냄
            else {
                socket_id = socket_ids[data.to];
                if (socket_id != undefined) {
                    io.sockets.socket(socket_id).emit('broadcast_msg', data);
                }// if
            }
            socket.emit('broadcast_msg_1', data);
        });
    });
});