//
//  When you open windows outside of tab groups, they are appear on top of either
//  the current window or the current tab group.  These examples show you different ways
//  to open windows outside of tab groups.
//

var win = Titanium.UI.currentWindow;

win.orientationModes = [
	Titanium.UI.PORTRAIT,
	Titanium.UI.LANDSCAPE_LEFT,
	Titanium.UI.LANDSCAPE_RIGHT
];
win.addEventListener('focus', function()
{
	Ti.API.info('FOCUSED EVENT RECEIVED');
});

//
//  OPEN WINDOW OUTSIDE OF TAB GROUP
//
var b1 = Titanium.UI.createButton({
	title:'Open (Plain)',
	width:250,
	height:50,
	top:10
});

b1.addEventListener('click', function()
{

	var w = Titanium.UI.createWindow({
		backgroundColor:'#336699'
	});

	// create a button to close window
	var b = Titanium.UI.createButton({
		title:'Close',
		height:30,
		width:150
	});
	w.add(b);
	b.addEventListener('click', function()
	{
		w.close();
	});

	w.open();
});

//
//  OPEN (ANIMATE FROM BOTTOM RIGHT)
//
var b2 = Titanium.UI.createButton({
	title:'Open (Animated)',
	width:250,
	height:50,
	top:70
});

b2.addEventListener('click', function()
{
	var options = {
			height:0,
			width:0,
			backgroundColor:'#336699',
			bottom:0,
			right:0
		};
	if (Ti.Platform.name == 'android') {
		options.navBarHidden = true;
	}
	var w = Titanium.UI.createWindow(options);
	var a = Titanium.UI.createAnimation();

	// NOTE: good example of making dynamic platform height / width values
	// iPad vs. iPhone vs Android etc.
	a.height = Titanium.Platform.displayCaps.platformHeight;
	a.width = Titanium.Platform.displayCaps.platformWidth;
	a.duration = 300;

	// create a button to close window
	var b = Titanium.UI.createButton({
		title:'Close',
		height:30,
		width:150
	});
	w.add(b);
	b.addEventListener('click', function()
	{
		a.height = 0;
		a.width = 0;
		w.close(a);
	});

	w.open(a);
});

//
//  OPEN (FULLSCREEN)
//
var b6 = Titanium.UI.createButton({
	title:'Open (Fullscreen)',
	width:250,
	height:50,
	top:130
});

b6.addEventListener('click', function()
{
	var w = Titanium.UI.createWindow({
		backgroundColor:'#336699'
	});

	// create a button to close window
	var b = Titanium.UI.createButton({
		title:'Close',
		height:30,
		width:150
	});
	w.add(b);
	b.addEventListener('click', function()
	{
		w.close();
	});

	w.open({fullscreen:true});
});

win.add(b1);
win.add(b2);
win.add(b6);




