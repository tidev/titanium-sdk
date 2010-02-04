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

// add button to window
win.add(addTabButton);

// create button event listener
addTabButton.addEventListener('click', function(e)
{
	if (tabGroup.tabs.length == 5)
	{
		var newtab = Titanium.UI.createTab({  
		    icon:'../images/tabs/KS_nav_mashup.png',
		    title:'New Tab'
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

// add button to window
win.add(animateTabButton);

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
win.add(closeTabGroupButton);

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
win.add(setActiveTabButton);

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
win.add(setActiveTabObjectButton);

setActiveTabObjectButton.addEventListener('click', function(e)
{
	tabGroup.setActiveTab(tabGroup.tabs[1]);
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
	top:260
});

win.add(openLabel);

