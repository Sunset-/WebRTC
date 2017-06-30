/**
 * Sunset WebRTC 客户端
 * 
 */
import EventEmitter from './EventEmitter';
import Socket from './Socket';
import StreamRouter from './StreamRouter';
import Connection from './Connection';

//兼容API
var getUserMedia = (navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia);

var defaltOptions = {
    iceServer: {
        "iceServers": [{
            "url": "stun:stun.l.google.com:19302"
        }, {
            "url": "turn:numb.viagenie.ca",
            "username": "webrtc@live.com",
            "credential": "muazkh"
        }]
    },
    websocket: {
        url: 'wss://192.168.0.109:3008'
    }
};


function SunsetWebRTC(options) {
    this.options = Object.assign(Object.assign({}, defaltOptions), options);
    this.init();
}

SunsetWebRTC.prototype = Object.assign(new EventEmitter(), {
    /**
     * 初始化
     * 
     */
    init() {
        this.socket = new Socket(this.options.websocket);
        this.streamRouter = new StreamRouter();
        this._initStates();
        this._initEvents();
    },
    /**
     * 加入房间
     * 
     * @param {any} roomToken 
     */
    join(roomToken) {
        this.roomToken = roomToken;
        this.socket.send({
            event: 'JOIN_ROOM',
            data: this.roomToken
        });
    },
    /**
     * 初始化状态
     * 
     */
    _initStates() {
        //个人socketId
        this.socketId = null;
        //个人信息
        this.ownInfo = null;
        //websocket是否在线
        this.online = false;
        //room-token
        this.roomToken = null;
        //websocket连接
        this.websocket = null;
        //webrtc连接
        this.connections = {};
    },
    /**
     * 注册事件
     * 
     */
    _initEvents() {
        //上线时，加入房间
        this.socket.on('ONLINE', (data) => {
            console.warn("own:" + data.socketId);
            this.socketId = data.socketId;
            this.ownInfo = data.ownInfo;
        });
        //获取房间信息后，创建webrtc连接
        this.socket.on('JOINED_ROOM', (data) => {
            this._createConnections(data);
        });
        //向加入房间者创建p2p连接
        this.socket.on('OTHER_JOINED_ROOM', (data, fromSocketId) => {
            this._createConnection(fromSocketId, true);
        });
        //丢失连接
        this.socket.on('LOSE_CONNECTION', (data, fromSocketId) => {
            this.
            this._loseConnection(fromSocketId);
        });
        this.streamRouter.on('addOutputStream', (stream) => {
            this.emit('addOutputStream', stream);
        });
        this.streamRouter.on('removeOutputStream', (stream) => {
            this.emit('removeOutputStream', stream);
        });
    },
    /**********P2P连接***********/
    /**
     * 创建所有连接
     * 
     */
    _createConnections(data, isPassivity) {
        var otherSocketIds = data.otherSocketIds;
        otherSocketIds && otherSocketIds.forEach(socketId => {
            this._createConnection(socketId, isPassivity);
        });
    },
    /**
     * 创建单一连接
     * 
     */
    _createConnection(fromSocketId, isPassivity) {
        var connection = this.connections[fromSocketId] = new Connection(fromSocketId, this.socket, this.options);
        connection.isPassivity = isPassivity;
        this.streamRouter.addConnection(connection);
    },
    /**********流***********/
    /**
     * 添加输入媒体流
     * 
     * @param {any} stream 
     */
    addStream(stream) {
        console.warn('ADD STREAM : ' + stream.id);
        this.streamRouter.addInputStream(stream);
    },
    /**
     * 移除输入媒体流
     * 
     * @param {any} label 
     */
    removeStream(id) {
        console.warn('REMOVE STREAM : ' + stream.id);
        this.streamRouter.addInputStream(stream);
    }
});
SunsetWebRTC.prototype.constructor = SunsetWebRTC;


module.exports = SunsetWebRTC;