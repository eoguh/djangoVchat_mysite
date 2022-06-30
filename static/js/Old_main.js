var usernameInput = document.querySelector('#username');
var btnJoin = document.querySelector('#btn-join');

var username;
var webSocket;

var mapPeers = {};



// configuration for the stun server, it would be passed as an argument to the RTCPeerConnection. 
let configuration = {
    // offerToReceiveAudio: true,
    // offerToReceiveVideo: true,

    iceServers: [{ urls: "stun:stun.l.google.com:19302", }],
  };

// function added to onmessage event in the websocket
function webSocketOnMessage(event){
	console.log('websocket just received a message') // alerts the console that websocket recied a message.

	var parseData = JSON.parse(event.data);
	var message = parseData['message'];
	console.log('message: ', message)

	var peerUsername = parseData['peer']
	var action = parseData['action']

	// this ignores objects sent by self from taking action.
	if(username == peerUsername){ // be sure to implement this check in the backend too
		return;
	}

	// recall that the backend sent the channel nameof the peer along side. This retreives it for usage.
	var receiver_channel_name = parseData['message']['receiver_channel_name']

	// triggered when a new peer joins the room.
	if(action == 'new-peer'){
		createOfferer(peerUsername, receiver_channel_name);
		console.log('new peer received')
		return;
	}

	if(action == 'new-offer'){
		var offer = parseData['message']['sdp']
		createAnswerer(offer, peerUsername, receiver_channel_name)
		console.log('offer received')
		return;
	}

	// createAnswerer(offer, peerUsername, receiver_channel_name)
	if(action == 'new-answer'){
		var answer = parseData['message']['sdp'];

		var peer = mapPeers[peerUsername][0];

		peer.setRemoteDescription(answer);
		
		console.log('call Answered.')
		return;
	}
}

