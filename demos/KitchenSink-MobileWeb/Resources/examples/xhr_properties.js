var win = Titanium.UI.currentWindow;

var label = Ti.UI.createLabel({
	top:50,
	color:'#777',
	height:'auto',
	width:300,
	font:{fontSize:15}
});
win.add(label);

var closeButton = Ti.UI.createButton({
	title:'Close Window',
	height:40,
	width:300,
	top:5,
	left:10,
	font:{fontSize:20}
});

closeButton.addEventListener('click', function()
{
	win.close();
});

win.add(closeButton);

var xhr = Titanium.Network.createHTTPClient();


label.text = 'status ' + xhr.status + '\n';
label.text += 'connected ' + xhr.connected + '\n';
label.text += 'readyState ' + xhr.readyState + '\n';
label.text += 'responseText ' + xhr.responseText + '\n';
label.text += 'responseXML ' + xhr.responseXML + '\n';
label.text += 'responseData ' + xhr.responseData + '\n';
label.text += 'connectionType ' + xhr.connectionType + '\n';
label.text += 'location ' + xhr.location + '\n';

var readyState = -1;
xhr.onload = function()
{
	label.text = 'status ' + xhr.status + '\n';
	label.text += 'connected ' + xhr.connected + '\n';
	label.text += 'readyState ' + xhr.readyState + '\n';
	label.text += 'responseText ' + xhr.responseText + '\n';
	label.text += 'responseXML ' + xhr.responseXML + '\n';
	label.text += 'responseData ' + xhr.responseData + '\n';
	label.text += 'connectionType ' + xhr.connectionType + '\n';
	label.text += 'location ' + xhr.location + '\n';
};

// open the client
xhr.open('GET','/data/The_iPad_App_Wave.pdf');

// send the data
xhr.send();
