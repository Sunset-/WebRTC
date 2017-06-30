import './style/style.scss';
import SunsetWebRTC from './sunset-webrtc/SunsetWebRTC';

var getUserMedia = (navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia);

var sw = new SunsetWebRTC();

function addVideo(stream, own) {
    var video = document.createElement('video');
    video.id = `video-${stream.id}`;
    document.getElementById(own ? 'in-video-container' : 'out-video-container').appendChild(video);
    video.autoplay = true;
    video.src = URL.createObjectURL(stream);
    video.play();
}


//用户流
getUserMedia.apply(navigator, [{
    video: true,
    audio: true
}, (localMediaStream) => {
    addVideo(localMediaStream, true);
    sw.join('TEST_ROOM');
    sw.on('addOutputStream', function (stream) {
        addVideo(stream);
    });
    sw.on('removeOutputStream', function (stream) {
        document.getElementById(`video-${stream.id}`).remove();
    });

    sw.addStream(localMediaStream);
    // this.____addVideo(localMediaStream);
}, function () {

}]);

//辅流
document.getElementById('share-btn').addEventListener('click', function () {
    getScreenMedia(function (err, stream) {
        if (err) {
            console.log('failed');
        } else {
            addVideo(stream, true);
            sw.addStream(stream);
            console.log('got a stream', stream);
        }
    });
});


var fullVideo = document.getElementById('full-video');
document.body.addEventListener('click', function (ev) {
    if (ev.target.nodeName == 'VIDEO') {
        if (ev.target.id != 'full-video') {
            fullVideo.src = ev.target.src;
            fullVideo.className = 'show';
        } else {
            fullVideo.src = null;
            fullVideo.className = '';
        }
    }
})