// function to create an offer sdp
function createOfferer(peerUsername, receiver_channel_name){
	try{
	
		var peer = new RTCPeerConnection(configuration); // the aurgumet configuration is defined above, its the stun server
		
		addLocalTracks(peer); //adds our local media track to the peer being connected to.

		// creates a datachannel
		var dc = peer.createDataChannel('channel');

		// triggers when data channel opens
		dc.addEventListener('open', () => {
			console.log('data channel is open')
		})

		// triggers when webRTC data channel receives a message
		dc.addEventListener('message', dcOnMessage)

		var remoteVideo = createVideo(peerUsername)
		setOnTrack(peer, remoteVideo, peerUsername) // modified 27th April.

		mapPeers[peerUsername] = [peer, dc];

		// defines a function that gets executed when the iceConnection state of a peer changes.
		peer.addEventListener('iceconnectionstatechange', () =>{
			var iceConnectionState = peer.iceConnectionState;

			if(iceConnectionState === 'failed' || iceConnectionState === 'disconnected' || iceConnectionState === 'closed'){
				delete mapPeers[peerUsername] // deletes the peer from the list of mapped peers

				// closing a peer's connection if error occures.
				if(iceConnectionState != 'closed'){
					peer.close();
				}
				removeVideo(remoteVideo)
			}
		})

		// 
	// 
		// 
	// 
		// 
		peer.addEventListener('icecandidate', (event) => {
			if(event.candidate){
				var candidateDescription = JSON.stringify(peer.localDescription)
				console.log('New ice candidate: ', candidateDescription) // console logs candidates local description.
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
				console.log('local description set successfully.')
			})
	}catch(e){
		console.error('Error creating offerer.', e.message)
	}
}


// creates an anwer to the offer. NOTE: I created this code by dublicating the codes for the createOfferer, then edited it to suit. incase of any issues... take note of this fact. 
function createAnswerer(offer, peerUsername, receiver_channel_name){
	try{

		var peer = new RTCPeerConnection(configuration); // the aurgumet configuration is defined above, its the stun server
		
		addLocalTracks(peer); //adds our local media track to the peer being connected to.

		var remoteVideo = createVideo(peerUsername)
		setOnTrack(peer, remoteVideo, peerUsername) // modified 27th April.

		peer.addEventListener('datachannel', e => {
			peer.dc = e.channel
			peer.dc.addEventListener('open', () => {
				console.log('data channel is open')
			})
			
			// triggers when webRTC data channel receives a message
			peer.dc.addEventListener('message', dcOnMessage);
			
			mapPeers[peerUsername] = [peer, peer.dc];
		})

		// defines a function that gets executed when the iceConnection state of a peer changes.
		peer.addEventListener('iceconnectionstatechange', () =>{
			console.log("iceconnectionstate changed!")
			var iceConnectionState = peer.iceConnectionState;

			if(iceConnectionState === 'failed' || iceConnectionState === 'disconnected' || iceConnectionState === 'closed'){
				console.log("iceconnectionstatechange failed or disconnected or closed.")
				delete mapPeers[peerUsername] // deletes the peer from the list of mapped peers

				// closing a peer's connection if error occures.
				if(iceConnectionState != 'closed'){
					peer.close();
				}
				removeVideo(remoteVideo)
			}
		})

		// 
	// 
		// 
	// 
		// 
		peer.addEventListener('icecandidate', (event) => {
			if(event.candidate){
				var candidateDescription = JSON.stringify(peer.localDescription);
				console.log('New ice candidate: ', candidateDescription) // console logs candidates local description.
				return;
			}

			sendSignal('new-answer', {
				'sdp': peer.localDescription,
				'receiver_channel_name': receiver_channel_name,
			})
		})

		peer.setRemoteDescription(offer)
			.then(() => {
				console.log('Remote description set successfully for %s.', peerUsername)
				return peer.createAnswer();
			})
			.then(a => {
				console.log('Answer created.');
				peer.setLocalDescription(a);
			})
	}catch(e){
		console.error('Error for Answerer', e.message)
	}
}


//function to harvest the local track for relay to other peers
function addLocalTracks(peer){
	localStream.getTracks().forEach(track => {
		peer.addTrack(track, localStream);
	});
	return;	
}


var messageList = document.querySelector('#message-list');
// function to be executed when the webRTC data channel receives a message
function dcOnMessage(event){
	var message = event.data; // extracts the message content.

	var li = document.createElement('li'); // creates a list item
	li.appendChild(document.createTextNode('message')); // creates a text node and appends it tothe list item - li
	messageList.appendChild(li); // appends the list item to the message list ul

}

var localStream = new MediaStream();

// selects the media to be transmitted to the localStream variable
const constraints = {
	'video': true,
	'audio': true,
}

const localVideo = document.querySelector('#local-video')

const btnToggleAudio = document.querySelector('#btn-toggle-audio') // selects the button to toggling audio
const btnToggleVideo = document.querySelector('#btn-toggle-video') // selects the button to toggling video

// grabs the local video and inputs it to the video element in the HTML.
var userMedia = navigator.mediaDevices.getUserMedia(constraints)
		.then(stream => {
			localStream = stream; // recall that localStream variable was assigned earlier.
			localVideo.srcObject = localStream; // assigns the media stream to the source of the local video.
			localVideo.muted = true; // mutes our media, so we don't hear ourselves.
			
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
		


// creates a video 
function createVideo(peerUsername){
	try{
		var videoContainer = document.querySelector('#video-container');
		var remoteVideo = document.createElement('video'); // creates a video element
		remoteVideo.id = peerUsername + '-video'; // sets the id of the video element

		remoteVideo.autoplay = true;
		remoteVideo.playsInline = true;

		var videoWrapper = document.createElement('div'); // creates a div for the video element

		videoContainer.appendChild(videoWrapper);

		videoWrapper.appendChild(remoteVideo);

		return remoteVideo;
	}catch(e){
		console.error('Error creating video', e.message)
	}
}


// assigns a source to the remote video. The source is 'remoteStream'
function setOnTrack(peer, remoteVideo, peerUsername){
		var remoteStream = new MediaStream();

		remoteVideo.srcObject = remoteStream;
		peer.addEventListener('track', async (event) => {
			// console.log('there is a track')
			var remoteVideoId = peerUsername + '-video';

			remoteStream.addTrack(event.track, remoteStream);
		});
}



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
		console.error('Error sending signal.', e.message)
	}
}


