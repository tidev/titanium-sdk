function screenshot() {
	// Test of Tizen-specific Titanium.Media.takeScreenshot.
	//Kitchen Sink path:  Phone - Screenshot
	//Take a screen-shot of a screen and put in the ImageView as image

	var win = Titanium.UI.createWindow();
	
	var imageView = Titanium.UI.createImageView({
		height:200,
		width:200,
		top:20,
		left:10,
		backgroundColor:'#999'
	});
	
	win.add(imageView);
	
	Titanium.Media.takeScreenshot(function(e)
	{
		// set blob on image view
		imageView.image = e.media;
		win.setBackgroundColor('red');
	
		var a = Titanium.UI.createAlertDialog();
	
		// set title
		a.setTitle('Screenshot');
	
		// set message
		a.setMessage('See screenshot of this page');
	
		// set button names
		a.setButtonNames(['OK']);
	
		// show alert
		a.show();
	});
	return win;
};

module.exports = screenshot;