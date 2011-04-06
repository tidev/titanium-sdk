var win = Titanium.UI.currentWindow;

var socket = Titanium.Network.createTCPSocket({
	hostName:Titanium.Network.INADDR_ANY, 
	port:40404, 
	mode:Titanium.Network.READ_WRITE_MODE
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

socket.addEventListener('read', function(e) {
	messageLabel.text = "I'm a reader!";
	readLabel.text = e['from'] + ':' + e['data'].text;
});

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
	    messageLabel.text = 'Opened!';
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
		messageLabel.text = 'Closed!';
	} catch (e) {
		messageLabel.text = 'Exception: '+e;
	}
});

var validButton = Titanium.UI.createButton({
	title:'Valid?',
	width:200,
	height:40,
	top:110
    });
win.add(validButton);
validButton.addEventListener('click', function() {
	// Display this value somewhere
	var valid = socket.isValid;
	messageLabel.text = 'Valid? '+valid;
    });

var writeButton = Titanium.UI.createButton({
	title:"Write 'Paradise Lost'",
	width:200,
	height:40,
	top:160
    });
win.add(writeButton);
writeButton.addEventListener('click', function() {
	try {
		var plFile = Titanium.Filesystem.getFile(Titanium.Filesystem.resourcesDirectory, 'paradise_lost.txt');
		var text = plFile.read();
	
		socket.write(text);
		messageLabel.text = "I'm a writer!";
	} catch (e) {
		messageLabel.text = 'Exception: '+e;
	}
});

// Cleanup
win.addEventListener('close', function(e) {
	if (socket.isValid) {
		socket.close();
	}
});