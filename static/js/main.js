console.log('main.js')

var mapPeers = {};

var usernameInput = document.querySelector('#username');
var btnJoin = document.querySelector('#btn-join');

const btnToggleAudio = document.querySelector('#btn-toggle-audio') // selects the button to toggling audio
const btnToggleVideo = document.querySelector('#btn-toggle-video') // selects the button to toggling video

const btnShareScreen = document.querySelector('#btn-share-screen') // selects the button to toggling video



var webSocket;

// configuration for the stun server, it would be passed as an argument to the RTCPeerConnection. 
let configuration = {
    offerToReceiveAudio: true,
    offerToReceiveVideo: true,

    iceServers: [
        { urls: "stun:stun.l.google.com:19302"} ,

        {
            urls: "turn:pal.investments:3478",
            username: "ResonanceTurnServer",
            credential: "Adeniyi9",
        },

        // {
        //     urls: 'turn:173.255.193.102:3478',
        //     credential: 'Resonance',
        //     username: 'Adeniyi9'
        // }
    ],
  };


function webSocketOnMessage(event){
    var parseData = JSON.parse(event.data);

    var peerUsername = parseData['peer'];
    var action = parseData['action'];

    if(username == peerUsername){
        return;
    };

    var receiver_channel_name = parseData['message']['receiver_channel_name'];

    if(action == 'new-peer'){
        createOfferer(peerUsername, receiver_channel_name);
        return;
    };

    if(action == 'new-offer'){
        var offer = parseData['message']['sdp'];

        createAnswerer(offer, peerUsername, receiver_channel_name);
        return;
    };

    if(action == 'new-answer'){
        var answer = parseData['message']['sdp'];

        var peer = mapPeers[peerUsername][0];

        peer.setRemoteDescription(answer);
        return;
    }
    console.log('call answered');

}


btnJoin.addEventListener('click', () => {
    username = usernameInput.value;

    if(username == ''){
        return;
    }

    usernameInput.value = '';
    usernameInput.disabled = true;
    usernameInput.style.visibility = 'hidden';
    console.log(username);

    btnJoin.disabled = true;
    btnJoin.style.visibility = 'hidden';

    var labelUsername = document.querySelector('#label-username');
    labelUsername.innerHTML = username;

    var loc =window.location;
    var wsStart='ws://';
    if(loc.protocol=='https:'){
        wsStart= 'wss://';
    }

    var endPoint = wsStart + loc.host + loc.pathname;
    console.log('endPoint: ', endPoint);

    webSocket = new WebSocket(endPoint);

    webSocket.addEventListener('open', (e) => {
        console.log("webSocket connection open");

        sendSignal('new-peer', {});
    });

    webSocket.addEventListener('message', webSocketOnMessage);

    webSocket.addEventListener('close', (e) => {
        console.error('websocket is closed.')
    });

    webSocket.addEventListener('error', (e) => {
        console.log('Websocket encountered an error')
    });

})

var localStream = new MediaStream();

const display_constraints = {
    video: {
        cursor: 'always' | 'motion' | 'never',
        displaySurface: 'application' | 'browser' | 'monitor' | 'window'
    },
    audio: {'echoCancellation': true},
} 

const constraints = {
    video: {
        "width": {
            "min": 640,
            "max": 1024
        },
        "height": {
            "min": 480,
            "max": 768
        }
    },
    audio: {'echoCancellation': {exact: hasEchoCancellation}},
}

const localVideo = document.querySelector('#local-video'); // grabs the local video and inputs it to the video element in the HTML.

