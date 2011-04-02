var win = Ti.UI.currentWindow;

/*
 * Assumes the existence of a `Ti.Blob Ti.createBlob(string text)` method
 */
var connectingSocket = null;

var hostField = Ti.UI.createTextField({
	value:'HOSTNAME',
	top:20,
	left:20,
	width:140,
	height:40,
	borderStyle:Ti.UI.INPUT_BORDERSTYLE_ROUNDED,
	autocorrect:false,
	autocapitalization:Ti.UI.TEXT_AUTOCAPITALIZATION_NONE,
	clearOnEdit:true
});
win.add(hostField);

var portField = Ti.UI.createTextField({
	value:'PORT',
	top:20,
	right:20,
	width:100,
	height:40,
	borderStyle:Ti.UI.INPUT_BORDERSTYLE_ROUNDED,
	autocorrect:false,
	autocapitalization:Ti.UI.TEXT_AUTOCAPITALIZATION_NONE,
	clearOnEdit:true
});
win.add(portField);

var writeArea = Ti.UI.createTextArea({
	editable:true,
	value:'Data to write',
	height:100,
	width:300,
	top:80,
	textAlign:'left',
	borderWidth:2,
	borderColor:'#bbb',
	borderRadius:5,
	suppressReturn:false	
});
win.add(writeArea);

var statusArea = Ti.UI.createTextArea({
	editable:false,
	value:'Socket status',
	height:100,
	width:300,
	bottom:80,
	textAlign:'left',
	borderWidth:2,
	borderColor:'#bbb',
	borderRadius:5,
	suppressReturn:false
});
win.add(statusArea);

var connectButton = Ti.UI.createButton({
	title:'Connect',
	width:80,
	height:40,
	left:20,
	bottom:20
});
connectButton.addEventListener('click', function() {
	if (connectingSocket == null) {
		try {
			connectingSocket = Ti.Network.createSocket({
				hostName:hostField.value,
				port:portField.value,
				type:Ti.Network.TCP,
				connected:function(e) {
					e.socket.write(Ti.createBlob("Well, hello there!"));
				},
				error:function(e) {
					statusArea.value = "ERROR ("+e.errorCode+"): "+e.error;
				},
				closed:function(e) {
					statusArea.value = "CLOSED CONNECTION TO: "+e.socket.host+":"+e.socket.port;
				},
				read:function(e) {
					statusArea.value = "DATA: "+e.data.toString();
				}
			});
			connectingSocket.connect();
		}
		catch (e) {
			statusArea.value = "EXCEPTION (connect): "+e.toString();
		}
	}
	else {
		statusArea.value = 'Already connected: '+connectingSocket.hostName +':'+connectingSocket.port;
	}
});
win.add(connectButton);

var disconnectButton = Ti.UI.createButton({
	title:'Disconnect',
	width:100,
	height:40,
	right:20,
	bottom:20
});
disconnectButton.addEventListener('click', function() {
	if (connectingSocket != null) {
		try {
			connectingSocket.close();
			connectingSocket = null;
		}
		catch (e) {
			statusArea.value = "EXCEPTION (close): "+e.toString();
		}
	}
	else {
		statusArea.value = 'Not connected';
	}
});
win.add(disconnectButton);

var writeButton = Ti.UI.createButton({
	title:'Write',
	width:80,
	height:40,
	bottom:20,
	left:110
});
writeButton.addEventListener('click', function() {
	if (connectingSocket != null && connectingSocket.state == Ti.Network.SOCKET_CONNECTED) {
		connectingSocket.write(Ti.createBlob(writeArea.value));
	}
});
win.add(writeButton);