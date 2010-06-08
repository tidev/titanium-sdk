var win = Titanium.UI.currentWindow;

var imageView = Titanium.UI.createImageView({
	image:'http://www.appcelerator.com/wp-content/uploads/2009/06/titanium_desk.png',
	top:20,
	width:100,
	height:100
});

win.add(imageView);

var l = Titanium.UI.createLabel({
	text:'This is a remote image URL',
	bottom:30,
	color:'#999',
	height:20,
	width:300,
	textAlign:'center'
});
win.add(l);

