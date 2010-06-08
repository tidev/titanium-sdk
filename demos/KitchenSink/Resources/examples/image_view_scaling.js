var win = Titanium.UI.currentWindow;

var imageView = Titanium.UI.createImageView({
	image:'http://www.appcelerator.com/wp-content/uploads/2009/06/titanium_desk.png'
});

win.add(imageView);

var l = Titanium.UI.createLabel({
	text:'',
	bottom:30,
	color:'#999',
	height:20,
	width:300,
	textAlign:'center'
});
win.add(l);

setTimeout(function() {
	// wait for URL to load
	var blob = imageView.toBlob();
	l.text = blob.width + "x" + blob.height;
}, 2000);


