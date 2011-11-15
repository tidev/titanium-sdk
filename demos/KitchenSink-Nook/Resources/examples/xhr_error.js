var win=Titanium.UI.currentWindow;

var l1 = Titanium.UI.createLabel({
	text:'UTF-8 GET',
	font:{fontSize:32,fontWeight:'bold'},
	top:10,
	width:300,
	left:10,
	height:'auto'
});
win.add(l1);

var l2 = Titanium.UI.createLabel({
	text:'Waiting for response...',
	font:{fontSize:24},
	top:60,
	left:10,
	width:300,
	height:'auto',
	color:'#999'
});
win.add(l2);

var xhr = Titanium.Network.createHTTPClient();

xhr.onload = function()
{
	l2.text = this.responseText;
};

xhr.onerror = function(e)
{
	l2.text = "Status: " + this.status + "\nError: " + e.error + "\nResponse: " + this.responseText; 
};

// open the client
xhr.open('GET','http://www.fre100.com');

// send the data
xhr.send();
