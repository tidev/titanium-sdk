function xhr_xml(_args) {
	var self = Ti.UI.createWindow({
		title:_args.title
	});
	var xhr = Titanium.Network.createHTTPClient();
	
	xhr.onload = function()
	{
		// Twitter does not offer an XML API any more.
		// This test has been modified to use, and display attributes from, a different XML file.

		Ti.API.info('www.w3schools.com/xml/note.xml ' + this.responseXML + ' text ' + this.responseText);

		var doc = this.responseXML.documentElement,
			elements = doc.getElementsByTagName("body"),
			body = elements.item(0);
		Ti.API.info("body = " + body.nodeValue);
		
		var bodyLabel = Ti.UI.createLabel({
			textAlign:'center',
			height:Ti.UI.SIZE,
			width:Ti.UI.SIZE,
			top:20,
			text:body.textContent
		});
		self.add(bodyLabel);		

		var textarea = Ti.UI.createTextArea({borderRadius:5,borderWidth:2,borderColor:'#999',backgroundColor:'#111',color:'yellow',bottom:10,left:10,right:10,height:300,font:{fontFamily:'courier',fontSize:10}});
		textarea.value = this.responseText;
		self.add(textarea);
	};

	xhr.onerror = function(e) {
		Ti.API.info('error:'+e.error);
	};
	
	// open the client
	xhr.open('GET', 'http://www.w3schools.com/xml/note.xml');
	
	// send the data
	xhr.send();
	
	return self;
};

module.exports = xhr_xml;