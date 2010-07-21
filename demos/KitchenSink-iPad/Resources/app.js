Ti.include( 'split_view_nav.js','split_view_plain.js', 'nav_controller.js','main_tests.js' );

var win = Ti.UI.createWindow();

var l = Ti.UI.createLabel({
	text:'Split Views cannot be closed, so if you run any of the first 3 tests, you will have to re-start the app.', 
	color:'#888',
	font:{fontSize:20},
	height:'auto',
	width:'auto',
	left:20,
	right:20,
	top:10
});
win.add(l);

var b1 = Ti.UI.createButton({
	title:'Open Main Tests',
	width:300,
	height:50,
	top:100
});
b1.addEventListener('click', function()
{
	MainTests.open();
});
win.add(b1);

var b2 = Ti.UI.createButton({
	title:'Split View - Plain',
	width:300,
	height:50,
	top:170
});
b2.addEventListener('click', function()
{
	SplitViewPlain.open();
});
win.add(b2);

var b3 = Ti.UI.createButton({
	title:'Split View w/Nav Group',
	width:300,
	height:50,
	top:240
});
b3.addEventListener('click', function()
{
	SplitViewNav.open();
});
win.add(b3);

var b4 = Ti.UI.createButton({
	title:'Nav Group (Standalone)',
	width:300,
	height:50,
	top:310
});
b4.addEventListener('click', function()
{
	NavController.open();
});
win.add(b4);

var b5= Ti.UI.createButton({
	title:'Fixed Orientation',
	width:300,
	height:50,
	top:310
});
b5.addEventListener('click', function()
{
	var w = Ti.UI.createWindow({backgroundColor:'#fff'});
	var l = Ti.UI.createLabel({text:'I should only be in Landscape'});
	w.add(l);
	w.orientationModes = [
		Titanium.UI.LANDSCAPE_LEFT,
		Titanium.UI.LANDSCAPE_RIGHT,
	];
	w.open();
});
win.add(b5);
win.open();