var win = Titanium.UI.currentWindow;

var ind=Titanium.UI.createProgressBar({
	width:200,
	height:50,
	min:0,
	max:1,
	value:0,
	style:Titanium.UI.iPhone.ProgressBarStyle.PLAIN,
	top:10,
	message:'Downloading PDFs File',
	font:{fontSize:12, fontWeight:'bold'},
	color:'#888'
});

win.add(ind);
ind.show();

var c = Titanium.Network.createHTTPClient();

var b1 = Titanium.UI.createButton({
	title:'Set Web View (url)',
	height:40,
	width:200,
	top:70
});
win.add(b1);
b1.addEventListener('click', function()
{

	c.onload = function()
	{
		var filename = Titanium.Platform.name == 'android' ? 'test.png' : 'test.pdf';
		var f = Titanium.Filesystem.getFile(Titanium.Filesystem.applicationDataDirectory,filename);
		f.write(this.responseData);
		var wv = Ti.UI.createWebView({
			url:f.nativePath,
			height:300,
			left:0,
			right:0,
			top:170
		});
		win.add(wv);
	};
	c.ondatastream = function(e)
	{
		ind.value = e.progress ;
		Ti.API.info('ONDATASTREAM1 - PROGRESS: ' + e.progress);
	}
	
	// open the client
	if (Titanium.Platform.name == 'android') {
		//android's WebView doesn't support embedded PDF content
		c.open('GET', 'http://www.appcelerator.com/wp-content/uploads/2009/06/titanium_desk.png');
	} else {
		c.open('GET','http://www.appcelerator.com/assets/The_iPad_App_Wave.pdf');
	}

	// send the data
	c.send();
	
});


var b2 = Titanium.UI.createButton({
	title:'Set Web View (data)',
	height:40,
	width:200,
	top:120
});
b2.addEventListener('click', function()
{

	c.onload = function()
	{
		var wv = Ti.UI.createWebView({
			data:this.responseData,
			height:300,
			left:0,
			right:0,
			top:170
		});
		win.add(wv);
	};
	c.ondatastream = function(e)
	{
		ind.value = e.progress ;
		Ti.API.info('ONDATASTREAM2 - PROGRESS: ' + e.progress);
	}

	// open the client
	if (Titanium.Platform.name == 'android') {
		//android's WebView doesn't support embedded PDF content
		c.open('GET', 'http://www.appcelerator.com/wp-content/uploads/2009/06/titanium_desk.png');
	} else {
		c.open('GET','http://www.appcelerator.com/assets/The_iPad_App_Wave.pdf');
	}

	// send the data
	c.send();
	
});
win.add(b2);

var abort = Titanium.UI.createButton({
	title:'Abort',
	height:40,
	width:200,
	top:170
});
win.add(abort);
abort.addEventListener('click', function()
{
	c.abort();
	
	alert("request aborted");
	
	c = Titanium.Network.createHTTPClient();
	ind.value = 0;
});
