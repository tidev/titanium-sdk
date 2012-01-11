var win=Titanium.UI.currentWindow;

var l1 = Titanium.UI.createLabel({
	text:'UTF-8 GET',
	font:{fontSize:16,fontWeight:'bold'},
	top:10,
	width:300,
	left:10,
	height:'auto'
});
win.add(l1);

var l2 = Titanium.UI.createLabel({
	text:'Requesting...',
	font:{fontSize:13},
	top:40,
	left:10,
	width:300,
	height:'auto',
	color:'#888'
});
win.add(l2);

var l3 = Titanium.UI.createLabel({
	text:'Waiting for response...',
	font:{fontSize:13},
	top:70,
	left:10,
	width:300,
	height:'auto',
	color:'#888'
});
win.add(l3);


var closeButton = Ti.UI.createButton({
	title:'Close Window',
	height:40,
	width:300,
	top:110,
	left:10,
	font:{fontSize:20}
});

closeButton.addEventListener('click', function()
{
	win.close();
});

win.add(closeButton);

var xhr = Titanium.Network.createHTTPClient();

xhr.onload = function()
{
	l3.text = this.responseText;
};

xhr.onerror = function(e)
{
	l3.text = e.error;
};

// open the client
xhr.open('GET','http://www.fre100.com');

// send the data
xhr.send();
