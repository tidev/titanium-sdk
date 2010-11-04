var win = Titanium.UI.currentWindow;

//
// BASIC SWITCH
//
var basicSwitchLabel = Titanium.UI.createLabel({
	text:'Basic Switch value = false' ,
	color:'#999',
	font:{
		fontFamily:'Helvetica Neue',
		fontSize:15
	},
	textAlign:'center',
	top:10,
	height:'auto'
});

var basicSwitch = Titanium.UI.createSwitch({
	value:false,
	top:30
});

basicSwitch.addEventListener('change',function(e)
{
	basicSwitchLabel.text = 'Basic Switch value = ' + e.value + ' act val ' + basicSwitch.value;
});

//
// CHANGE SWITCH
//
var changeButton = Titanium.UI.createButton({
	title:'Change Switch',
	height:40,
	width:200,
	top:90
});
changeButton.addEventListener('click', function()
{
	if (basicSwitch.value == false)
	{
		basicSwitch.value = true;
	}
	else
	{
		basicSwitch.value = false;
	}
});

//
// HIDE/SHOW SWITCH
//
var hideShowButton = Titanium.UI.createButton({
	title:'Hide/Show Switch',
	height:40,
	width:200,
	top:140
});
var hidden=false;
hideShowButton.addEventListener('click', function()
{
	if (hidden==true)
	{
		basicSwitch.show();
		hidden=false;
	}
	else
	{
		basicSwitch.hide();
		hidden=true;
	}
});

//
// SWITCH IN TOOLBAR
//
var toolbarButton = Titanium.UI.createButton({
	title:'Toggle Switch in Toolbar',
	height:40,
	width:200,
	top:240
});
var inToolbar = false;
toolbarButton.addEventListener('click', function()
{
	if (!inToolbar)
	{
		var toolbarSwitch = Titanium.UI.createSwitch({
			value:false
		});
		win.setToolbar([toolbarSwitch]);
		inToolbar = true;
	}
	else
	{
		inToolbar = false;
		win.setToolbar(null,{animated:true});
	}
});

//
// SWITCH IN NAVBAR
//
var navbarButton = Titanium.UI.createButton({
	title:'Toggle Switch in Navbar',
	height:40,
	width:200,
	top:190
});
var inNavbar = false;
navbarButton.addEventListener('click', function()
{
	if (!inNavbar)
	{
		var navbarSwitch = Titanium.UI.createSwitch({
			value:false
		});
		win.setRightNavButton(navbarSwitch);
		inNavbar =true;
	}
	else
	{
		win.rightNavButton = null;
		inNavbar = false;
	}
});

//
// SWITCH TO TITLE CONTROL
//
var titleButton = Titanium.UI.createButton({
	title:'Toggle Swtich in Title',
	height:40,
	width:200,
	top:290
});


var inTitle = false;
titleButton.addEventListener('click', function()
{
	if (inTitle)
	{
		win.titleControl = null;
		win.title = 'Switch';
		inTitle=false;
	}
	else
	{
		var titleSwitch = Titanium.UI.createSwitch({
			value:false
		});
		win.titleControl = titleSwitch;
		inTitle=true;
	}
});



win.add(basicSwitchLabel);
win.add(basicSwitch);
win.add(changeButton);
win.add(hideShowButton);

if (Titanium.Platform.name == 'iPhone OS')
{
	win.add(toolbarButton);
	win.add(navbarButton);
	win.add(titleButton);
}
