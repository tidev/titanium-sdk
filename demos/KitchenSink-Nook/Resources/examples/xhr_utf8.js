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

var l2 = Titanium.UI.createTextArea({
	value:'Waiting for response...',
	font:{fontSize:13},
	top:40,
	left:10,
	width:300,
	height:70,
	color:'#888',
	borderWidth:2,
	borderColor:'#bbb',
	borderRadius:5
});
win.add(l2);

var l3 = Titanium.UI.createLabel({
	text:'UTF-8 POST',
	font:{fontSize:16,fontWeight:'bold'},
	height:'auto',
	top:120,
	width:300,
	left:10
});
win.add(l3);

var l4 = Titanium.UI.createTextArea({
	value:'Waiting for response...',
	font:{fontSize:13},
	top:150,
	left:10,
	width:300,
	height:70,
	color:'#888',
	borderWidth:2,
	borderColor:'#bbb',
	borderRadius:5
});

win.add(l4);

var l5 = Titanium.UI.createLabel({
	text:'UTF-8 GET w/Query String',
	font:{fontSize:16,fontWeight:'bold'},
	top:230,
	height:'auto',
	width:300,
	left:10
});
win.add(l5);

var l6 = Titanium.UI.createTextArea({
	value:'Waiting for response...',
	font:{fontSize:13},
	top:260,
	left:10,
	width:300,
	height:70,
	color:'#888',
	borderWidth:2,
	borderColor:'#bbb',
	borderRadius:5
});
win.add(l6);
//
// XHR GET
//
var xhr = Titanium.Network.createHTTPClient();
xhr.onload = function()
{
	Ti.API.info('in utf-8 onload for GET');
	l2.value = this.responseText;
};
xhr.onerror = function()
{
	Ti.API.info('in utf-8 error for GET');
};
xhr.open("GET","http://api.appcelerator.net/p/v1/echo");
xhr.send({"a":"€漢字"});

//
// XHR POST
//
var xhr2 = Titanium.Network.createHTTPClient();
xhr2.onload = function()
{
	Ti.API.info('in utf-8 onload for POST');
	l4.value = this.responseText;
};
xhr2.onerror = function()
{
	Ti.API.info('in utf-8 error for POST');
};
xhr2.open("POST","http://api.appcelerator.net/p/v1/echo");
xhr2.send({"a":"€漢字", "b":"aöbäcüd"});

//
// XHR GET with Query String
//
var xhr3 = Titanium.Network.createHTTPClient();
xhr3.onload = function()
{
	Ti.API.info('in utf-8 onload for GET with QS');
	l6.value = this.responseText;
};
xhr3.onerror = function(e)
{
	Ti.API.info('in utf-8 error for GET with QS:' + e.error);
};
xhr3.open("GET","http://api.appcelerator.net/p/v1/echo?a=€漢字");
xhr3.send();
