function buttonbar(_args) {
	var win = Ti.UI.createWindow({
		title:_args.title
	});
	
	//
	//  LABEL
	//
	var l = Titanium.UI.createLabel({
		text:'You have not clicked anything',
		color:'#777',
		font:{fontSize:13, fontFamily:'Helvetica Neue'},
		height:Ti.UI.SIZE,
		width:Ti.UI.SIZE
	});
	win.add(l);
	
	//
	// BASIC BUTTON BAR
	// 
	var bb1 = Titanium.UI.createButtonBar({
		labels:['One', 'Two', 'Three'],
		backgroundColor:'#336699',
		top:50,
		height:25,
		width:200
	});
	
	win.add(bb1);
	
	//
	// UPDATE LABELS AND DISPLAY BUTTON INDEX ON CLICK
	//
	var odd=true;
	bb1.addEventListener('click', function(e)
	{
		if (odd)
		{
			bb1.labels = ['Three','Four', 'Five'];
			odd=false;
		}
		else
		{
			bb1.labels = ['One','Two', 'Three'];
			odd=true;
		}
		l.text = 'You clicked index = ' + e.index;
	});
	
	//
	// TOOLBAR
	// 
	var bb2 = Titanium.UI.createButtonBar({
		labels:['One', 'Two', 'Three', 'Four', 'Five'],
		backgroundColor:'maroon'
	});
	var flexSpace = Titanium.UI.createButton({
		systemButton:Titanium.UI.iPhone.SystemButton.FLEXIBLE_SPACE
	});
	
	win.setToolbar([flexSpace,bb2,flexSpace]);
	
	bb2.addEventListener('click', function(e)
	{
		l.text = 'You clicked index = ' + e.index;
	});
	
	//
	// NAVBAR
	// 
	var bb3 = Titanium.UI.createButtonBar({
		labels:['One', 'Two'],
		backgroundColor:'#336699'
	});
	
	win.setRightNavButton(bb3);
	
	bb3.addEventListener('click', function(e)
	{
		l.text = 'You clicked index = ' + e.index;
	});
	
	
	//
	// CUSTOM BUTTON BAR
	// 
	var buttonObjects = [
		{title:'Toggle Style', width:110, enabled:false},
		{image:'/images/slider_thumb.png', width:50},
		{title:'Toggle Enabled', width:140}
	];
	var bb4 = Titanium.UI.createButtonBar({
		labels:buttonObjects,
		backgroundColor:'#000',
		top:100,
		height:40,
		width:Ti.UI.SIZE
	});
	
	win.add(bb4);
	bb4.addEventListener('click', function(e)
	{	
		// toggle enabled
	    if (e.index == 2)
		{
			buttonObjects[0].enabled = (buttonObjects[0].enabled === false)?true:false;
			bb4.labels = buttonObjects;		
		}
		l.text = 'You clicked index = ' + e.index;
	});
	
	return win;
}

module.exports = buttonbar;
