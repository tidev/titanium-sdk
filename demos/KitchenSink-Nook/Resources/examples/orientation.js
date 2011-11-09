var win = Titanium.UI.currentWindow;
var buttonFont = {fontSize:18};

//
// SUPPORTED ORIENTATION MODES
//
//	Titanium.UI.PORTRAIT (1)
//	Titanium.UI.UPSIDE_PORTRAIT (2)
//	Titanium.UI.LANDSCAPE_LEFT (3)
//	Titanium.UI.LANDSCAPE_RIGHT (4)
//	Titanium.UI.FACE_UP (5)
//	Titanium.UI.FACE_DOWN (6)
//	Titanium.UI.UNKNOWN (7)
//

// initialize to all modes
win.orientationModes = [
	Titanium.UI.PORTRAIT,
	Titanium.UI.UPSIDE_PORTRAIT,
	Titanium.UI.LANDSCAPE_LEFT,
	Titanium.UI.LANDSCAPE_RIGHT,
	Titanium.UI.FACE_UP,
	Titanium.UI.FACE_DOWN
]; 


//
// helper function
//
function getOrientation(o)
{
	switch (o)
	{
		case Titanium.UI.PORTRAIT:
			return 'portrait';
		case Titanium.UI.UPSIDE_PORTRAIT:
			return 'reverse portrait';
		case Titanium.UI.LANDSCAPE_LEFT:
			return 'landscape';
		case Titanium.UI.LANDSCAPE_RIGHT:
			return 'reverse landscape';
		case Titanium.UI.FACE_UP:
			return 'face up';
		case Titanium.UI.FACE_DOWN:
			return 'face down';
		case Titanium.UI.UNKNOWN:
			return 'unknown';
	}
}

//
// get current orientation
//
var l = Titanium.UI.createLabel({
	color:'#999',
	text:'Current Orientation: ' + getOrientation(Titanium.Gesture.orientation),
	top:10,
	width:500,
	height:'auto',
	textAlign:'center',
	font: {
		fontSize: 24	
	}
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
	height:50,
	top:60,
	font: buttonFont
});
b1.addEventListener('click', function()
{
	Titanium.UI.orientation = Titanium.UI.LANDSCAPE_LEFT;
});
win.add(b1);

//
// set orientation - landscape portrait
//
var b2 = Titanium.UI.createButton({
	title:'Set Portrait',
	width:200,
	height:50,
	top:120,
	font: buttonFont
});
b2.addEventListener('click', function()
{
	win.orientationModes = [Titanium.UI.PORTRAIT];
});
win.add(b2);

var b3 = Titanium.UI.createButton({
	title:'Reset orientation',
	width:200,
	height:50,
	top:180,
	font: buttonFont
});
b3.addEventListener('click', function()
{
	Ti.API.info("resetting orientation modes");
	win.orientationModes = [];
});
win.add(b3);

//
// open a new window
//
var b4 = Titanium.UI.createButton({
	title:'Open A Window',
	width:200,
	height:50,
	top:300,
	font: buttonFont
});
b4.addEventListener('click', function()
{
	var subwin = Ti.UI.createWindow({
		//url:'vibrate.js',
		backgroundColor:'purple'
	});

	subwin.orientationModes = [ 
		Titanium.UI.PORTRAIT, 
		Titanium.UI.UPSIDE_PORTRAIT, 
		Titanium.UI.LANDSCAPE_LEFT, 
		Titanium.UI.LANDSCAPE_RIGHT, 
		Titanium.UI.FACE_UP, 
		Titanium.UI.FACE_DOWN
	];

	var close = Titanium.UI.createButton({
		title:'close',
		width:200,
		height:50,
		top:60,
 	    font: buttonFont
	});
	subwin.add(close);
	close.addEventListener('click', function()
	{
		if (Titanium.Platform.osname == 'android')
		{
			// reset the orientation modes on the parent to ensure the orientation gets reset on the previous window
			win.orientationModes = win.orientationModes;
		}
		subwin.close();
	});
	subwin.open();
});
win.add(b4);



