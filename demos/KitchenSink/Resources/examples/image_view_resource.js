var IMAGE = "../images/cloud2.png";
var ACTUAL = "Resources/android/images/medium/cloud2.png";

var win = Titanium.UI.currentWindow;

var imageView = Titanium.UI.createImageView({
	image:IMAGE
});

win.add(imageView);

var l = Titanium.UI.createLabel({
	text:"You should see a cloud image above. It's loaded using the path '" + IMAGE + "' but actually resides in '" + ACTUAL + "'",
	bottom:30,
	color:'#999',
	height:'auto',
	width:300,
	textAlign:'center'
});
win.add(l);

