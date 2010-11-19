var win = Titanium.UI.currentWindow;

var l = Titanium.UI.createLabel({
	text:'Downloading image...',
	font:{fontSize:13},
	top:10,
	left:10,
	width:300,
	color:'#888'
});
win.add(l);
var imageView = Titanium.UI.createImageView({
	top:50,
	left:10,
	height:100,
	width:80
});
win.add(imageView);

var xhr = Titanium.Network.createHTTPClient();

xhr.onload = function()
{
	var f = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory,'ti.png');
	f.write(this.responseData);
	imageView.url = f.nativePath;
};
// open the client (and test HTTPS)
xhr.open('GET','https://www.appcelerator.com/wp-content/uploads/2009/06/titanium_desk.png');

// send the data
xhr.send();
