var label = Titanium.UI.createLabel({
	text:'This test decorates a window pre-open',
	top:10,
	width:'auto',
	height:'auto'
});
Titanium.UI.currentWindow.add(label);

var button = Titanium.UI.createButton({
	title:'Open new window',
	top:40,
	height:40,
	width:200
});
Titanium.UI.currentWindow.add(button);

button.addEventListener('click', function(e)
{
	var bb = Titanium.UI.createButtonBar({
		labels:['One', 'Two'],
		backgroundColor:'#336699'
	});
	bb.addEventListener('click', function(e)
	{
		Titanium.UI.createAlertDialog({title:'Button Bar', message:'You clicked ' + e.index}).show();
	});
	
	//
	// create window with right nav button 
	//
	var win = Titanium.UI.createWindow({
		rightNavButton:bb,
		backgroundColor:'#13386c',
		barColor:'#336699',
		translucent:true,
		titleImage:'../images/slider_thumb.png'
	});
	
	var winview = Ti.UI.createView({backgroundColor:'yellow'});
	win.add(winview);

	//
	//  create toolbar buttons
	//
	var a = Titanium.UI.createButton({
		title:'Left',
		width:75,
		style:Titanium.UI.iPhone.SystemButtonStyle.BORDERED		
	});
	a.addEventListener('click', function(e)
	{
		Titanium.UI.createAlertDialog({title:'Toolbar', message:'You clicked Left'}).show();
	});
	
	var b = Titanium.UI.createButton({
		title:'Right',
		width:75,
		style:Titanium.UI.iPhone.SystemButtonStyle.BORDERED		
	});
	b.addEventListener('click', function(e)
	{
		Titanium.UI.createAlertDialog({title:'Toolbar', message:'You clicked Right'}).show();
	});

	var flexSpace = Titanium.UI.createButton({
		systemButton:Titanium.UI.iPhone.SystemButton.FLEXIBLE_SPACE
	});
	var fixedSpace = Titanium.UI.createButton({
		systemButton:Titanium.UI.iPhone.SystemButton.FIXED_SPACE,
		width:50
	});

	// set toolbar
	win.setToolbar([flexSpace,a,fixedSpace,b,flexSpace],{translucent:true});

	Titanium.UI.currentTab.open(win,{animated:true});	
});