var userMedia = navigator.mediaDevices.getUserMedia(constraints)
            .then(stream => {
                localStream = stream; // recall that localStream variable was assigned earlier.
                localVideo.srcObject =localStream; // assigns the media stream to the source of the local video.
                localVideo.muted = true; // mutes our media, so we don't hear ourselves.

                localVideo.controls = false

                
                var audioTracks = stream.getAudioTracks(); // gets the audio tracks for manipulation
                var videoTracks = stream.getVideoTracks(); // gets the video tracks for manipulation
            
                audioTracks[0].enabled = true; // enables audio tracks, although enabled by default. but this functionality will be usefull in toggling audio.
                videoTracks[0].enabled = true; // enables video tracks, although enabled by default. but this functionality will be usefull in toggling video.
                
                // function to toggle the audio on anf off.
                btnToggleAudio.addEventListener('click', () => {
                    audioTracks[0].enabled = !audioTracks[0].enabled; // inverts the boolean value of audioTracks[0].enabled when the audio toggle button is clicked.
                    
                    if(audioTracks[0].enabled){
                        btnToggleAudio.innerHTML = 'Mute Audio';
                        return;
                    }
                    btnToggleAudio.innerHTML = 'Unmute Audio'
                })

                // function to toggle the video on anf off.
                btnToggleVideo.addEventListener('click', () => {
                    videoTracks[0].enabled = !videoTracks[0].enabled; // inverts the boolean value of audioTracks[0].enabled when the audio toggle button is clicked.
                    
                    if(audioTracks[0].enabled){
                        btnToggleVideo.innerHTML = 'Disable Video';
                        return;
                    }
                    btnToggleVideo.innerHTML = 'Enable Video'
                })
            })
            // incase of error, this below code is executed.
            .catch(error => {
                console.log("There is an error accessing media devices, check error log."); // console logs that an error occured
                console.error("Error accessing media devices", error); // narates the error in the console.
            })
        var shareSreen = false;
        btnShareScreen.addEventListener('click', () => {
            shareSreen = !shareSreen;
            if(shareSreen){
                btnShareScreen.innerHTML = 'unshare screen'
                userMedia = navigator.mediaDevices.getDisplayMedia(display_constraints)
                    .then(stream => {
                        localStream = stream; // recall that localStream variable was assigned earlier.
                        localVideo.srcObject =localStream; // assigns the media stream to the source of the local video.
                        localVideo.muted = true; // mutes our media, so we don't hear ourselves.
        
                        localVideo.controls = false
        
                        
                        var audioTracks = stream.getAudioTracks(); // gets the audio tracks for manipulation
                        var videoTracks = stream.getVideoTracks(); // gets the video tracks for manipulation
                    
                        audioTracks[0].enabled = true; // enables audio tracks, although enabled by default. but this functionality will be usefull in toggling audio.
                        videoTracks[0].enabled = true; // enables video tracks, although enabled by default. but this functionality will be usefull in toggling video.
                        
                        // function to toggle the audio on anf off.
                        btnToggleAudio.addEventListener('click', () => {
                            audioTracks[0].enabled = !audioTracks[0].enabled; // inverts the boolean value of audioTracks[0].enabled when the audio toggle button is clicked.
                            
                            if(audioTracks[0].enabled){
                                btnToggleAudio.innerHTML = 'Mute Audio';
                                return;
                            }
                            btnToggleAudio.innerHTML = 'Unmute Audio'
                        })
        
                        // function to toggle the video on anf off.
                        btnToggleVideo.addEventListener('click', () => {
                            videoTracks[0].enabled = !videoTracks[0].enabled; // inverts the boolean value of audioTracks[0].enabled when the audio toggle button is clicked.
                            
                            if(audioTracks[0].enabled){
                                btnToggleVideo.innerHTML = 'Disable Video';
                                return;
                            }
                            btnToggleVideo.innerHTML = 'Enable Video'
                        })
                    })
                    // incase of error, this below code is executed.
                    .catch(error => {
                        console.log("There is an error accessing media devices, check error log."); // console logs that an error occured
                        console.error("Error accessing media devices", error); // narates the error in the console.
                    })
                    return;

                
            }else if(!shareSreen){
                btnShareScreen.innerHTML = 'share screen'
                userMedia = navigator.mediaDevices.getUserMedia(constraints)
                    .then(stream => {
                        localStream = stream; // recall that localStream variable was assigned earlier.
                        localVideo.srcObject =localStream; // assigns the media stream to the source of the local video.
                        localVideo.muted = true; // mutes our media, so we don't hear ourselves.
        
                        localVideo.controls = false
        
                        
                        var audioTracks = stream.getAudioTracks(); // gets the audio tracks for manipulation
                        var videoTracks = stream.getVideoTracks(); // gets the video tracks for manipulation
                    
                        audioTracks[0].enabled = true; // enables audio tracks, although enabled by default. but this functionality will be usefull in toggling audio.
                        videoTracks[0].enabled = true; // enables video tracks, although enabled by default. but this functionality will be usefull in toggling video.
                        
                        // function to toggle the audio on anf off.
                        btnToggleAudio.addEventListener('click', () => {
                            audioTracks[0].enabled = !audioTracks[0].enabled; // inverts the boolean value of audioTracks[0].enabled when the audio toggle button is clicked.
                            
                            if(audioTracks[0].enabled){
                                btnToggleAudio.innerHTML = 'Mute Audio';
                                return;
                            }
                            btnToggleAudio.innerHTML = 'Unmute Audio'
                        })
        
                        // function to toggle the video on anf off.
                        btnToggleVideo.addEventListener('click', () => {
                            videoTracks[0].enabled = !videoTracks[0].enabled; // inverts the boolean value of audioTracks[0].enabled when the audio toggle button is clicked.
                            
                            if(audioTracks[0].enabled){
                                btnToggleVideo.innerHTML = 'Disable Video';
                                return;
                            }
                            btnToggleVideo.innerHTML = 'Enable Video'
                        })
                    })
                    // incase of error, this below code is executed.
                    .catch(error => {
                        console.log("There is an error accessing media devices, check error log."); // console logs that an error occured
                        console.error("Error accessing media devices", error); // narates the error in the console.
                    })
                    return;
            }
        })

        // userMedia
        //     .then(stream => {
        //         localStream = stream; // recall that localStream variable was assigned earlier.
        //         localVideo.srcObject =localStream; // assigns the media stream to the source of the local video.
        //         localVideo.muted = true; // mutes our media, so we don't hear ourselves.

        //         localVideo.controls = false

                
        //         var audioTracks = stream.getAudioTracks(); // gets the audio tracks for manipulation
        //         var videoTracks = stream.getVideoTracks(); // gets the video tracks for manipulation
            
        //         audioTracks[0].enabled = true; // enables audio tracks, although enabled by default. but this functionality will be usefull in toggling audio.
        //         videoTracks[0].enabled = true; // enables video tracks, although enabled by default. but this functionality will be usefull in toggling video.
                
        //         // function to toggle the audio on anf off.
        //         btnToggleAudio.addEventListener('click', () => {
        //             audioTracks[0].enabled = !audioTracks[0].enabled; // inverts the boolean value of audioTracks[0].enabled when the audio toggle button is clicked.
                    
        //             if(audioTracks[0].enabled){
        //                 btnToggleAudio.innerHTML = 'Mute Audio';
        //                 return;
        //             }
        //             btnToggleAudio.innerHTML = 'Unmute Audio'
        //         })

        //         // function to toggle the video on anf off.
        //         btnToggleVideo.addEventListener('click', () => {
        //             videoTracks[0].enabled = !videoTracks[0].enabled; // inverts the boolean value of audioTracks[0].enabled when the audio toggle button is clicked.
                    
        //             if(audioTracks[0].enabled){
        //                 btnToggleVideo.innerHTML = 'Disable Video';
        //                 return;
        //             }
        //             btnToggleVideo.innerHTML = 'Enable Video'
        //         })
        //     })
        //     // incase of error, this below code is executed.
        //     .catch(error => {
        //         console.log("There is an error accessing media devices, check error log."); // console logs that an error occured
        //         console.error("Error accessing media devices", error); // narates the error in the console.
        //     })
		


