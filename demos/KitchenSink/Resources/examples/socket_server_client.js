var win = Ti.UI.currentWindow;

win.add(Ti.UI.createLabel({text:"Listening socket output:", color:'white', top: 40}));
var listenerStatusArea = Ti.UI.createTextArea({
	editable:true,
	value:'Listener status',
	height:100,
	width:300,
	top:80,
	textAlign:'left',
	borderWidth:2,
	borderColor:'#bbb',
	borderRadius:5,
	suppressReturn:false	
});
win.add(listenerStatusArea);

win.add(Ti.UI.createLabel({text:"Client socket output:", color:'white', bottom: 220}));
var clientStatusArea = Ti.UI.createTextArea({
	editable:false,
	value:'Client status',
	height:100,
	width:300,
	bottom:80,
	textAlign:'left',
	borderWidth:2,
	borderColor:'#bbb',
	borderRadius:5,
	suppressReturn:false
});
win.add(clientStatusArea);

function pumpCallback(e) {
	if (e.bytesProcessed == -1) { // EOF
		listenerStatusArea.value = "<EOF> - Can't perform any more operations on connected socket";
	}
	else if (e.errorDescription == null || e.errorDescription == "") {
		listenerStatusArea.value = "RECV FROM CLIENT: "+e.buffer.toString();
	}
	else {
		listenerStatusArea.value = "READ ERROR: "+e.errorDescription;
	}
}

var listenSocket = Ti.Network.Socket.createTCP({
    port: 40404,
    accepted: function(e) {
        // this where you would usually store the e.inbound value somewhere else so it can be used for
        // read / write operations elsewhere in the app
	listenerStatusArea.value = "STATUS:  connection accepted";
        e.inbound.write(Ti.createBuffer({value:"Hi client socket.  How are you?"}));
	Ti.Stream.pump(e.inbound,pumpCallback,1024, true);

    },
    error: function(e) {
	listenerStatusArea.value = "STATUS: error - closed";
	e.socket.close();
    }
});
listenSocket.listen(); // only starts listening for connections, does not accept them
listenerStatusArea.value = "STATUS: listening for connections";

// tells socket to accept the next inbound connection. listenSocket.accepted gets called when a connection is accepted
// via accept()
listenSocket.accept({});
listenerStatusArea.value = "STATUS: accepting next connection";

var connectSocket = Ti.Network.Socket.createTCP({
	host: 'localhost',
	port: 40404,
	connected: function(e) {
		clientStatusArea.value = "STATUS: connected";
		postConnect();
	},
	error: function(e) {
		clientStatusArea.value = "STATUS: error - closed";
	}
});
clientStatusArea.value = "STATUS: ready to connect";
connectSocket.connect();

function postConnect()
{
	try {
		// write some data
		clientStatusArea.value = "STATUS: sending data";
		var outData = Ti.createBuffer({value:"Howdy listener socket! How are you?"});
		var bytesWritten = connectSocket.write(outData);
		clientStatusArea.value = "STATUS: <" + bytesWritten + "> bytes written";

		// start read loop
		clientStatusArea.value = "STATUS: reading data";
		var readBuffer = Ti.createBuffer({length:1024});
		var bytesRead = 0;
		
		function readCallback(e) {
			if (e.bytesProcessed == -1) { // EOF
				clientStatusArea.value = "STATUS: closing";
				connectSocket.close(); // close the socket on our end
				clientStatusArea.value = "STATUS: closed";
				return;
			}
			var str = Ti.Codec.decodeString({source:readBuffer, length:e.bytesProcessed});
			clientStatusArea.value = "RECV FROM LISTENER: " + str;
			readBuffer.clear(); // clear the buffer before the next read
			
			// queue up the next read
			Ti.Stream.read(connectSocket,readBuffer,readCallback);
		}
		
		Ti.Stream.read(connectSocket,readBuffer,readCallback);
	} catch (e) {
		// IO error on socket. socket is closed and connectSocket.error is called
		clientStatusArea.value = "STATUS: error - closed";
	}
}

// Cleanup
var cleanup = function(e) {
	try {
		listenSocket.close();
	}
	catch (e) {
		// Don't care about exceptions; just means the socket was already closed
	}
	try {
		connectSocket.close();
	}
	catch (e) {
		// Don't care about exceptions; just means the socket was already closed
	}
};
win.addEventListener('close', cleanup)

if (Titanium.Platform.name == 'android')
{
	Ti.Android.currentActivity.addEventListener('pause', cleanup);
	Ti.Android.currentActivity.addEventListener('destroy', cleanup);
}
