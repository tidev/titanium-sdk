var win = Titanium.UI.currentWindow;

// get tab group object
var tabGroup = win.tabGroup;

//
//  ADD/REMOVE TAB
//
var addTabButton = Titanium.UI.createButton({
	title:'Add/Remove Tab',
	top:10,
	height:40,
	width:200
});

// create button event listener
addTabButton.addEventListener('click', function(e)
{
	if (tabGroup.tabs.length == 5)
	{
		var win = Ti.UI.createWindow({title:'New Tab Window',barColor:'#000'});
		var newtab = Titanium.UI.createTab({  
		    icon:'../images/tabs/KS_nav_mashup.png',
		    title:'New Tab',
			win:win
		});
		tabGroup.addTab(newtab);
	}
	else
	{
		var newtab = tabGroup.tabs[5];
		tabGroup.removeTab(newtab);
	}
});

//
// ANIMATE TAB GROUP
//
var animateTabButton = Titanium.UI.createButton({
	title:'Animate Tab Group',
	top:60,
	height:40,
	width:200
});

var transformed = false;

// create button event listener
animateTabButton.addEventListener('click', function(e)
{
	if (transformed == false)
	{
		var transform = Ti.UI.create2DMatrix();
		transform = transform.scale(0.6);
		transform = transform.rotate(45);
		tabGroup.animate({transform:transform,duration:1000});

		transformed = true;
	}
	else
	{
		var transform = Ti.UI.create2DMatrix();
		tabGroup.animate({transform:transform,duration:1000});

		transformed = false;
	}
});


//
// CLOSE/OPEN TAB GROUP WITH ANIMATION 
// 
var closeTabGroupButton = Titanium.UI.createButton({
	title:'Close/Animate Tab Group',
	top:110,
	height:40,
	width:200
});

closeTabGroupButton.addEventListener('click', function(e)
{
	tabGroup.animate({opacity:0,duration:1000}, function()
	{
		tabGroup.close();		
	});

});

//
// SET ACTIVE TAB (INDEX)
// 
var setActiveTabButton = Titanium.UI.createButton({
	title:'Set Active Tab (Index)',
	top:160,
	height:40,
	width:200
});

setActiveTabButton.addEventListener('click', function(e)
{
	tabGroup.setActiveTab(1);
});

//
// SET ACTIVE TAB (OBJECT)
// 
var setActiveTabObjectButton = Titanium.UI.createButton({
	title:'Set Active Tab (Object)',
	top:210,
	height:40,
	width:200
});
setActiveTabObjectButton.addEventListener('click', function(e)
{
	tabGroup.setActiveTab(tabGroup.tabs[1]);
});

//
// CUSTOMIZATION SWITCH
//
var customizationButton = Titanium.UI.createButton({
	title:'Switch customization off',
	top:260,
	height:40,
	width:200
});
customizationButton.addEventListener('click', function(e)
{
	var text = 'Switch customization ';
	if (tabGroup.allowUserCustomization) {
		tabGroup.allowUserCustomization = false;
		text += 'on';
	}
	else {
		tabGroup.allowUserCustomization = true;
		text += 'off';
	}
	customizationButton.title = text;
});


//
// CURRENT TAB GROUP
//
var openLabel = Titanium.UI.createLabel({
	text:'Tab Group has ' + Titanium.UI.currentTabGroup.tabs.length + ' tabs',
	color:'#999',
	font:{
		fontFamily:'Helvetica Neue',
		fontSize:15
	},
	textAlign:'center',
	top:310,
	width:'auto',
	height:'auto'
});

// add views based on platform
if (Titanium.Platform.name == 'iPhone OS')
{
	win.add(addTabButton);
	win.add(animateTabButton);
	win.add(closeTabGroupButton);
	win.add(customizationButton);
}

win.add(setActiveTabButton);
win.add(setActiveTabObjectButton);
win.add(openLabel);
