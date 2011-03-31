var win = Titanium.UI.currentWindow;

var connectedSockets = [];

var acceptedCallbacks = {
	read: function(e) {
		messageLabel.text = "Read from: "+e.socket.host;
		readLabel.text = e.data.text;
	},
	error : function(e) {
		Ti.UI.createAlertDialog({
			title:"Socket error: "+e.socket.host,
			message:e.error
		}).show();
		var index = connectedSockets.indexOf(e.socket);
		if (index != -1) {
			connectedSockets.splice(index,1); // Removes socket
		}
	}
};

var socket = Titanium.Network.createTCPSocket({
	hostName:Ti.Platform.address,
	port:40404,
	type:Ti.Network.TCP,
	accepted: function(e) {
		var sock = e.connector;
		connectedSockets.push(sock);
		socket.accept(acceptedCallbacks);
	},
	closed: function(e) {
		messageLabel.text = "Closed listener";
	},
	error: function(e) {
		Ti.UI.createAlertDialog({
			title:"Listener error: "+e.errorCode,
			message:e.error
		}).show();
	}
});

var messageLabel = Titanium.UI.createLabel({
	text:'Socket messages',
	font:{fontSize:14},
	color:'#777',
	top:220,
	left:10
});
win.add(messageLabel);

var readLabel = Titanium.UI.createLabel({
	text:'Read data',
	font:{fontSize:14},
	color:'#777',
	top:250,
	left:10,
	width:400
});
win.add(readLabel);

var connectButton = Titanium.UI.createButton({
	title:'Listen on 40404',
	width:200,
	height:40,
	top:10
});
win.add(connectButton);
connectButton.addEventListener('click', function() {
	try {
		socket.listen();
		messageLabel.text = "Listening on "+e.socket.host+":"+e.socket.port;
		e.socket.accept(acceptedCallbacks);
	} catch (e) {
		messageLabel.text = 'Exception: '+e;
	}
});

var closeButton = Titanium.UI.createButton({
	title:'Close',
	width:200,
	height:40,
	top:60
});
win.add(closeButton);
closeButton.addEventListener('click', function() {
	try {
		socket.close();
	} catch (e) {
		messageLabel.text = 'Exception: '+e;
	}
});

var stateButton = Titanium.UI.createButton({
	title:'Socket state',
	width:200,
	height:40,
	top:110
	});
win.add(validButton);
validButton.addEventListener('click', function() {
	var stateString = "UNKNOWN";
	switch (socket.state) {
		case Ti.Network.SOCKET_INITIALIZED:
			stateString = "INITIALIZED";
			break;
		case Ti.Network.SOCKET_CONNECTED:
			stateString = "CONNECTED";
			break;
		case Ti.Network.SOCKET_LISTENING:
			stateString = "LISTENING";
			break;
		case Ti.Network.SOCKET_CLOSED:
			stateString = "CLOSED";
			break;
		case Ti.Network.SOCKET_ERROR:
			stateString = "ERROR";
			break;
	}
	messageLabel.text = "State: "+stateString;
});

var writeButton = Titanium.UI.createButton({
	title:"Write 'Paradise Lost'",
	width:200,
	height:40,
	top:160
	});
win.add(writeButton);
writeButton.addEventListener('click', function() {
	var plBlob = Titanium.Filesystem.getFile(Titanium.Filesystem.resourcesDirectory, 'paradise_lost.txt').read();

	for (var sock in connectedSockets) {
		sock.write(plBlob);
	}
	messageLabel.text = "I'm a writer!";
});

// Cleanup
win.addEventListener('close', function(e) {
	try {
		socket.close();
	}
	catch (e) {
		// Don't care about exceptions; just means the socket was already closed
	}
	for (var sock in connectedSockets) {
		try {
			sock.close();
		}
		catch (e) {
			// See above
		}
	}
});