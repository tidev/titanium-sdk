function xhr_error(_args) {
	var win=Titanium.UI.createWindow({
		title:_args.title
	});
	
	var l1 = Titanium.UI.createLabel({
		text:'UTF-8 GET',
		font:{fontSize:16,fontWeight:'bold'},
		top:10,
		width:300,
		left:10,
		height:Ti.UI.SIZE
	});
	win.add(l1);
	
	var l2 = Titanium.UI.createLabel({
		text:'Waiting for response...',
		font:{fontSize:13},
		top:40,
		left:10,
		width:300,
		height:Ti.UI.SIZE,
		color:'#888'
	});
	win.add(l2);
	
	var xhr = Titanium.Network.createHTTPClient();
	
	xhr.onload = function()
	{
		l2.text = this.responseText;
	};
	
	xhr.onerror = function(e)
	{
		l2.text = e.error;
	};
	
	// open the client
	xhr.open('GET','http://www.fre100.com');
	
	// send the data
	xhr.send();
	
	return win;
};

module.exports = xhr_error;
