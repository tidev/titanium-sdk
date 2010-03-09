var win = Titanium.UI.currentWindow;


// create table view data object
var data = [
	{title:'External URL', hasChild:true, url:'http://www.google.com'},
	{title:'Local URL', hasChild:true, url:'local_webview.html'},
	{title:'XHR to Filesystem', hasChild:true},	
	{title:'Image URL', hasChild:true, url:'http://www.appcelerator.com/wp-content/uploads/2010/01/TABWAVE_graph1.png'},
	{title:'Inline HTML', hasChild:true, innerHTML:'<html><body>Hello from inline HTML.</body></html>'},
	{title:'Logging and Unicode', hasChild:true, url:'webview_logging.html'},
	{title:'Local Eval', hasChild:true, url:'local_webview.html', evaljs:true},
	{title:'Inline HTML w/ Trans Bg', hasChild:true, innerHTML:'<html><body><div style="color:white;">Hello from inline HTML. You should see white text and black background</div></body></html>', bgcolor:'black'},
	{title:'Inline HTML w/ Color Bg', hasChild:true, innerHTML:'<html><body><div style="color:red;">Hello from inline HTML. You should see red text and yellow background</div></body></html>', bgcolor:'yellow'},
];

// add iphone specific tests
if (Titanium.Platform.name == 'iPhone OS')
{
	data.push({title:'Local HTML', hasChild:true, url:'local_webview.html', evalhtml:true});
	data.push({title:'Inline HTML w/ Border', hasChild:true, innerHTML:'<html><body><div>Hello from inline HTML. You should see red border</div></body></html>', border: true});
	data.push({title:'PDF URL', hasChild:true, url:'http://www.appcelerator.com/assets/The_iPad_App_Wave.pdf'});
	data.push({title:'SVG URL', hasChild:true, url:'http://upload.wikimedia.org/wikipedia/commons/5/55/1st_Cavalry_Division_-_Shoulder_Sleeve_Insignia.svg'});
	data.push({title:'Local Pinch/Zoom', hasChild:true, url:'local_webview_pinchzoom.html', scale:true});
}

// create table view
var tableview = Titanium.UI.createTableView({
	data:data
});

// create table view event listener
tableview.addEventListener('click', function(e)
{
	var rowdata = e.rowData;
	var w = Ti.UI.createWindow();
	w.orientationModes = [
		Titanium.UI.PORTRAIT,
		Titanium.UI.LANDSCAPE_LEFT,
		Titanium.UI.LANDSCAPE_RIGHT
	];

	var webview = Ti.UI.createWebView();

	// handle xhr to filesystem case first
	if (e.index == 2)
	{
		var xhr = Titanium.Network.createHTTPClient();

		xhr.onload = function()
		{
			var f = Titanium.Filesystem.getFile(Titanium.Filesystem.applicationDataDirectory,'test.html');
			f.write(this.responseText);
			webview.url = f.nativePath;
			w.add(webview);
			win.tab.open(w);
		};

		// open the client
		xhr.open('GET','http://www.google.com');
		
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
				toolbar.add(Ti.UI.createLabel({text: 'Click above to hide me'}))
				w.add(toolbar);
			}
		}


		w.add(webview);

		// hide toolbar for local web view
		Ti.App.addEventListener('webview_hidetoolbar', function(e)
		{
			Ti.API.info('received hidetoolbar event, foo = ' + e.foo)
			if (Titanium.Platform.name == 'iPhone OS') {
				w.setToolbar(null,{animated:true});
			} else {
				if (toolbar != null) {
					w.remove(toolbar);
				}
			}
		});
		webview.addEventListener('click', function()
		{
			Ti.API.info('RECEIVED CLICK ON WEBVIEW')
		})
		win.tab.open(w);		
	}

});

// add table view to the window
Titanium.UI.currentWindow.add(tableview);
