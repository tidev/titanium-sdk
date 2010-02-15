var win = Titanium.UI.currentWindow;

var scrolly = Titanium.UI.createScrollView({contentHeight:'auto'});
win.add(scrolly);

var tf1 = Titanium.UI.createTextField({
	value:'rounded border',
	height:35,
	top:10,
	left:10,
	width:250,
	borderStyle:Titanium.UI.INPUT_BORDERSTYLE_ROUNDED
});

scrolly.add(tf1);

var tf2 = Titanium.UI.createTextField({
	value:'bezel border',
	height:35,
	top:55,
	left:10,
	width:250,
	borderStyle:Titanium.UI.INPUT_BORDERSTYLE_BEZEL
});

scrolly.add(tf2);

var tf3 = Titanium.UI.createTextField({
	value:'line border',
	height:35,
	top:100,
	left:10,
	width:250,
	borderStyle:Titanium.UI.INPUT_BORDERSTYLE_LINE
});

scrolly.add(tf3);

var tf4 = Titanium.UI.createTextField({
	value:'no border',
	height:35,
	top:145,
	left:10,
	width:250,
	borderStyle:Titanium.UI.INPUT_BORDERSTYLE_NONE
});

scrolly.add(tf4);

var tf5 = Titanium.UI.createTextField({
	hintText:'custom background image',
	height:32,
	top:190,
	backgroundImage:'../images/inputfield.png',
	paddingLeft:10,
	left:10,
	width:250,
	font:{fontSize:13},
	color:'#777',
	clearOnEdit:true
});

scrolly.add(tf5);