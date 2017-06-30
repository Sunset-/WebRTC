/**
 * Sunset PeerConnection 连接类
 * 
 */
import EventEmitter from './EventEmitter';

//兼容API
var nativePeerConnection = (window.PeerConnection || window.webkitPeerConnection00 || window.webkitRTCPeerConnection || window.mozRTCPeerConnection);
var nativeRTCSessionDescription = (window.mozRTCSessionDescription || window.RTCSessionDescription);
var nativeRTCIceCandidate = (window.mozRTCIceCandidate || window.RTCIceCandidate);

//默认配置
var defaltOptions = {
    iceServer: {
        "iceServers": [{
            "url": "stun:stun.l.google.com:19302"
        }, {
            "url": "turn:numb.viagenie.ca",
            "username": "webrtc@live.com",
            "credential": "muazkh"
        }]
    }
};

var uid = 0;

function Connection(socketId, socket, options) {
    this.uid = ++uid;
    this.options = Object.assign(Object.assign({}, defaltOptions), options);
    this.init(socketId, socket);
}

Connection.prototype = Object.assign(new EventEmitter(), {
    init(socketId, socket) {
        this.initStates(socketId, socket);
        this.initEvents();
        this.initPeerConnection();
    },
    initStates(socketId, socket) {
        this.socketId = socketId;
        this.socket = socket;
        this.peerConnection = null;
        this.inputStreams = [];
        this.outputStreams = [];
    },
    initEvents() {
        var socket = this.socket;
        //加入备选ICE
        socket.bind('__ICE_CANDIDATE', this.socketId, (data) => {
            this._addIceCandidate(data);
        });
        //回应WebRTC连接
        socket.bind('__OFFER', this.socketId, (data) => {
            this._answer(data);
        });
        //接受回应
        socket.bind('__ANSWER', this.socketId, (data) => {
            this._receiveAnswer(data);
        });
        //接受回应
        socket.bind('__LOSE', this.socketId, () => {
            this.close();
        });


    },
    initPeerConnection() {
        var pc = this.peerConnection = new nativePeerConnection(this.options.iceServer);
        //ICE连接事件
        pc.onicecandidate = (evt) => {
            if (evt.candidate !== null) {
                this.socket.send({
                    "event": "__ICE_CANDIDATE",
                    to: this.socketId,
                    "data": {
                        "candidate": evt.candidate
                    }
                });
            }
        };
        //新增流事件
        pc.onaddstream = (event) => {
            var stream = event.stream;
            stream.socketId = this.socketId;
            this.outputStreams.push(event.stream);
            console.log('ADD-STREAM:' + this.uid + '-' + stream.id);
            this.emit('addOutputStream', stream);
        };
        //移除流事件
        pc.onremovestream = (event) => {
            var stream = event.stream;
            this.emit('removeOutputStream', stream);
        };
        //绑定流
        // this._offer();
        return pc;
    },
    /**
     * 获取连接的目标socketId
     * 
     * @returns 
     */
    getSocketId() {
        return this.socketId;
    },
    /**
     * 绑定媒体流
     * 
     * @param {any} socketId 
     */
    attachStreams(newStreams) {
        var pc = this.peerConnection;
        var lastStreams = this.inputStreams;
        var lastIds = lastStreams.map(s => s.id);
        var newIds = newStreams.map(s => s.id);
        lastIds.sort();
        newIds.sort();
        if (lastIds.join(',') != newIds.join(',')) {
            lastStreams.forEach(ls => {
                if (newIds.indexOf(ls.id) < 0) {
                    pc.removeStream(ls);
                }
            })
            newStreams.forEach(ns => {
                if (lastIds.indexOf(ns.id) < 0) {
                    pc.addStream(ns);
                }
            });
            this.inputStreams = newStreams;
            if (!this.isPassivity) {
                console.log('attachStreams_offer');
                this._offer();
            }
        }
        this.isPassivity = false;
    },
    close() {
        this.peerConnection.close();
        this.socket.unbind(this.socketId);
        this.outputStreams.forEach(stream => {
            this.emit('removeOutputStream', stream);
        });
        this.emit('close');
    },
    /**
     * 加入备选ICE
     * 
     * @param {any} data 
     */
    _addIceCandidate(data, fromSocketId) {
        //添加ICE
        this.peerConnection.addIceCandidate(new nativeRTCIceCandidate(data.candidate));
    },
    /**
     * 请求
     * 
     */
    _offer() {
        var pc = this.peerConnection;
        console.log('OFFER:' + this.socketId);
        //发起连接申请
        pc.createOffer((desc) => {
            pc.setLocalDescription(desc);
            this.socket.send({
                event: '__OFFER',
                to: this.socketId,
                data: desc
            });
        }, (err) => {
            this.emit('connection-error', err, otherSocket);
        });
    },
    /**
     * 应答
     * 
     * @param {any} data 
     * @param {any} fromSocketId 
     */
    _answer(data) {
        var pc = this.peerConnection;
        console.log('ANSWER:' + this.socketId);
        //发送回应
        console.log('setRemoteDescription');
        pc.setRemoteDescription(new RTCSessionDescription(data));
        pc.createAnswer((desc) => {
            pc.setLocalDescription(desc);
            this.socket.send({
                event: '__ANSWER',
                to: this.socketId,
                data: desc
            });
        }, function () {

        });
    },
    /**
     * 响应应答
     * 
     * @param {any} data 
     * @param {any} fromSocketId 
     */
    _receiveAnswer(data) {
        console.log('setRemoteDescription');
        var pc = this.peerConnection;
        pc.setRemoteDescription(new RTCSessionDescription(data));
    }
});

module.exports = Connection;