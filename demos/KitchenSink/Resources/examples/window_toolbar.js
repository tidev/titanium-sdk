// current window
var win = Titanium.UI.currentWindow;

//
// SINGLE BUTTON ON LEFT
//
var b1 = Titanium.UI.createButton({
	title:'One Button - Left',
	width:200,
	height:40,
	top:10
});
b1.addEventListener('click', function()
{
	var b = Titanium.UI.createButton({
		title:'Button',
		style:Titanium.UI.iPhone.SystemButtonStyle.BORDERED,
		enabled:false
	});
	b.enabled = false;
	win.setToolbar([b]);
})
win.add(b1);

//
// SET BUTTON ON RIGHT
//
var b2 = Titanium.UI.createButton({
	title:'One Button - Right',
	width:200,
	height:40,
	top:60
});
b2.addEventListener('click', function()
{
	var b = Titanium.UI.createButton({
		title:'Button',
		style:Titanium.UI.iPhone.SystemButtonStyle.DONE		
	});
	var flexSpace = Titanium.UI.createButton({
		systemButton:Titanium.UI.iPhone.SystemButton.FLEXIBLE_SPACE
	});
	win.setToolbar([flexSpace,b]);
})
win.add(b2);

//
// SET BUTTON IN MIDDLE
//
var b3 = Titanium.UI.createButton({
	title:'One Button - MIDDLE',
	width:200,
	height:40,
	top:110
});
b3.addEventListener('click', function()
{
	var b = Titanium.UI.createButton({
		title:'Button',
		style:Titanium.UI.iPhone.SystemButtonStyle.DONE		
	});
	var flexSpace = Titanium.UI.createButton({
		systemButton:Titanium.UI.iPhone.SystemButton.FLEXIBLE_SPACE
	});
	win.setToolbar([flexSpace,b,flexSpace]);
})
win.add(b3);

//
// FIXED SPACE BUTTONs
//
var b4 = Titanium.UI.createButton({
	title:'Fixed Space',
	width:200,
	height:40,
	top:160
});
b4.addEventListener('click', function()
{
	var a = Titanium.UI.createButton({
		title:'Left',
		width:75,
		style:Titanium.UI.iPhone.SystemButtonStyle.BORDERED		
	});
	var b = Titanium.UI.createButton({
		title:'Right',
		width:75,
		style:Titanium.UI.iPhone.SystemButtonStyle.BORDERED		
	});
	var flexSpace = Titanium.UI.createButton({
		systemButton:Titanium.UI.iPhone.SystemButton.FLEXIBLE_SPACE
	});
	var fixedSpace = Titanium.UI.createButton({
		systemButton:Titanium.UI.iPhone.SystemButton.FIXED_SPACE,
		width:50
	});
	win.setToolbar([flexSpace,a,fixedSpace,b,flexSpace]);
})
win.add(b4);

//
// HIDE TOOLBAR
//
var b5 = Titanium.UI.createButton({
	title:'Hide Toolbar',
	width:200,
	height:40,
	top:210
});
b5.addEventListener('click', function()
{
	win.setToolbar(null,{animated:true});
})
win.add(b5);



