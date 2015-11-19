function vibrate(_args) {
	var win = Titanium.UI.createWindow({
		title:_args.title,
		backgroundColor:'#336699'
	});
	// initialize to all modes
	win.orientationModes = [
		Titanium.UI.PORTRAIT,
		Titanium.UI.LANDSCAPE_LEFT,
		Titanium.UI.LANDSCAPE_RIGHT
	];
	var b1 = Titanium.UI.createButton({
		title:'Vibrate',
		height:40,
		width:300,
		top:10
	});
	
	win.add(b1);
	
	b1.addEventListener('click', function()
	{
		if(Ti.Platform.model != 'Kindle Fire'){
			//vibrate require a parameter
			Titanium.Media.vibrate([0, 1000]);
		}
		
	});
	return win;
};

module.exports = vibrate;