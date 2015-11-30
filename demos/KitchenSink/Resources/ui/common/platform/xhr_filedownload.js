function xhr_download(_args) {
	var win = Titanium.UI.createWindow({
			title:_args.title
		}),
		isAndroid = Ti.Platform.name === 'android',
		isTizen = Titanium.Platform.osname === 'tizen',	
		ind = Titanium.UI.createProgressBar({
			width:200,
			height:50,
			min:0,
			max:1,
			value:0,
			top:10,

			// iOS can display PDFs, Android can display PNGs, but Tizen can display neither, because
			// it's MobileWeb-based, and MobileWeb can neither show PDFs nor reliably work with binary
			// content. Therefore, Tizen will download and show HTML.
			message:'Downloading ' + (isAndroid || isTizen ? 'PNG' : 'PDF') + ' File',
			font:{fontSize:12, fontWeight:'bold'},
			color:'#888'
		});

	Ti.Platform.name === 'iPhone' && (ind.style = Titanium.UI.iPhone.ProgressBarStyle.PLAIN);

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
		var filename = (isAndroid || isTizen) ? 'test.png' : 'test.pdf';

		ind.value = 0;
		c = Titanium.Network.createHTTPClient();
		c.setTimeout(10000);

		c.onload = function()
		{
			Ti.API.info('IN ONLOAD ');
			ind.value = 1.0;
			var f = Titanium.Filesystem.getFile(Titanium.Filesystem.applicationDataDirectory, filename);
			isAndroid && f.write(this.responseData);

			// WebView does`t work with HTML5-based files on Tizen/MobileWeb, only url to files on Tizen`s device or web.    
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
		if (isAndroid) {
			// android's WebView doesn't support embedded PDF content
			c.open('GET', 'http://developer.appcelerator.com/blog/wp-content/themes/newapp/images/appcelerator_avatar.png?s=48');
		} else if (isTizen) {
			c.open('GET','https://mobile.twitter.com/session/new');
			// Property "file" is path to file. It is not object "file".
			// See documentation about Titanium.Network.HTTPClient
			c.file = filename; 
		} else {
			c.open('GET','http://www.appcelerator.com/assets/The_iPad_App_Wave.pdf');
			c.file = Titanium.Filesystem.getFile(Titanium.Filesystem.applicationDataDirectory, filename);
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
		isTizen && (ind.message = 'Downloading png File');
		
		c = Titanium.Network.createHTTPClient();

		c.onload = function()
		{
			var data;
			// Android only supports data of html-string
			if (isAndroid) {
				var text = "<img src=\"data:image/png;base64," + this.responseData.toBase64() + "\" />";
				var f = Titanium.Filesystem.getFile(Titanium.Filesystem.applicationDataDirectory, "test.html");
				f.write(text);
				data = f.read();
			} else if (isTizen) {
				// Unlinke Android, Tizen does not have the undocumented function "this.responseData.toBase64()".
				// Anyway, the test file is an HTML file, and does not require base64 treatment before it can
				// be output to the screen, in order to verify the file download functionality.
				var text = "<img src=\"" + this.responseData + "\" />",
					f = Titanium.Filesystem.getFile(Titanium.Filesystem.applicationDataDirectory, "test.html");

				f.write(text);
				data = f.read();
			} else {
				data = this.responseData;
			}

			var wv = Ti.UI.createWebView({
				data:data,
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
		if (isAndroid || isTizen) {
			// android's WebView doesn't support embedded PDF content
			c.open('GET', 'http://developer.appcelerator.com/blog/wp-content/themes/newapp/images/appcelerator_avatar.png?s=48');
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
		// Prevent crash if the user clicks "abort" before clicking other buttons
		c && c.abort();
	
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
		
		c.open('GET','http://titanium-studio.s3.amazonaws.com/latest/Titanium_Studio.exe');
		ind.message = 'Downloading large file';
		if (isTizen) {
			// Property "file" is a path to a file. It is not an object of the type "File".
			// See documentation about Titanium.Network.HTTPClient
			c.file = 'tiStudio.exe';
		} else {
			c.file = Titanium.Filesystem.getFile(Titanium.Filesystem.applicationDataDirectory, 'tiStudio.exe');
		}
		c.send();
	});
	
	return win;
};

module.exports = xhr_download;