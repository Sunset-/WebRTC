var https = require('https');
var ws = require('ws');
var fs = require('fs');
var path = require('path');
var uuid = require('uuid');
var Random = require('./random.js');



var keypath = path.join(__dirname, './cert/sunset_nopass.key'); //我把秘钥文件放在运行命令的目录下测试
var certpath = path.join(__dirname, './cert/sunset.crt'); //console.log(keypath);
console.log(certpath);

var options = {
    key: fs.readFileSync(keypath),
    cert: fs.readFileSync(certpath),
    //passphrase:'1234'//如果秘钥文件有密码的话，用这个属性设置密码
};

var server = https.createServer(options, function (req, res) { //要是单纯的https连接的话就会返回这个东西
    res.writeHead(403); //403即可
    res.end("This is a WebSockets server!\n");
}).listen(3008);


var WebSocketServer = require('ws').Server,
    wss = new WebSocketServer({
        server: server
    });

var rooms = {};
var socketMap = {};


function closeSocket(removeSocketId) {
    delete socketMap[removeSocketId];
    Object.keys(rooms).forEach(roomId => {
        delete rooms[roomId][removeSocketId];
        Object.keys(rooms[roomId]).forEach(socketId => {
            sendMessage(socketId, {
                event: '__LOSE',
                from : removeSocketId
            })
        });
    });
}

function operateMeesage(socketId, message) {
    var json = null;
    try {
        json = JSON.parse(message);
    } catch (e) {}
    if (json == null) {
        console.log('sockent-message:' + message);
        return;
    }
    var event = json.event,
        data = json.data;
    //加入房间
    if (event == 'JOIN_ROOM') {
        console.log(`${socketId}加入房间${data}`);
        var room = rooms[data] || (rooms[data] = {});
        var otherSocketIds = Object.keys(room);
        room[socketId] = true;
        //向进入房间用户发送房间信息
        sendMessage(socketId, {
            event: 'JOINED_ROOM',
            data: {
                otherSocketIds: otherSocketIds
            }
        });
        //向房间其他用户发送新用户信息
        otherSocketIds.forEach(otherSocketId => {
            sendMessage(otherSocketId, {
                event: 'OTHER_JOINED_ROOM',
                from : socketId
            });
        })
    } else {
        var room = json.room;
        var to = json.to;
        if (to) {
            json.from = socketId;
            sendMessage(to, json);
        } else if (room) {
            Object.keys(rooms[room]).forEach(si => {
                if (socketId != si) {
                    sendMessage(si, json);
                }
            })
        }
    }
}

function sendMessage(socketId, data) {
    console.log(`向【${socketId}】发送消息:${JSON.stringify(data)}`);
    socketMap[socketId]&&socketMap[socketId].send(JSON.stringify(data));
}

// 有socket连入
wss.on('connection', function (socket) {
    var socketId = socket.socketId = Random.uuid();
    socketMap[socketId] = socket;
    sendMessage(socketId, {
        event: 'ONLINE',
        data: {
            socketId: socketId
        }
    });
    // 转发收到的消息
    socket.on('message', function (message) {
        operateMeesage(socketId, message);
    });
    socket.on('close', function () {
        closeSocket(socketId);
        console.log('close');
    });
    socket.on('error', function () {
        closeSocket(socketId);
        console.log('error');
    });
});