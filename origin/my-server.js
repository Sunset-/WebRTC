// var express = require('express'),
//     app = express(),
//     server = require('http').createServer(app);

// server.listen(3008);



var https = require('https');
var ws = require('ws');
var fs = require('fs');
var keypath = process.cwd() + '/sunset_nopass.key'; //我把秘钥文件放在运行命令的目录下测试
var certpath = process.cwd() + '/sunset.crt'; //console.log(keypath);
//console.log(certpath);

var options = {
    key: fs.readFileSync(keypath),
    cert: fs.readFileSync(certpath),
    //passphrase:'1234'//如果秘钥文件有密码的话，用这个属性设置密码
};

var server = https.createServer(options, function (req, res) { //要是单纯的https连接的话就会返回这个东西
    res.writeHead(403); //403即可
    res.end("This is a WebSockets server!\n");
}).listen(3018);


var WebSocketServer = require('ws').Server,
    wss = new WebSocketServer({
        server: server
    });

var sockets = [];

// 有socket连入
wss.on('connection', function (socket) {
    console.log('connection');
    sockets.push(socket);
    // 转发收到的消息
    socket.on('message', function (message) {
        var json = JSON.parse(message);
        sockets.forEach(s => {
            if (s == socket) {
                return;
            }
            s.send(message);
        });
    });
    socket.on('close', function () {
        sockets.splice(sockets.indexOf(socket), 1);
        console.log('close');
    });
    socket.on('error', function () {
        sockets.splice(sockets.indexOf(socket), 1);
        console.log('error');
    });
});