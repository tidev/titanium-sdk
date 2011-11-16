var win = Ti.UI.currentWindow;
win.backgroundColor = '#eee';

var label1 = Titanium.UI.createLabel({
	top:10,
	left:10,
	height: 30,
	width: 300,
	fontSize: 16,
	backgroundColor:'#AAA',
	text:'Network type: ' + Titanium.Network.networkType 
});

win.add(label1);

var label2 = Titanium.UI.createLabel({
	top:50,
	left:10,
	height: 30,
	width: 300,
	fontSize: 16,
	backgroundColor:'#AAA',
	text:'Network online: ' + Titanium.Network.online 
});

win.add(label2);

var label3 = Titanium.UI.createLabel({
	top:90,
	left:10,
	height: 30,
	width: 300,
	fontSize: 16,
	backgroundColor:'#AAA',
	text:'Event change: not fired'
});

win.add(label3);


Titanium.Network.addEventListener('change', function(e)
{
	var type = e.networkType;
	var online = e.online;
	label3.text = 'Change fired net type: ' + type + ' online: ' + online;
	label1.text = 'Network type: ' + type;
	label2.text = 'Network online: ' + online;
});

var URILabel = Ti.UI.createLabel({
	top: 130,
	left: 100,
	width: 120,
	height: 30,
	fontSize: 16,
	text: 'URI component'
});
win.add(URILabel);

var URIDecoded = Ti.UI.createTextField({
	top: 170,
	left: 10,
	width: 300,
	height: 30,
	fontSize: 16,
	backgroundColor: '#FFF',
	color: '#000',
	value: 'http://www.example.com?val="text"'
});

win.add(URIDecoded);

var encodeURIButton = Ti.UI.createButton({
	top: 210,
	left: 10,
	width: 300,
	height: 30,
	title: 'encode URI'
});

win.add(encodeURIButton);

var URIEncoded = Ti.UI.createTextField({
	top: 250,
	left: 10,
	width: 300,
	height: 30,
	fontSize: 16,
	backgroundColor:'#FFF',
	color: '#000'
});

win.add(URIEncoded);

var closeButton = Ti.UI.createButton({
	title:'Close Window',
	height:30,
	width:300,
	left:10,
	top:290,
	font:{fontSize:16}
});
win.add(closeButton);

closeButton.addEventListener('click', function(){
	win.close();
});

encodeURIButton.addEventListener('click',function(){
	URIEncoded.value = escape(URIDecoded.value);
});
