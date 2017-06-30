(function () {

    // stun和turn服务器
    var iceServer = {
        "iceServers": [{
            "url": "stun:stun.l.google.com:19302"
        }, {
            "url": "turn:numb.viagenie.ca",
            "username": "webrtc@live.com",
            "credential": "muazkh"
        }]
    };

    var isCaller = window.location.href.split('#')[1];

    //兼容API
    var getUserMedia = (navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia);
    var nativePeerConnection = (window.PeerConnection || window.webkitPeerConnection00 || window.webkitRTCPeerConnection || window.mozRTCPeerConnection);
    var nativeRTCSessionDescription = (window.mozRTCSessionDescription || window.RTCSessionDescription);
    var nativeRTCIceCandidate = (window.mozRTCIceCandidate || window.RTCIceCandidate);

    var iceServer = {
        "iceServers": [{
            "url": "stun:stun.l.google.com:19302"
        }, {
            "url": "turn:numb.viagenie.ca",
            "username": "webrtc@live.com",
            "credential": "muazkh"
        }]
    };

    var count = 0;

    function SunsetRTC() {
        this.socket = new WebSocket('wss://192.168.0.109:3018');
        // this.socket.on('connect')
        this.createLocalStream();
    }

    SunsetRTC.prototype = {
        createLocalStream: function () {
            var self = this;
            getUserMedia.apply(navigator, [{
                video: true,
                audio: true
            }, function (localMediaStream) {
                self.localStream = localMediaStream;
                self.attachStream(self.getLocalVideo(), window.URL.createObjectURL(localMediaStream));
                self.createPeerConnection();
            }, function () {

            }]);
        },
        attachStream: function (video, stream) {
            if (video && stream) {
                video.src = stream;
                video.play();
            }
        },
        addVideo: function (stream) {
            console.log('ADD A STREAM')
            var video = document.createElement('video');
            video.id = 'video-other-' + (++count);
            document.getElementById('videos').appendChild(video);
            video.autoplay = true;
            video.src = URL.createObjectURL(stream);
            video.play();
        },
        getLocalVideo() {
            return document.getElementById('video-local');
        },
        createPeerConnection() {
            var self = this;
            var pc = this.pc = new nativePeerConnection();
            console.log('createPeerConnection')


            pc.onicecandidate = function (event) {
                console.warn('-----onicecandidate-----');
                if (event.candidate !== null) {
                    self.socket.send(JSON.stringify({
                        "eventName": "_ice_candidate",
                        "data": {
                            "candidate": event.candidate
                        }
                    }));
                }
            };
            //新增流
            pc.onaddstream = function (event) {
                self.addVideo(event.stream);
                // self.otherStream = event.stream;
                // setTimeout(function () {
                //     document.getElementById('remoteVideo').src = URL.createObjectURL(self.otherStream);
                // }, 0)
            };
            //offer
            // if (isCaller) {
            console.log('ADD');
            pc.addStream(self.localStream);
            // }

            //数据通道
            // try {
            //     var channel = pc.createDataChannel('message-s');
            //     pc.ondatachannel = function (event) {
            //         var receiveChannel = event.channel;
            //         receiveChannel.onmessage = function (event) {
            //             console.log(event.data);
            //         };
            //     };
            //     channel.onopen = function (event) {
            //         console.log('datachannel open');
            //         if (isCaller) {
            //             setInterval(function () {
            //                 channel.send('hello')
            //             }, 2000)
            //         }
            //     }
            //     channel.onerror = function (err) {
            //         console.log('datachannel error:' + err);
            //     }
            // } catch (e) {
            //     console.error(e);
            // }

            if (isCaller) {
                //发起连接申请
                pc.createOffer(function (desc) {
                    console.warn('-----createOffer-----');
                    pc.setLocalDescription(desc);
                    self.socket.send(JSON.stringify({
                        eventName: 'offer',
                        data: desc
                    }))
                }, function () {

                });
                // setTimeout(function () {
                //     getScreenMedia(function (err, stream) {
                //         if (err) {
                //             console.log('failed');
                //         } else {
                //             self.addVideo(stream);
                //             pc.addStream(stream);
                //             //发起连接申请
                //             pc.createOffer(function (desc) {
                //                 pc.setLocalDescription(desc);
                //                 self.socket.send(JSON.stringify({
                //                     eventName: 'offer',
                //                     data: desc
                //                 }))
                //             }, function () {

                //             });
                //             console.log('got a stream', stream);

                //         }
                //     });
                // }, 3000);
            }
            //answer
            this.socket.onmessage = function (message) {
                var json = JSON.parse(message.data);
                if (json.eventName === "_ice_candidate") {
                    console.warn('-----addIceCandidate-----');
                    //添加ICE
                    if(isCaller){
                        debugger;
                    }
                    pc.addIceCandidate(new nativeRTCIceCandidate(json.data.candidate));
                } else {
                    var remoteDesc = json.data;
                    //设置远端session描述
                    console.warn('-----setRemoteDescription-----');
                    pc.setRemoteDescription(new RTCSessionDescription(remoteDesc));
                    if (json.eventName == 'offer') {
                        console.warn('-----createAnswer-----');
                        //发送回应
                        pc.createAnswer(function (desc) {
                            pc.setLocalDescription(desc);
                            self.socket.send(JSON.stringify({
                                eventName: 'answer',
                                data: desc
                            }))
                        }, function () {

                        });
                    }

                    // if (isCaller)
                    //     setInterval(function () {
                    //         console.log('send message')
                    //         channel.send('hello');
                    //     }, 3000)
                }
            }
        }

    }

    SunsetRTC.prototype.constructor = SunsetRTC;


    new SunsetRTC();



})();