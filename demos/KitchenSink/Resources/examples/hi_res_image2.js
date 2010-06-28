var win = Ti.UI.currentWindow;

var image = Ti.UI.createImageView({
	image:"../images/dog.jpg",
	width:Ti.Platform.displayCaps.platformWidth,
	height:Ti.Platform.displayCaps.platformHeight-40
});

win.add(image);
