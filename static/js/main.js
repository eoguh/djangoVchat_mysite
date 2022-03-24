

console.log('main.js working properly')


var usernameInput = document.querySelector('#username');
var btnJoin = document.querySelector('#btn-join');

var username;
var webSocket;

// function added to onmessage event in the websocket
function webSocketOnMessage(event){
	var parseData = JSON.parse(event.data);
	var message = parseData['message']
	console.log('message: ', message)
}

//when the join room button is clicked... this process is triggered
btnJoin.addEventListener('click', () => {
	var usernameInput = document.querySelector('#username');

	username = usernameInput.value;

	console.log('username: ', username)

	if(username==''){
		return;
	}

	usernameInput.disabled = true;
	usernameInput.style.visibility = 'hidden';

	btnJoin.disabled = true;
	btnJoin.style.visibility = 'hidden';
	var labelUsername = document.querySelector('#label-username');
	labelUsername.innerHTML = username;

	var loc = window.location;
	var wsStart = 'ws://';

	if (loc.protocol == 'https'){
		wsStart = 'wss://';
	}
	var endPoint = wsStart + loc.host + loc.pathname;
	console.log('endPoint: ', endPoint)

	// creates a new websocket connection... 
	webSocket = new WebSocket(endPoint);

	webSocket.addEventListener('open', (e) => {
		console.log('connection open')
		var jsonStr = JSON.stringify({
			'message': 'This is a message',
		});
		webSocket.send(jsonStr)
	}); 
	webSocket.addEventListener('message', webSocketOnMessage); 
	webSocket.addEventListener('close', (e) => {
		console.log('connection closed')
	}); 
	webSocket.addEventListener('error', (e) => {
		console.log('Error occurred')
		console.error('Error: ', error)
	}); 

})
