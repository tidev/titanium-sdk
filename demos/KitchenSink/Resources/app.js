// this sets the background color of the master UIView (when there are no windows/tab groups on it)
Titanium.UI.setBackgroundColor('#000');

// create tab group
var tabGroup = Titanium.UI.createTabGroup(
{
	barColor:'#336699'
});

//
// create base UI tab and root window
//
var win1 = Titanium.UI.createWindow({
    url:'main_windows/base_ui.js',
    titleImage:'images/appcelerator_small.png'
});

var tab1 = Titanium.UI.createTab({
    icon:'images/tabs/KS_nav_views.png',
    title:'Base UI',
    window:win1
});

//
// create controls tab and root window
//
var win2 = Titanium.UI.createWindow({
    url:'main_windows/controls.js',
    title:'Controls'
});
var tab2 = Titanium.UI.createTab({
    icon:'images/tabs/KS_nav_ui.png',
    title:'Controls',
    window:win2
});


//
// create phone tab and root window
//
var win3 = Titanium.UI.createWindow({
    url:'main_windows/phone.js',
    title:'Phone'
});
var tab3 = Titanium.UI.createTab({
    icon:'images/tabs/KS_nav_phone.png',
    title:'Phone',
    window:win3
});


//
// create platform tab and root window
//
var win4 = Titanium.UI.createWindow({
    url:'main_windows/platform.js',
    title:'Platform'
});
var tab4 = Titanium.UI.createTab({
    icon:'images/tabs/KS_nav_platform.png',
    title:'Platform',
active:true,
    window:win4
});

//
// create mashup tab and root window
//
var win5 = Titanium.UI.createWindow({
    url:'main_windows/mashups.js',
    title:'Mashups'
});
var tab5 = Titanium.UI.createTab({
    icon:'images/tabs/KS_nav_mashup.png',
    title:'Mashups',
    window:win5
});

//
//  add tabs
//
tabGroup.addTab(tab1);
tabGroup.addTab(tab2);
tabGroup.addTab(tab3);
tabGroup.addTab(tab4);
tabGroup.addTab(tab5);

tabGroup.addEventListener('open',function()
{
	// set background color back to white after tab group transition
	Titanium.UI.setBackgroundColor('#fff');
});

tabGroup.setActiveTab(1);
// open tab group with a transition animation
tabGroup.open({
	transition:Titanium.UI.iPhone.AnimationStyle.FLIP_FROM_LEFT
});

// setTimeout(function()
// {
// 	tabGroup.close({
// 		transition:Titanium.UI.iPhone.AnimationStyle.FLIP_FROM_LEFT
// 	});
// 	
// },2000);


//
//  TAB GROUP EVENTS
//
var messageWin = Titanium.UI.createWindow({
	height:30,
	width:250,
	bottom:70,
	borderRadius:10,
	touchEnabled:false
});
var messageView = Titanium.UI.createView({
	height:30,
	width:250,
	borderRadius:10,
	backgroundColor:'#000',
	opacity:0.7,
	touchEnabled:false
});

var messageLabel = Titanium.UI.createLabel({
	text:'',
	color:'#fff',
	width:250,
	height:'auto',
	font:{
		fontFamily:'Helvetica Neue',
		fontSize:13
	},
	textAlign:'center'
});
messageWin.add(messageView);
messageWin.add(messageLabel);

//
// TAB EVENTS
//

// tab group close event
tabGroup.addEventListener('close', function(e)
{
	messageLabel.text = 'tab group close event';
	messageWin.open();
	setTimeout(function()
	{
		messageWin.close({opacity:0,duration:500});
		tabGroup.open();
	},1000);
});


// tab group open event
tabGroup.addEventListener('open', function(e)
{
	messageLabel.text = 'tab group open event';
	messageWin.open();
	setTimeout(function()
	{
		messageWin.close({opacity:0,duration:500});
	},1000);

});

// focus event listener for tracking tab changes
tabGroup.addEventListener('focus', function(e)
{
	messageLabel.text = 'tab changed to ' + e.index + ' old index ' + e.previousIndex;
	messageWin.open();
	setTimeout(function()
	{
		Ti.API.info('tab ' + e.tab.title  + ' prevTab = ' + (e.previousTab ? e.previousTab.title : null));
		messageLabel.text = 'active title ' + e.tab.title + ' old title ' + (e.previousTab ? e.previousTab.title : null);
	},1000);

	setTimeout(function()
	{
		messageWin.close({opacity:0,duration:500});
	},2000);

});

// blur event listener for tracking tab changes
tabGroup.addEventListener('blur', function(e)
{
	Titanium.API.info('tab blur - new index ' + e.index + ' old index ' + e.previousIndex);
});


//
//   CUSTOM EVENTS
//
Titanium.App.addEventListener('event_one', function(e)
{
	messageLabel.text = 'app.js: event one, array length = ' + e.data.length;
	messageWin.open();
	setTimeout(function()
	{
		messageWin.close({opacity:0,duration:500});
	},1000);
});

Titanium.App.addEventListener('event_two', function(e)
{
	messageLabel.text = 'app.js: event two, name = ' + e.name;
	messageWin.open();
	setTimeout(function()
	{
		messageWin.close({opacity:0,duration:500});
	},1000);

});

//
//  CREATE CUSTOM LOADING INDICATOR
//
var indWin = null;
var actInd = null;
function showIndicator()
{
	// window container
	indWin = Titanium.UI.createWindow({
		height:150,
		width:150
	});

	// black view
	var indView = Titanium.UI.createView({
		height:150,
		width:150,
		backgroundColor:'#000',
		borderRadius:10,
		opacity:0.8
	});
	indWin.add(indView);

	// loading indicator
	actInd = Titanium.UI.createActivityIndicator({
		style:Titanium.UI.iPhone.ActivityIndicatorStyle.BIG,
		height:30,
		width:30
	});
	indWin.add(actInd);

	// message
	var message = Titanium.UI.createLabel({
		text:'Loading',
		color:'#fff',
		width:'auto',
		height:'auto',
		font:{fontSize:20,fontWeight:'bold'},
		bottom:20
	});
	indWin.add(message);
	indWin.open();
	actInd.show();

};

function hideIndicator()
{
	actInd.hide();
	indWin.close({opacity:0,duration:500});
};

//
// Add global event handlers to hide/show custom indicator
//
Titanium.App.addEventListener('show_indicator', function(e)
{
	Ti.API.info("IN SHOW INDICATOR");
	showIndicator();
});
Titanium.App.addEventListener('hide_indicator', function(e)
{
	Ti.API.info("IN HIDE INDICATOR");
	hideIndicator();
});

// trap app shutdown event
Titanium.App.addEventListener('close',function(e)
{
	Ti.API.info("The application is being shutdown");
});

// test for loading in a root-level include
Ti.include("welcome.js");

// test out logging to developer console
Ti.API.info("Welcome to Kitchen Sink for Titanium/"+Titanium.version);
Ti.API.debug("user agent set to "+Titanium.userAgent);




