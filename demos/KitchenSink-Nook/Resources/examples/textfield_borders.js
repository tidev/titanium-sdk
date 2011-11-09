var win = Titanium.UI.currentWindow;

win.orientationModes = [
	Titanium.UI.PORTRAIT,
	Titanium.UI.UPSIDE_PORTRAIT,
	Titanium.UI.LANDSCAPE_LEFT,
	Titanium.UI.LANDSCAPE_RIGHT
]; 

var tf5 = Titanium.UI.createTextField({
	//hintText:'custom background image',
	height:70,
	width:500,
	top:190,
	//backgroundImage:'../images/inputfield.png',
	paddingLeft:80,
	//left:60,
	//right:60,
	//font:{fontSize:30},
	//color:'#777',
	//clearOnEdit:true
});

win.add(tf5);