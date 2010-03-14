var win = Titanium.UI.currentWindow;
win.backgroundColor = '#13386c'

//
// BASE INDICATOR
//
var actInd = Titanium.UI.createActivityIndicator({
	bottom:10, 
	height:50,
	width:10,
	style:Titanium.UI.iPhone.ActivityIndicatorStyle.PLAIN
});
win.add(actInd);

var button0 = Titanium.UI.createButton({
	title:'Hide',
	height:35,
	width:130,
	top:10,
	right:20,
});

button0.addEventListener('click', function()
{
	actInd.message = null;
	actInd.hide();
});

win.add(button0);

//
// BASIC ACTIVITY INDICATOR
//
var button1 = Titanium.UI.createButton({
	title:'Show (Basic)',
	height:35,
	width:130,
	top:10,
	left:20,
});

button1.addEventListener('click', function()
{
	actInd.show();
});

win.add(button1);

//
// ACTIVITY INDICATOR (BIG)
//
var button2 = Titanium.UI.createButton({
	title:'Show Indicator (BIG)',
	height:35,
	width:200,
	top:55,
});

button2.addEventListener('click', function()
{
	actInd.style = Titanium.UI.iPhone.ActivityIndicatorStyle.BIG
	actInd.show();
});
win.add(button2);

//
// ACTIVITY INDICATOR (DARK)
//
var button3 = Titanium.UI.createButton({
	title:'Show Indicator (DARK)',
	height:35,
	width:200,
	top:100,
});

button3.addEventListener('click', function()
{
	actInd.style = Titanium.UI.iPhone.ActivityIndicatorStyle.DARK;
	actInd.show();
});
win.add(button3);

//
// ACTIVITY INDICATOR (MESSAGE)
//
var button4 = Titanium.UI.createButton({
	title:'Show Indicator (Message)',
	height:35,
	width:200,
	top:145,
});

button4.addEventListener('click', function()
{
	actInd.style = Titanium.UI.iPhone.ActivityIndicatorStyle.PLAIN;
	actInd.font = {fontFamily:'Helvetica Neue', fontSize:15,fontWeight:'bold'};
	actInd.color = 'white';
	actInd.message = 'Loading...';
	actInd.width = 210;
	actInd.show();
});
win.add(button4);

//
// ACTIVITY INDICATOR (TOOLBAR)
//
var toolActInd = Titanium.UI.createActivityIndicator();

var button5 = Titanium.UI.createButton({
	title:'Show Indicator (Toolbar)',
	height:35,
	width:200,
	top:190,
});

button5.addEventListener('click', function()
{
	toolActInd.style = Titanium.UI.iPhone.ActivityIndicatorStyle.PLAIN;
	toolActInd.font = {fontFamily:'Helvetica Neue', fontSize:15,fontWeight:'bold'};
	toolActInd.color = 'white';
	toolActInd.message = 'Loading...';
	win.setToolbar([toolActInd],{animated:true});
	toolActInd.show();
	setTimeout(function()
	{
		toolActInd.hide();
		win.setToolbar(null,{animated:true});
	},3000);

});
win.add(button5);

//
// ACTIVITY INDICATOR (NAVBAR)
//
var navActInd = Titanium.UI.createActivityIndicator();

var button6 = Titanium.UI.createButton({
	title:'Show Indicator (Navbar)',
	height:35,
	width:200,
	top:235,
});

button6.addEventListener('click', function()
{
	
	win.setRightNavButton(navActInd);
	navActInd.show();
	setTimeout(function()
	{
		navActInd.hide();
		win.setRightNavButton(null);
	
	},3000)

});
win.add(button6);

//
// ACTIVITY INDICATOR (TITLE CONTROL)
//
var button7 = Titanium.UI.createButton({
	title:'Show Indicator (Title)',
	height:35,
	width:200,
	top:235,
});

button7.addEventListener('click', function()
{
	win.setTitleControl(actInd);
	actInd.show();

	setTimeout(function()
	{
		actInd.hide();
		win.setTitleControl(null);
		win.title = 'Activity Indicator';

	},3000)
});
win.add(button7);
