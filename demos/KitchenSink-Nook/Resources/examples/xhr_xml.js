var xhr = Titanium.Network.createHTTPClient();

xhr.onload = function()
{
	Ti.API.info('twitter xml ' + this.responseXML + ' text ' + this.responseText);
	var doc = this.responseXML.documentElement;
	var elements = doc.getElementsByTagName("screen_name");
	var screenName = elements.item(0);
	Ti.API.info("screenname = " + screenName.text);
	
	var screenname = Ti.UI.createLabel({
		textAlign:'center',
		height:'auto',
		width:'auto',
		top:20,
		text:screenName.text,
		font: {
			fontSize:24,
			fontWeight:'bold'	
		}
	});
	Ti.UI.currentWindow.add(screenname);
	
	var textarea = Ti.UI.createTextArea({borderRadius:5,borderWidth:2,borderColor:'#999',backgroundColor:'#111',color:'yellow',bottom:10,left:10,right:10,top:60,font:{fontFamily:'courier',fontSize:18}});
	textarea.value = this.responseText;
	Ti.UI.currentWindow.add(textarea);
};
// open the client
xhr.open('GET','http://twitter.com/statuses/show/123.xml');

// send the data
xhr.send();
