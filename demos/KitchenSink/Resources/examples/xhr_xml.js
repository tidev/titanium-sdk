var xhr = Titanium.Network.createHTTPClient();

xhr.onload = function()
{
	Ti.API.info('twitter xml ' + this.responseXML + ' text ' + this.responseText);
	Ti.API.info("user node = "+this.responseXML.documentElement.getElementsByTagName("screen_name").item(0).nodeValue);
	var screenname = Ti.UI.createLabel({
		textAlign:'center',
		height:'auto',
		width:'auto',
		top:20,
		text:this.responseXML.documentElement.getElementsByTagName("screen_name").item(0).nodeValue
	});
	Ti.UI.currentWindow.add(screenname);
	
	var textarea = Ti.UI.createTextArea({borderRadius:5,borderWidth:2,borderColor:'#999',backgroundColor:'#111',color:'yellow',bottom:10,left:10,right:10,height:300,font:{fontFamily:'courier',fontSize:10}});
	textarea.value = this.responseText;
	Ti.UI.currentWindow.add(textarea);
};
// open the client
xhr.open('GET','http://twitter.com/statuses/show/123.xml');

// send the data
xhr.send();
