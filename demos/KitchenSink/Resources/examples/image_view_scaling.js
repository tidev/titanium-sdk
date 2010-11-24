var win = Titanium.UI.currentWindow;

var imageView = Titanium.UI.createImageView({
	image:'http://www.appcelerator.com/wp-content/uploads/2009/06/titanium_desk.png'
});
	
win.add(imageView);

var l = Titanium.UI.createLabel({
	text:'',
	bottom:30,
	color:'#999',
	height:60,
	right: 10,
	left: 10,
	textAlign:'center'
});
win.add(l);

setTimeout(function() {
	// wait for URL to load
	var blob = imageView.toBlob();
	if (blob == null) {
		l.text = 'Unable to retrieve image dimensions. The image is a remote url -- are you connected to the network?';
	} else {
		l.text = blob.width + "x" + blob.height;
	}
}, 2000);


