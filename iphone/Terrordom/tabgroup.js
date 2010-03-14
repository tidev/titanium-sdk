Ti.API.debug("OPENING TAB GROUP TAB");

Ti.API.debug("tabgroup.js current window = "+Ti.UI.currentWindow);
Ti.API.debug("tabgroup.js current tab group = "+Ti.UI.currentTabGroup);
Ti.API.debug("tabgroup.js current tab = "+Ti.UI.currentTab);
Ti.API.debug("tabgroup.js current window tabGroup = "+Ti.UI.currentWindow.tabGroup);
Ti.API.debug("tabgroup.js current window tab = "+Ti.UI.currentWindow.tab);


Ti.API.debug("tab group adding blur listener");

Ti.UI.currentTab.addEventListener('blur',function()
{
	Ti.API.debug("the tabgroup.js has lost focus");
	Ti.UI.currentTab.badge=null;
});

Ti.API.debug("tab group before setting badge");

Ti.UI.currentTab.badge = 1;


Ti.API.debug("tab group after set badge");

//TESTS for zindexing

var view1=Ti.UI.createView({backgroundColor:'red',zIndex:2,width:100,height:100,left:10,top:20});
Ti.UI.currentWindow.add(view1);

var view2=Ti.UI.createView({backgroundColor:'green',zIndex:1,width:100,height:100,left:5,top:15});
Ti.UI.currentWindow.add(view2);

var view3=Ti.UI.createView({backgroundColor:'blue',zIndex:10,width:100,height:100,left:15,top:25});
Ti.UI.currentWindow.add(view3);

var view4=Ti.UI.createView({backgroundColor:'purple',width:100,height:100,left:20,top:30,zIndex:10});
Ti.UI.currentWindow.add(view4);

Ti.UI.currentWindow.bgColor = '#999';

var view6=Ti.UI.createView({backgroundColor:'pink',width:80,height:80,borderRadius:40,zIndex:10});
Ti.UI.currentWindow.add(view6);

// set dynamically from the default (0) to 3 which should still be less than the other layer above it
view4.zIndex = 3;

Ti.API.debug("zIndex should be 3, was = "+view4.zIndex);

view6.addEventListener('singletap',function(ev)
{
	Ti.API.info("single tap");
	view6.bgColor = 'teal';
});

view6.addEventListener('doubletap',function(ev)
{
	Ti.API.info("double tap");
	view6.bgColor = 'navy';
});

view6.addEventListener('twofingertap',function(ev)
{
	Ti.API.info("two finger tap");
	view6.bgColor = 'cyan';
});


var button1 = Titanium.UI.createButton({
id:'button1',
backgroundImage:'images/BUTT_grn_off.png',
backgroundSelectedImage:'images/BUTT_grn_on.png',
backgroundFocusedImage:'images/BUTT_grn_on.png',
title:'Green Rules!',
color:'#ffffff',
height:57,
fontSize:20,
fontWeight:'bold',
bottom:45,
zIndex:1000
});

button1.addEventListener('click',function()
{
	view6.bgColor = '#090';
});


var button2 = Titanium.UI.createButton({
	title:'Red Rules!',
	color:'#336699',
	height:40,
	width:100,
	fontSize:12,
	fontWeight:'bold',
	top:10,
	zIndex:2000
});
button2.addEventListener('click',function(e)
{
	view6.bgColor = '#900';
});

Titanium.UI.currentWindow.add(button2);

Titanium.UI.currentWindow.add(button1);
