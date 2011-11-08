var win = Titanium.UI.currentWindow;

var l = Titanium.UI.createLabel({
	text:'Downloading image...',
	font:{fontSize:24},
	top:10,
	left:10,
	width:300,
	color:'#999'
});
win.add(l);
var imageView = Titanium.UI.createImageView({
	top:70,
	//left:10,
	height:300,
	width:300
});
win.add(imageView);

var xhr = Titanium.Network.createHTTPClient();
xhr.onload = function()
{
	var f = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory,'ti.png');
	f.write(this.responseData);
	imageView.image = f.nativePath;
};
// open the client (and test HTTPS)
xhr.open("GET", "http://b.vimeocdn.com/ps/929/929705_300.jpg");

// send the data
xhr.send();
