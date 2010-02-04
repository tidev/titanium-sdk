var xhr = Titanium.Network.createHTTPClient();

xhr.onload = function()
{
	Titanium.UI.createAlertDialog({title:'Twitter XML Test', message:this.responseXML}).show();
	Ti.API.info('twiiter xml ' + this.responseXML + ' text ' + this.responseText);
};
// open the client
xhr.open('GET','http://twitter.com/statuses/show/123.xml');

// send the data
xhr.send();
