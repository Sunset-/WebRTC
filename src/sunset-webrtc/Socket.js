/**
 * Sunset PeerConnection 连接类
 * 
 */
import EventEmitter from './EventEmitter';

//兼容API
var nativePeerConnection = (window.PeerConnection || window.webkitPeerConnection00 || window.webkitRTCPeerConnection || window.mozRTCPeerConnection);

//默认配置
var defaltOptions = {};


function Socket(options) {
    this.options = Object.assign(Object.assign({}, defaltOptions), options);
    this.init();
}

Socket.prototype = Object.assign(new EventEmitter(), {
    init() {
        this.initStates();
        this._initWebsocket();
    },
    initStates() {
        this.socketId = null;
        this.messageQuene = [];
    },
    initEvents() {

    },
    _initWebsocket() {
        var options = this.options;
        if (!options.url) {
            throw new Error('must config websocket');
        }
        var websocket = this.websocket = new WebSocket(options.url);
        websocket.onopen = () => {
            this.onOpen();
        };
        websocket.onerror = (err) => {
            this.online = false;
            this.emit('websocket-error', err);
            throw err;
        }
        websocket.onclose = () => {
            this.online = false;
            this.emit('websocket-close');
        }
        websocket.onmessage = (evt) => {
            var json = null;
            try {
                json = JSON.parse(evt.data);
            } catch (e) {}
            if (json && json.event) {
                this.emit(json.event, json.data, json.from);
                json.from && this.trigger(json.event, json.from, json.data);
            } else {
                this.emit('websocket-message', evt.data);
            }
        }
    },
    onOpen() {
        this.online = true;
        this.clearMessageQuene();
        this.emit('websocket-open');
    },
    clearMessageQuene() {
        var quene = this.messageQuene;
        while (quene.length) {
            var message = quene.shift();
            this.send(message.data, message.origin);
        }
    },
    /**
     * 发送weboscket信息
     * 
     * @param {any} data 数据
     * @param {any} origin 是否发送原始数据
     */
    send(data, origin) {
        if (this.online) {
            this.websocket.send(origin ? data : JSON.stringify(data));
        } else {
            if (this.messageQuene.length <= 100) {
                this.messageQuene.push({
                    data: data,
                    origin: origin
                });
            } else {
                throw new Error('websocket offline messagequene max size is 100 !');
            }
        }
    }
});

module.exports = Socket;