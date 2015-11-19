	// attempt to simulate a changing of image on toolbar
function image_view_toolbar(_args) {
	var win = Ti.UI.createWindow({
		title:_args.title
	});

	
	var flexSpace = Titanium.UI.createButton({
		systemButton:Titanium.UI.iPhone.SystemButton.FLEXIBLE_SPACE
	});
	
	
	var button1 = Ti.UI.createImageView({
		height:33,
		width:33,
		image:'/images/camera.png'
	});
	
	var button2 = Ti.UI.createImageView({
		height:33,
		width:33,
		image:'/images/camera.png'
	});
	
	
	var textview = Ti.UI.createTextArea({
		top:10,
		value:"just focus here for keyboard\n\nClick on the left button and it should change\nbut not move",
		keyboardToolbar:[flexSpace,button1,button2],
		keyboardToolbarColor: '#999',	
		keyboardToolbarHeight: 40
	});
	
	win.add(textview);
	
	button1.addEventListener('click',function()
	{
		button1.image = '/images/apple_logo.jpg';
	});
	return win;
};

module.exports = image_view_toolbar;