// function to send signal


function sendSignal(action, message){
	try{
	    var jsonStr = JSON.stringify({
			'peer': username, // username of the peer sending signal.
			'action': action, // new-peer, new-offer, new-answer. indicates intended action of the peer sending signal.
			'message': message, // a dictionary feild containing objects sent along. maybe sdp or any other object.
		});
		webSocket.send(jsonStr) // send the object to the consumers using the websocket.
	}catch(error){
		console.error('Error sending signal.', error.message)
	}
}


function createOfferer(peerUsername, receiver_channel_name){
    var peer = new RTCPeerConnection(configuration);

    addLocalTracks(peer);

    dc = peer.createDataChannel('channel');

    dc.addEventListener('open', () => {
        console.log('data channel is open')
    })

    dc.addEventListener('message', dcOnMessage);
    
    var remoteVideo = createVideo(peerUsername);
    setOnTrack(peer, remoteVideo);

    mapPeers[peerUsername] = [peer, dc];

    peer.addEventListener('iceconnectionstatechage', () => {
        var iceConnectionState = peer.iceConnectionState;

        if(iceConnectionState === 'failed' || iceConnectionState === 'disconnected' || iceConnectionState === 'closed'){
            delete mapPeers[peerUsername];

            if(iceConnectionState != 'closed'){
                peer.close();
            }
            removeVideo(remoteVideo);
        }
    })

    peer.addEventListener('icecandidate', (event) => {
        if(event.candidate){
            console.log("New ice candidate: ", JSON.stringify(peer.localDescription))
            return;
        }

        sendSignal('new-offer', {
            'sdp': peer.localDescription,
            'receiver_channel_name': receiver_channel_name,
        })
    })
    peer.createOffer()
        .then(o => peer.setLocalDescription(o))
        .then(() => {
            console.log('Local discription set successfully.')
        })
}


