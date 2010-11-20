var win = Titanium.UI.currentWindow;

// initialize to all modes
win.orientationModes = [
	Titanium.UI.PORTRAIT,
	Titanium.UI.LANDSCAPE_LEFT,
	Titanium.UI.LANDSCAPE_RIGHT
]; 

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

// create and add toolbar
var toolbar1 = Titanium.UI.createToolbar({
	items:[flexSpace,camera, flexSpace,tf,flexSpace, send,flexSpace],
	bottom:0,
	borderTop:true,
	borderBottom:false,
	translucent:true,
	barColor:'#999'
});	
win.add(toolbar1);

var change = Titanium.UI.createButton({
	title:'Change Toolbar',
	style:Titanium.UI.iPhone.SystemButtonStyle.BORDERED		
});

var revert = Titanium.UI.createButton({
	title:'Revert Toolbar',
	style:Titanium.UI.iPhone.SystemButtonStyle.DONE		
});

//
//  Toolbar 2
//
var toolbar2 = Titanium.UI.createToolbar({
	items:[change,flexSpace,revert],
	top:130,
	borderTop:true,
	borderBottom:true,
	barColor:'#336699'
});

change.addEventListener('click', function()
{
	toolbar2.borderTop = false;
	toolbar2.borderBottom = false;
	toolbar2.translucent = true;
	toolbar2.barColor = '#000';
	toolbar2.width = 300;
	
	change.width = "160";
	change.title = "Change Toolbar (!)";
});

revert.addEventListener('click', function()
{
	toolbar2.borderTop = true;
	toolbar2.borderBottom = true;
	toolbar2.barColor = '#336699';
	toolbar2.width = null;
	
	change.width = 0; // 0 means auto
	change.title = "Change Toolbar";
});

win.add(toolbar2);