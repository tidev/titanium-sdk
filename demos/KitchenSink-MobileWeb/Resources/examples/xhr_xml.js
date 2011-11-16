var xhr = Titanium.Network.createHTTPClient();

xhr.onload = function()
{
	var closeButton = Ti.UI.createButton({
		title:'Close Window',
		height:30,
		width:300,
		top:10,
		left:10,
		font:{fontSize:15}
	});

	closeButton.addEventListener('click', function()
	{
		Ti.UI.currentWindow.close();
	});

	Ti.UI.currentWindow.add(closeButton);

	Ti.API.info('twitter xml ' + xhr.responseXML + ' text ' + xhr.responseText);
	var doc = xhr.responseXML.documentElement;
	var elements = doc.getElementsByTagName("screen_name");
	var screenName = elements.item(0);
	Ti.API.info("screenname = " + screenName.textContent);
	
	var screenname = Ti.UI.createLabel({
		textAlign:'center',
		height:'auto',
		width:'300',
		left:10,
		top:50,
		text:screenName.textContent
	});
	Ti.UI.currentWindow.add(screenname);
	
	var textarea = Ti.UI.createTextArea({
		borderRadius:5,
		borderWidth:2,
		borderColor:'#999',
		backgroundColor:'#111',
		color:'yellow',
		top:70,
		left:10,
		width: 300,
		height: 250,
		font:{fontFamily:'courier',fontSize:10}}
	);
	
	textarea.value = xhr.responseText;
	Ti.UI.currentWindow.add(textarea);
	
};
// open the client

if (Ti.Platform.isBrowser) {
		xhr.open('GET','/data/123.xml');
	} else {
		xhr.open('GET','http://twitter.com/statuses/show/123.xml');	
	}

// send the data
xhr.send();
