var win = Ti.UI.currentWindow;

win.orientationModes = [
	Titanium.UI.PORTRAIT,
	Titanium.UI.UPSIDE_PORTRAIT,
	Titanium.UI.LANDSCAPE_LEFT,
	Titanium.UI.LANDSCAPE_RIGHT
]; 

var scrollview = Ti.UI.createScrollView({
	contentWidth:'auto',
	contentHeight:'auto',
	top:0,
	showVerticalScrollIndicator:true,
	showHorizontalScrollIndicator:false
});

var tf1 = Ti.UI.createTextField({
	width:200,
	height:100,
	top:0,
	value:'top',
	borderStyle:Titanium.UI.INPUT_BORDERSTYLE_ROUNDED
});
scrollview.add(tf1);

var tf2 = Ti.UI.createTextField({
	width:200,
	height:100,
	top:500,
	value:'middle',
	borderStyle:Titanium.UI.INPUT_BORDERSTYLE_ROUNDED
});
scrollview.add(tf2);

var tf3 = Ti.UI.createTextField({
	width:200,
	height:100,
	top:900,
	value:'bottom',
	borderStyle:Titanium.UI.INPUT_BORDERSTYLE_ROUNDED
});
scrollview.add(tf3);

win.add(scrollview);