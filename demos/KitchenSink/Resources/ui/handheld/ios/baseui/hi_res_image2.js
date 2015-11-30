function hires_img2(_args) {
	var win = Ti.UI.createWindow({
		title:_args.title
	});
	
	var image = Ti.UI.createImageView({
		image:"/images/dog.jpg",
		width:Ti.Platform.displayCaps.platformWidth,
		height:Ti.Platform.displayCaps.platformHeight-40
	});
	
	win.add(image);
	return win;
};

module.exports = hires_img2;