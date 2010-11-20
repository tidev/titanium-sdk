var win = Titanium.UI.currentWindow;

var flexSpace = Titanium.UI.createButton({
	systemButton:Titanium.UI.iPhone.SystemButton.FLEXIBLE_SPACE
});

var tf = Titanium.UI.createTextField({
	height:32,
	backgroundImage:'../images/inputfield.png',
	width:200,
	font:{fontSize:13},
	color:'#777',
	paddingLeft:10,
	borderStyle:Titanium.UI.INPUT_BORDERSTYLE_NONE
});

var camera = Titanium.UI.createButton({
	backgroundImage:'../images/camera.png',
	height:33,
	width:33
});
camera.addEventListener('click', function()
{
	Titanium.UI.createAlertDialog({title:'Toolbar',message:'You clicked camera!'}).show();
});

var send = Titanium.UI.createButton({
	backgroundImage:'../images/send.png',
	backgroundSelectedImage:'../images/send_selected.png',
	width:67,
	height:32
});
send.addEventListener('click', function()
{
	Titanium.UI.createAlertDialog({title:'Toolbar',message:'You clicked send!'}).show();
});


var textfield = Titanium.UI.createTextField({
	color:'#336699',
	value:'Focus to see keyboard w/ toolbar',
	height:35,
	width:300,
	top:10,
	borderStyle:Titanium.UI.INPUT_BORDERSTYLE_ROUNDED,
	keyboardToolbar:[flexSpace,camera, flexSpace,tf,flexSpace, send,flexSpace],
	keyboardToolbarColor: '#999',	
	keyboardToolbarHeight: 40
});

var textfield2 = Titanium.UI.createTextField({
	color:'#336699',
	value:'Focus to see keyboard w/o toolbar',
	height:35,
	width:300,
	top:70,
	borderStyle:Titanium.UI.INPUT_BORDERSTYLE_ROUNDED
});



win.add(textfield);
win.add(textfield2);


