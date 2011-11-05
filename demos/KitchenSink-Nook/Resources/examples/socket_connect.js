var win = Ti.UI.currentWindow;

var connectingSocket = null;

function pumpCallback(e) {
	if (e.bytesProcessed == -1) { // EOF
		statusArea.value = "<EOF> - Can't perform any more operations on connected socket";
	}
	else if (e.errorDescription == null || e.errorDescription == "") {
		statusArea.value = "DATA: "+e.buffer.toString();
	}
	else {
		statusArea.value = "READ ERROR: "+e.errorDescription;
	}
}

var hostLabel = Ti.UI.createLabel({
	text: 'Hostname:',
	left: 20,
	top: 25,
	font: {
		fontSize: 18,
		fontWeight: 'bold'	
	},
	width: 120
});
var hostField = Ti.UI.createTextField({
	value: 'www.appcelerator.com',
	top:20,
	left:130,
	right:20,
	height:40,
	borderStyle:Ti.UI.INPUT_BORDERSTYLE_ROUNDED,
	autocorrect:false,
	autocapitalization:Ti.UI.TEXT_AUTOCAPITALIZATION_NONE,
	clearOnEdit:true
});
win.add(hostLabel);
win.add(hostField);

var portLabel = Ti.UI.createLabel({
	text: 'Port:',
	left: 20,
	top: 70,
	font: {
		fontSize: 18,
		fontWeight: 'bold'	
	},
	width: 120
});
var portField = Ti.UI.createTextField({
	value:'80',
	top:70,
	left:130,
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
	height:200,
	left:130,
	right:20,
	top:120,
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
	top:330,
	height:200,
	left:130,
	right:20,
	textAlign:'left',
	borderWidth:2,
	borderColor:'#bbb',
	borderRadius:5,
	suppressReturn:false
});
win.add(statusArea);

var connectButton = Ti.UI.createButton({
	title:'Connect',
	width:120,
	height:50,
	left:20,
	bottom:20
});
connectButton.addEventListener('click', function() {
	if (connectingSocket == null) {
		try {
			connectingSocket = Ti.Network.Socket.createTCP({
				host:hostField.value,
				port:portField.value,
				connected:function(e) {
					e.socket.write(Ti.createBuffer({value:"Well, hello there!"}));
					Ti.Stream.pump(e.socket,pumpCallback,1024, true);
				},
				error:function(e) {
					statusArea.value = "ERROR ("+e.errorCode+"): "+e.error;
				},
				closed:function(e) {
					statusArea.value = "CLOSED CONNECTION TO: "+e.socket.host+":"+e.socket.port;
				}
			});
			connectingSocket.connect();
		}
		catch (e) {
			statusArea.value = "EXCEPTION (connect): "+e.toString();
		}
	}
	else {
		statusArea.value = 'Already created: '+connectingSocket.host +':'+connectingSocket.port;
	}
});
win.add(connectButton);

var disconnectButton = Ti.UI.createButton({
	title:'Disconnect',
	width:120,
	height:50,
	right:20,
	bottom:20
});
disconnectButton.addEventListener('click', function() {
	if (connectingSocket != null) {
		try {
			connectingSocket.close();
			connectingSocket = null;
			statusArea.value = 'Disconnected';
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
	width:120,
	height:50,
	bottom:20,
	left:150
});
writeButton.addEventListener('click', function() {
	if (connectingSocket != null && connectingSocket.isWritable()) {
		connectingSocket.write(Ti.createBuffer({value:writeArea.value}));
	}
});
win.add(writeButton);
