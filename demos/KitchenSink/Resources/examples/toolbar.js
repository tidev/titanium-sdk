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
})
camera.addEventListener('click', function()
{
	Titanium.UI.createAlertDialog({title:'Toolbar',message:'You clicked camera!'}).show();
});

var send = Titanium.UI.createButton({
	backgroundImage:'../images/send.png',
	backgroundSelectedImage:'../images/send_selected.png',
	width:67,
	height:32,
});
send.addEventListener('click', function()
{
	Titanium.UI.createAlertDialog({title:'Toolbar',message:'You clicked send!'}).show();
});

// create and add toolbar
var toolbar1 = Titanium.UI.createToolbar({
	items:[flexSpace,camera, flexSpace,tf,flexSpace, send,flexSpace],
	top:30,
	borderTop:true,
	borderBottom:false,
	translucent:true,
	barColor:'#999',
	height:20
});	
win.add(toolbar1);

