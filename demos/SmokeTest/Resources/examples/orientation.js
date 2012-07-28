var win = Titanium.UI.currentWindow;

//
// SUPPORTED WINDOW ORIENTATION MODES
//
//	Titanium.UI.PORTRAIT (1)
//	Titanium.UI.UPSIDE_PORTRAIT (2)
//	Titanium.UI.LANDSCAPE_LEFT (3)
//	Titanium.UI.LANDSCAPE_RIGHT (4)

//
//	ADDITIONAL TI GESTURE ORIENTATION MODES
//	Titanium.UI.FACE_UP (5)
//	Titanium.UI.FACE_DOWN (6)
//	Titanium.UI.UNKNOWN (7) (Occurs only during application startup)
//

// initialize to all modes
win.orientationModes = [
	Titanium.UI.PORTRAIT,
	Titanium.UI.UPSIDE_PORTRAIT,
	Titanium.UI.LANDSCAPE_LEFT,
	Titanium.UI.LANDSCAPE_RIGHT,
]; 


//
// helper function
//
function getOrientation(o)
{
	switch (o)
	{
		case Titanium.UI.PORTRAIT:
		{
			return 'portrait';
		}
		case Titanium.UI.UPSIDE_PORTRAIT:
		{
			return 'upside portrait';
		}
		case Titanium.UI.LANDSCAPE_LEFT:
		{
			return 'landscape left';
		}
		case Titanium.UI.LANDSCAPE_RIGHT:
		{
			return 'landscape right';
		}
		case Titanium.UI.FACE_UP:
		{
			return 'face up';
		}
		case Titanium.UI.FACE_DOWN:
		{
			return 'face down';
		}
		case Titanium.UI.UNKNOWN:
		{
			return 'unknown';
		}
	}
}

//
// get current orientation
//
var l = Titanium.UI.createLabel({
	color:'#999',
	text:'Current Orientation: ' + getOrientation(Titanium.Gesture.orientation),
	top:10,
	width:300,
	height:'auto',
	textAlign:'center'
});
win.add(l);

//
// orientation change listener
//
Ti.Gesture.addEventListener('orientationchange',function(e)
{
	// device orientation
	l.text = 'Current Orientation: ' + getOrientation(Titanium.Gesture.orientation);
	
	// get orienation from event object
	var orientation = getOrientation(e.orientation);
	
	Titanium.API.info("orientation changed = "+orientation+", is portrait?"+e.source.isPortrait()+", orientation = "+Ti.Gesture.orientation + "is landscape?"+e.source.isLandscape());
});


//
// set orientation - landscape 
//
var b1 = Titanium.UI.createButton({
	title:'Set Landscape ',
	width:200,
	height:40,
	top:40
});
win.add(b1);

b1.addEventListener('click', function()
{
	Titanium.UI.orientation = Titanium.UI.LANDSCAPE_LEFT;
});

//
// set orientation - landscape portrait
//
var b2 = Titanium.UI.createButton({
	title:'Set Portrait',
	width:200,
	height:40,
	top:90
});
win.add(b2);

b2.addEventListener('click', function()
{
	Titanium.UI.orientation = Titanium.UI.PORTRAIT;
});



var landscape = Titanium.UI.createButton({
	title:'Allow Landscape Only',
	width:200,
	height:40,
	top:140
});
landscape.addEventListener('click', function()
{
	// set and enforce landscape for this window
	win.orientationModes = [
		Titanium.UI.LANDSCAPE_LEFT,
		Titanium.UI.LANDSCAPE_RIGHT
	]; 
	Titanium.UI.orientation = Titanium.UI.LANDSCAPE_LEFT;
});

//
// open a new window
//
var b3 = Titanium.UI.createButton({
	title:'Open A Window',
	width:200,
	height:40,
	top:190
});
win.add(b3);

b3.addEventListener('click', function()
{
	var win = Ti.UI.createWindow({
		url:'vibrate.js',
		backgroundColor:'purple'
	});
	
	win.orientationModes = [ 
		Titanium.UI.PORTRAIT, 
		Titanium.UI.UPSIDE_PORTRAIT, 
		Titanium.UI.LANDSCAPE_LEFT, 
		Titanium.UI.LANDSCAPE_RIGHT, 
	];
	
	var close = Titanium.UI.createButton({
		title:'close',
		width:200,
		height:40,
		top:60
	});
	win.add(close);
	close.addEventListener('click', function()
	{
		win.close();
	});
	win.open();
});
win.add(landscape);


