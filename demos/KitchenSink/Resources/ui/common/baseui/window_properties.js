function win_props(_args) {
	// current window
	var win = Titanium.UI.createWindow({
		title:_args.title
	});
	
	//
	// BACKGROUND COLOR
	//
	var button = Titanium.UI.createButton({
		title:'Change BG Color',
		width:220,
		height:40,
		top:10
	});
	button.addEventListener('click', function()
	{
		win.backgroundImage = null;
		win.backgroundColor = '#336699';
	});
	win.add(button);
	
	//
	// BACKGROUND IMAGE
	//
	var buttonImage = Titanium.UI.createButton({
		title:'Change BG Image',
		width:220,
		height:40,
		top:60
	});
	buttonImage.addEventListener('click', function()
	{
		win.backgroundImage = '/images/bg.png';
	});
	win.add(buttonImage);
	
	//
	// TOGGLE WIDTH AND HEIGHT 
	//
	var buttonWidthHeight = Titanium.UI.createButton({
		title:'Toggle Height/Width',
		width:220,
		height:40,
		top:110
	});
	var full=true;
	var oldColor = null;
	buttonWidthHeight.addEventListener('click', function()
	{
		Ti.API.info('in width height');
		if (full)
		{
			oldColor = win.backgroundColor;
			win.height = 300;
			win.width = 300;
			win.backgroundColor = 'black';
			full=false;
		}
		else
		{
			// unset them to go back to previous layout
			win.height = null;
			win.width = null;
			win.backgroundColor = oldColor;
			full=true;
		}
	});
	win.add(buttonWidthHeight);
	
	
	
	//
	// TOGGLE OPACITY PROPERTY
	//
	var buttonOpacity = Titanium.UI.createButton({
		title:'Toggle Opacity',
		width:220,
		height:40,
		top:160
	});
	var opacity=true;
	buttonOpacity.addEventListener('click', function()
	{
		if (opacity)
		{
			win.opacity = 0.7;
			opacity=false;
		}
		else
		{
			win.opacity = 1.0;
			opacity=true;
		}
	});
	win.add(buttonOpacity);
	
	//
	// TOGGLE BORDER PROPERTIES
	//
	var buttonBorder = Titanium.UI.createButton({
		title:'Toggle Border Properties',
		width:220,
		height:40,
		top:210
	});
	var border=true;
	buttonBorder.addEventListener('click', function()
	{
		if (border)
		{
			win.borderWidth = 5;
			win.borderColor = '#999';
			win.borderRadius = 10;
			border=false;
		}
		else
		{
			win.borderWidth = 0;
			win.borderColor = null;
			win.borderRadius = 0;
			border=true;
		}
	});
	
	// add iphone specific tests
	if (Titanium.Platform.name == 'iPhone OS')
	{
		win.add(buttonBorder);
	}
	
	return win;
};

module.exports = win_props;