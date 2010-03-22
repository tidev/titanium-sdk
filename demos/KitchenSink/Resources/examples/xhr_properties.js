var win = Titanium.UI.currentWindow;

var label = Ti.UI.createLabel({
	top:10,
	color:'#777',
	height:'auto',
	width:300,
	font:{fontSize:15}
});
win.add(label);

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
xhr.ondatastream = function(e)
{
	if (xhr.readyState > readyState)
	{
		readyState = xhr.readyState;
		label.text = 'status ' + xhr.status + '\n';
		label.text += 'connected ' + xhr.connected + '\n';
		label.text += 'readyState ' + xhr.readyState + '\n';
		label.text += 'responseText ' + xhr.responseText + '\n';
		label.text += 'responseXML ' + xhr.responseXML + '\n';
		label.text += 'responseData ' + xhr.responseData + '\n';
		label.text += 'connectionType ' + xhr.connectionType + '\n';
		label.text += 'location ' + xhr.location + '\n';
	}

};

// open the client
xhr.open('GET','http://www.appcelerator.com/assets/The_iPad_App_Wave.pdf');

// send the data
xhr.send();
