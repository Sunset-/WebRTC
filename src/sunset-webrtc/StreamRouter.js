/**
 * Sunset PeerConnection 连接类
 * 
 */
import EventEmitter from './EventEmitter';

function StreamRouter() {
    this.init();
}

StreamRouter.prototype = Object.assign(new EventEmitter(), {
    init() {
        this.initStates();
        this.initEvents();
    },
    initStates() {
        this.socketId = null;
        this.peerConnection = null;
        this.connections = {};
        this.inputStreams = {};
        this.outputStreams = {};
        //流权限控制(socketId->streamId)
        this.streamIncludes = {};
        this.streamExcludes = {};
    },
    initEvents() {},
    /**
     * 添加连接
     * 
     * @param {any} connection 
     */
    addConnection(connection) {
        var socketId = connection.getSocketId();
        this.connections[socketId] = connection;
        connection.on('close', () => {
            delete this.connections[socketId];
        });
        connection.on('addOutputStream', (stream) => {
            this.outputStreams[stream.id] = stream;
            this.emit('addOutputStream', stream);
        });
        connection.on('removeOutputStream', (stream) => {
            delete this.outputStreams[stream.id];
            this.emit('removeOutputStream', stream);
        });
        this._reBindStreamOnConnection(connection);
    },
    /**
     * 添加输入流
     * 
     * @param {any} stream 
     */
    addInputStream(stream) {
        if (stream instanceof MediaStream && !this.inputStreams[stream.id]) {
            this.inputStreams[stream.id] = stream;
        }
        this._reBindStreamOnConnections();
    },
    /**
     * 添加输入流
     * 
     * @param {any} stream 
     */
    removeInputStream(stream) {
        delete this.inputStreams[stream.id];
        this._reBindStreamOnConnections();
    },
    _reBindStreamOnConnections() {
        Object.keys(this.connections).forEach(id => {
            this._reBindStreamOnConnection(this.connections[id]);
        });
    },
    /**
     * 绑定媒体流
     * 
     * @param {any} socketId 
     */
    _reBindStreamOnConnection(connection) {
        var socketId = connection.getSocketId();;
        var streams = Object.keys(this.inputStreams);
        if (this.streamIncludes[socketId]) {
            streams = Object.keys(this.streamIncludes[socketId]);
        }
        if (this.streamExcludes[socketId]) {
            var excludes = Object.keys(this.streamExcludes[socketId]);
            streams = streams.filter(sid => excludes.indexOf(sid) < 0);
        }
        connection.attachStreams(streams.map(sid => this.inputStreams[sid]));
    }
});

module.exports = StreamRouter;