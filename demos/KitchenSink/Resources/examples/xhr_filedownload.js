var win = Titanium.UI.currentWindow;

var ind=Titanium.UI.createProgressBar({
	width:200,
	height:50,
	min:0,
	max:1,
	value:0,
	style:Titanium.UI.iPhone.ProgressBarStyle.PLAIN,
	top:10,
	message:'Downloading ' + (Ti.Platform.name == 'android' ? 'PNG' : 'PDF') + ' File',
	font:{fontSize:12, fontWeight:'bold'},
	color:'#888'
});

win.add(ind);
ind.show();


var b1 = Titanium.UI.createButton({
	title:'Set Web View (url)',
	height:40,
	width:200,
	top:70
});
win.add(b1);
var c = null;
b1.addEventListener('click', function()
{
	ind.value = 0;
	c = Titanium.Network.createHTTPClient();
	c.setTimeout(10000);
	c.onload = function()
	{
		Ti.API.info('IN ONLOAD ');

		var filename = Titanium.Platform.name == 'android' ? 'test.png' : 'test.pdf';
		var f = Titanium.Filesystem.getFile(Titanium.Filesystem.applicationDataDirectory,filename);
		if (Titanium.Platform.name == 'android') {
			f.write(this.responseData);
		}

		var wv = Ti.UI.createWebView({
			url:f.nativePath,
			bottom:0,
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
	};
	c.onerror = function(e)
	{
		Ti.API.info('XHR Error ' + e.error);
	};

	// open the client
	if (Titanium.Platform.name == 'android') {
		//android's WebView doesn't support embedded PDF content
		c.open('GET', 'http://www.appcelerator.com/wp-content/uploads/2009/06/titanium_desk.png');
	} else {
		c.open('GET','http://www.appcelerator.com/assets/The_iPad_App_Wave.pdf');
		c.file = Titanium.Filesystem.getFile(Titanium.Filesystem.applicationDataDirectory,'test.pdf');
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
	ind.value = 0;
	c = Titanium.Network.createHTTPClient();

	c.onload = function()
	{
		var wv = Ti.UI.createWebView({
			data:this.responseData,
			bottom:0,
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
	};

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

	c = Titanium.Network.createHTTPClient();
	ind.value = 0;
});

var largeFile = Titanium.UI.createButton({
	title:'Large File Download',
	height:40,
	width:200,
	top:220
});
win.add(largeFile);
largeFile.addEventListener('click', function()
{
	ind.value = 0;
	c = Titanium.Network.createHTTPClient();
	c.setTimeout(10000);
	c.onload = function(e)
	{
		Ti.API.info("ONLOAD = "+e);
	};
	c.ondatastream = function(e)
	{
		ind.value = e.progress ;
		Ti.API.info('ONDATASTREAM1 - PROGRESS: ' + e.progress);
	};
	c.onerror = function(e)
	{
		Ti.UI.createAlertDialog({title:'XHR', message:'Error: ' + e.error}).show();
	};

	c.open('GET','http://www.appcelerator.com/download-win32');
	c.send();
});
