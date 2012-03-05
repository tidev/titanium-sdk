var win = Titanium.UI.currentWindow;

var l = Titanium.UI.createLabel({
	text:'Downloading image...',
	font:{fontSize:13},
	top:30,
	left:10,
	width:300,
	color:'#888'
});
win.add(l);
var imageView = Titanium.UI.createImageView({
	top:50,
	left:10,
	height:100,
	width:125
});
win.add(imageView);

var closeButton = Ti.UI.createButton({
	title:'Close Window',
	height:40,
	width:300,
	top:160,
	left:10,
	font:{fontSize:20}
});

closeButton.addEventListener('click', function()
{
	win.close();
});

win.add(closeButton);

var xhr = Titanium.Network.createHTTPClient();

var _url = (Ti.Platform.isBrowser)?'images/titanium_desk.png':'http://developer.appcelerator.com/assets/img/DEV_titmobile_image.png';


xhr.onload = function()
{
	imageView.url = _url;
};

xhr.open('GET', _url);

// send the data
xhr.send();
