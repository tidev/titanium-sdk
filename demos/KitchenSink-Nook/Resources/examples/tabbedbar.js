var win = Titanium.UI.currentWindow;

//
//  LABEL
//

var l = Titanium.UI.createLabel({
	text:'You have not clicked anything',
	color:'#777',
	font:{fontSize:13, fontFamily:'Helvetica Neue'},
	width:'auto',
	height:'auto',
	textAlign:'center'
});
win.add(l);

//
// BUTTON TO SET ACTIVE INDEX
//
var b = Titanium.UI.createButton({
	title:'Set Tab 0 Active',
	width:200,
	height:40,
	bottom:30
});

win.add(b);
b.addEventListener('click', function()
{
	tb1.index = 0;
	tb2.index = 0;
	tb3.index = 0;
	tb4.index = 0;

});

//
// BASIC TABBED BAR
//
var tb1 = Titanium.UI.createTabbedBar({
	labels:['One', 'Two', 'Three'],
	backgroundColor:'#336699',
	top:50,
	style:Titanium.UI.iPhone.SystemButtonStyle.BAR,
	height:25,
	width:200,
	index:2
});

win.add(tb1);

//
// UPDATE LABELS AND DISPLAY BUTTON INDEX ON CLICK
//
var odd=true;
tb1.addEventListener('click', function(e)
{
	if (odd)
	{
		tb1.labels = ['Three','Four', 'Five'];
		odd=false;
	}
	else
	{
		tb1.labels = ['One','Two', 'Three'];
		odd=true;
	}
	l.text = 'You clicked index = ' + e.index + ' act val ' + tb1.index;
});

//
// TOOLBAR
//
var tb2 = Titanium.UI.createTabbedBar({
	labels:['One', 'Two', 'Three', 'Four', 'Five'],
	backgroundColor:'maroon',
	index:2
});
var flexSpace = Titanium.UI.createButton({
	systemButton:Titanium.UI.iPhone.SystemButton.FLEXIBLE_SPACE
});

win.setToolbar([flexSpace,tb2,flexSpace]);

tb2.addEventListener('click', function(e)
{
	l.text = 'You clicked index = ' + e.index;
});

//
// NAVBAR
//
var tb3 = Titanium.UI.createTabbedBar({
	labels:['One', 'Two'],
	index:0,
	backgroundColor:'#336699'

});

win.setRightNavButton(tb3);

tb3.addEventListener('click', function(e)
{
	l.text = 'You clicked index = ' + e.index;
});


// title control
var tb4 = Titanium.UI.createTabbedBar({
	labels:['One', 'Two'],
	index:0,
	backgroundColor:'red',
	style:Titanium.UI.iPhone.SystemButtonStyle.BAR
});
win.setTitleControl(tb4);

tb4.addEventListener('click', function(e)
{
	l.text = 'You clicked index = ' + e.index;
});

//
// CUSTOM TABBED BAR
//
var buttonObjects = [
	{title:'Toggle Style', width:110, enabled:false},
	{image:'../images/slider_thumb.png', width:50},
	{title:'Toggle Enabled', width:140}
];
var tb4 = Titanium.UI.createTabbedBar({
	labels:buttonObjects,
	backgroundColor:'#999',
	top:100,
	style:Titanium.UI.iPhone.SystemButtonStyle.BAR,
	height:40,
	index:1
});

win.add(tb4);
var plain = false;
tb4.addEventListener('click', function(e)
{
	// toggle button bar style
	if (e.index == 1)
	{
		if (plain)
		{
			tb4.style = Titanium.UI.iPhone.SystemButtonStyle.BAR;
			plain=false;
		}
		else
		{
			tb4.style = Titanium.UI.iPhone.SystemButtonStyle.PLAIN;
			plain=true;
		}
	}

	// toggle enabled
	else if (e.index == 2)
	{
		buttonObjects[0].enabled = (buttonObjects[0].enabled === false)?true:false;
		tb4.labels = buttonObjects;
	}
	l.text = 'You clicked index = ' + e.index;
});
// */