function createAnswerer(offer, peerUsername, receiver_channel_name){
    var peer = new RTCPeerConnection(configuration);

    addLocalTracks(peer);

    var remoteVideo = createVideo(peerUsername);
    setOnTrack(peer, remoteVideo);

    peer.addEventListener('datachannel', e => {
        peer.dc = e.channel;
     
        peer.dc.addEventListener('open', () => {
            console.log('data channel is open')
        })

        peer.dc.addEventListener('message', dcOnMessage);
        mapPeers[peerUsername] = [peer, peer.dc];
    });

    
    peer.addEventListener('iceconnectionstatechage', () => {
        var iceConnectionState = peer.iceConnectionState;

        if(iceConnectionState === 'failed' || iceConnectionState === 'disconnected' || iceConnectionState === 'closed'){
            delete mapPeers[peerUsername];

            if(iceConnectionState != 'closed'){
                peer.close();
            }
            removeVideo(remoteVideo);
        }
    })

    peer.addEventListener('icecandidate', (event) => {
        if(event.candidate){
            console.log("New ice candidate: ", JSON.stringify(peer.localDescription))
            return;
        }

        sendSignal('new-answer', {
            'sdp': peer.localDescription,
            'receiver_channel_name': receiver_channel_name,
        })
    })
    peer.setRemoteDescription(offer)
        .then(() => {
            console.log('Remote description has been set successfully for %s', peerUsername);

            return peer.createAnswer();
        })
        .then(a => {
            console.log('Answer created!');
            peer.setLocalDescription(a);
        })
}


function addLocalTracks(peer){
    localStream.getTracks().forEach(track => {
        peer.addTrack(track, localStream);
    })
    return;
}

var messageList = document.querySelector('#message-list');

function dcOnMessage(event){
    var message = event.data;

    var li = document.createElement('li');
    li.appendChild(document.createTextNode(message));
    messageList.appendChild(li);
}

function createVideo(peerUsername){
    var videoContainer = document.querySelector('#video-container');

    var remoteVideo = document.createElement('video');

    remoteVideo.id = peerUsername + '-video'
    remoteVideo.autoplay = true;
    remoteVideo.playsInline = true;

    var videoWrapper = document.createElement('div');

    videoContainer.appendChild(videoWrapper)

    videoWrapper.appendChild(remoteVideo);
    return remoteVideo;
}

function setOnTrack(peer, remoteVideo){
	var remoteStream = new MediaStream();

    remoteVideo.srcObject = remoteStream;

    peer.addEventListener('track', async (event) => {
        
        remoteStream.addTrack(event.track, remoteStream)
    })
}


function removeVideo(video){
    var videoWrapper = video.parentNode;

    videoWrapper.parentNode.removeChild(videoWrapper)
}

