function webviews(_args) {
	var isTizen = Titanium.Platform.name === 'TIZEN',
		win = Titanium.UI.createWindow({
			title:_args.title,
			backgroundColor:'#fff'
		});
	
	// create table view data object
	var data = [
		{title:'External URL', hasChild:true, url: isTizen? 'http://maps.google.co.nz/maps?q=-40,176%28Test%20Point%29&output=embed&t=h&z=15' : 'http://www.google.com'},
		{title:'Local URL', hasChild:true, url:'/etc/local_webview.html'},
		{title:'XHR to Filesystem', hasChild:true},	
		{title:'Image URL', hasChild:true, url:'https://evbdn.eventbrite.com/s3-s3/eventlogos/9947961/appceleratorlogo-1.png'},
		{title:'Inline HTML', hasChild:true, innerHTML:'<html><body>Hello from inline HTML.</body></html>'},
		{title:'Inline HTML w/ Trans Bg', hasChild:true, innerHTML:'<html><body><div style="color:white;">Hello from inline HTML. You should see white text and black background</div></body></html>', bgcolor:'black'},
		{title:'Inline HTML w/ Color Bg', hasChild:true, innerHTML:'<html><body><div style="color:red;">Hello from inline HTML. You should see red text and yellow background</div></body></html>', bgcolor:'yellow'},
		{title:'Basic Auth', hasChild: !isTizen, url: 'http://api.appcelerator.net/p/v1/basic-auth', username: 'user', password: 'foobar', touchEnabled: !isTizen},
		{title:'Logging and Unicode', hasChild:true, url:'/etc/webview_logging.html'}
	];
	
	// add iphone specific tests
	if (Titanium.Platform.name == 'iPhone OS')
	{
		data.push({title:'Local Eval', hasChild:true, url:'/etc/local_webview.html', evaljs:true});
		data.push({title:'Local HTML', hasChild:true, url:'/etc/local_webview.html', evalhtml:true});
		data.push({title:'Inline HTML w/ Border', hasChild:true, innerHTML:'<html><body><div>Hello from inline HTML. You should see red border</div></body></html>', border: true});
		data.push({title:'PDF URL', hasChild:true, url:'http://www.appcelerator.com/assets/The_iPad_App_Wave.pdf'});
		data.push({title:'SVG URL', hasChild:true, url:'http://upload.wikimedia.org/wikipedia/commons/5/55/1st_Cavalry_Division_-_Shoulder_Sleeve_Insignia.svg'});
		data.push({title:'Local image', hasChild:true, url:'/images/cloud.png'});
		data.push({title:'Local SVG', hasChild:true, url:'/images/insignia.svg'});
		data.push({title:'Local Pinch/Zoom', hasChild:true, url:'/etc/local_webview_pinchzoom.html', scale:true});
		data.push({title:'Webview controls', hasChild:true, url:'http://www.google.com', controls:true});
		// The result for this is going to be centered, because that's where layout puts it.
		// But users can make sure that embedded webviews are anchored in the usual way.
		data.push({title:'Auto Size', auto:true, hasChild:true, innerHTML:'<html><body style="height:200px;width:100px;border:1px solid #ccc;padding:10px">200 px height, 100 px width.</body></html>'});
		data.push({title:'Partial Auto', hasChild:true, partial:true, innerHTML:'<html><body><div>Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</div><hr/><div>Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</div></body></html>'});
		
		// this should work on android too, right?
		data.push({title:'HTML5 Video', auto:true, hasChild:true, url:'/etc/html5video.html'});
		
		// can't test youtube in simulator
		Ti.API.info('MODEL:'+Ti.Platform.model);
		if (Titanium.Platform.model !== 'Simulator')
		{
			Ti.include("/etc/version.js");
	
			if (isiOS6Plus())
			{
				data.push({title:'Youtube Video', auto:true, hasChild:true, url:'/etc/youtubeiOS6.html'});
			}
			else{
				data.push({title:'Youtube Video', auto:true, hasChild:true, url:'/etc/youtube.html'});
			}
		}
		
	}
	
	// create table view
	for (var i = 0; i < data.length; i++ ) { data[i].color = '#000'; data[i].font = {fontWeight:'bold'} };
	var tableview = Titanium.UI.createTableView({
		data:data
	});
	
	// create table view event listener
	tableview.addEventListener('click', function(e)
	{
		var rowdata = e.rowData;
		var webview = null;
		var w = Ti.UI.createWindow({
			title: e.rowData.title,
			activity : {
				onCreateOptionsMenu : function(e) {
					var menuItem = e.menu.add({ title : 'Reload' });
					menuItem.addEventListener('click', function(e) {
						webview.reload();
					});
				}
			}
		});
		w.orientationModes = [
			Titanium.UI.PORTRAIT,
			Titanium.UI.LANDSCAPE_LEFT,
			Titanium.UI.LANDSCAPE_RIGHT
		];
	
		if (rowdata.auto === true)
		{
			webview = Ti.UI.createWebView({height:Ti.UI.SIZE,width:Ti.UI.SIZE});
		}
		else
		{
			webview = Ti.UI.createWebView();
		}
		if ((Ti.Platform.osname === 'iphone') || (Ti.Platform.osname === 'ipad')) {
			var reloadButton = Titanium.UI.createButton({
				title:'Reload',
				style:Titanium.UI.iPhone.SystemButtonStyle.PLAIN
			});
			reloadButton.addEventListener('click',function() {
				webview.reload();
			});
			w.setRightNavButton(reloadButton);
		}
	
		//	webview.addEventListener('singletap', function(e)
		//	{
		//		alert('singletap');
		//	});
		//	handle xhr to filesystem case first
		if (e.index == 2)
		{
			w.add(webview);
			_args.containingTab.open(w);
			var xhr = Titanium.Network.createHTTPClient();
			var baseURL = 'http://www.google.com';
			xhr.onload = function()
			{
				webview.setHtml(this.responseText, { baseURL: baseURL });
			};
			
			// open the client
			xhr.open('GET',baseURL);
			
			// google will send back WAP if you make XHR request to it and he doesn't think it's really an HTML browser
			// we're going to spoof him to think we're Safari on iPhone
			xhr.setRequestHeader('User-Agent','Mozilla/5.0 (iPhone; U; CPU like Mac OS X; en) AppleWebKit/420+ (KHTML, like Gecko) Version/3.0 Mobile/1A537a Safari/419.3');
	
			// send the data
			xhr.send();   
		}
		else
		{
			//
			// handle other cases
			//
			if (rowdata.url)
			{
				webview.url = rowdata.url;
			}
			else
			{
				webview.html = rowdata.innerHTML;
			}
			if (rowdata.scale)
			{
				// override the default pinch/zoom behavior of local (or remote) webpages
				// and either allow pinch/zoom (set to true) or not (set to false)
				webview.scalesPageToFit = true;
			}
			
			if (rowdata.username)
			{
				webview.setBasicAuthentication(rowdata.username, rowdata.password);
			}
			
			// test out applicationDataDir file usage in web view
			var f1 = Titanium.Filesystem.getFile(Titanium.Filesystem.resourcesDirectory, 'images', 'apple_logo.jpg');
			var f2 = Titanium.Filesystem.getFile(Titanium.Filesystem.applicationDataDirectory,'apple_logo.jpg');
			f2.write(f1);
			
			webview.addEventListener('load',function(e)
			{
				Ti.API.debug("webview loaded: "+e.url);
				if (rowdata.evaljs)
				{
					alert("JS result was: "+webview.evalJS("window.my_global_variable")+". should be 10");
				}
				if (rowdata.evalhtml)
				{
					alert("HTML is: "+webview.html);
				}
				if (Titanium.Platform.osname === 'tizen') {
					Ti.App.addEventListener('image', function(d) {
						webview.evalJS('document.getElementById("image").src = "' + d.path + '";');
					});

					Ti.App.fireEvent('image', {path: f1.nativePath});
				} else {
					Ti.App.fireEvent('image', {path: f2.nativePath});
				}

			});
			if (rowdata.bgcolor)
			{
				webview.backgroundColor = rowdata.bgcolor;
			}
			if (rowdata.border)
			{
				webview.borderRadius=15;
				webview.borderWidth=5;
				webview.borderColor = 'red';
			}
			
			var toolbar = null;
			// create toolbar for local webiew
			if (e.index==1)
			{
				if (Titanium.Platform.name == 'iPhone OS') {
					// test hiding/showing toolbar with web view
					var button = Titanium.UI.createButton({
						title:'Click above to hide me'
					});
					w.setToolbar([button]);
				} else {
					toolbar = Titanium.UI.createView({backgroundColor: '#000',opacity:0.8,bottom:10,width:300,height:50,zIndex:1000});
					toolbar.add(Ti.UI.createLabel({text: 'Click above to hide me'}));
					w.add(toolbar);
				}
			}
			
			if (rowdata.controls)
			{
				// test web controls
				var bb2 = Titanium.UI.createButtonBar({
					labels:['Back', 'Reload', 'Forward'],
					backgroundColor:'#003'
				});
				var flexSpace = Titanium.UI.createButton({
					systemButton:Titanium.UI.iPhone.SystemButton.FLEXIBLE_SPACE
				});
				w.setToolbar([flexSpace,bb2,flexSpace]);
				webview.addEventListener('load',function(e)
				{
					Ti.API.debug("url = "+webview.url);
					Ti.API.debug("event url = "+e.url);
				});
				bb2.addEventListener('click',function(ce)
				{
					if (ce.index == 0)
					{
						webview.goBack();
					}
					else if (ce.index == 1)
					{
						webview.reload();
					}
					else
					{
						webview.goForward();
					}
				});
			}
			
			if (rowdata.partial)
			{
				webview.top = 100;
				webview.bottom = 0;
			}
			
			w.add(webview);
			
	
			function hideToolbar(e)
			{
				Ti.API.info('received hidetoolbar event, foo = ' + e.foo);
				if (Titanium.Platform.name == 'iPhone OS') {
					w.setToolbar(null,{animated:true});
				} else {
					if (toolbar != null) {
						w.remove(toolbar);
					}
				}
			}
			// hide toolbar for local web view
			Ti.App.addEventListener('webview_hidetoolbar', hideToolbar);

			w.addEventListener('close',function(e)
			{
				Ti.API.info("window was closed");
				
				// remove our global app event listener from this specific
				// window instance when the window is closed
				Ti.App.removeEventListener('webview_hidetoolbar',hideToolbar);
			});
			_args.containingTab.open(w);
		}
	
	});
	
	// add table view to the window
	win.add(tableview);
	return win;
};

module.exports = webviews;