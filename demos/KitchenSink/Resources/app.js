// this sets the background color of the master UIView (when there are no windows/tab groups on it)
Titanium.UI.setBackgroundColor('#000');

// create tab group
var tabGroup = Titanium.UI.createTabGroup({id:'tabGroup1'});


//
// create base UI tab and root window
//
var win1 = Titanium.UI.createWindow({className:'win1'});

var tab1 = Titanium.UI.createTab({
	id:'tab1',
	window:win1
});

//
// create controls tab and root window
//
var win2 = Titanium.UI.createWindow({
	url:'main_windows/controls.js',
	titleid:'controls_win_title'
});
var tab2 = Titanium.UI.createTab({
	icon:'images/tabs/KS_nav_ui.png',
	titleid:'controls_win_title',
	window:win2
});


//
// create phone tab and root window
//
var win3 = Titanium.UI.createWindow({
	url:'main_windows/phone.js',
	titleid:'phone_win_title'
});
var tab3 = Titanium.UI.createTab({
	icon:'images/tabs/KS_nav_phone.png',
	titleid:'phone_win_title',
	window:win3
});


//
// create platform tab and root window
//
var win4 = Titanium.UI.createWindow({
	url:'main_windows/platform.js',
	titleid:'platform_win_title'
});
var tab4 = Titanium.UI.createTab({
	icon:'images/tabs/KS_nav_platform.png',
	titleid:'platform_win_title',
//	Commented out as per 1773
//	active:true,
	window:win4
});

//
// create mashup tab and root window
//
var win5 = Titanium.UI.createWindow({
	url:'main_windows/mashups.js',
	titleid:'mashups_win_title'
});
var tab5 = Titanium.UI.createTab({
	icon:'images/tabs/KS_nav_mashup.png',
	titleid:'mashups_win_title',
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
	transition: Titanium.UI.iPhone && Titanium.UI.iPhone.AnimationStyle.FLIP_FROM_LEFT
});

// setTimeout(function()
// {
	// tabGroup.close({
		// transition:Titanium.UI.iPhone.AnimationStyle.FLIP_FROM_LEFT
	// });
// },2000);


//
//  TAB GROUP EVENTS
//
var messageWin = Titanium.UI.createWindow({
	height:30,
	width:250,
	bottom:70,
	borderRadius:10,
	touchEnabled:false,

	orientationModes : [
	Titanium.UI.PORTRAIT,
	Titanium.UI.UPSIDE_PORTRAIT,
	Titanium.UI.LANDSCAPE_LEFT,
	Titanium.UI.LANDSCAPE_RIGHT
	]
});
var messageView = Titanium.UI.createView({
	id:'messageview',
	height:30,
	width:250,
	borderRadius:10,
	backgroundColor:'#000',
	opacity:0.7,
	touchEnabled:false
});

var messageLabel = Titanium.UI.createLabel({
	id:'messagelabel',
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
	if (Ti.Platform.osname == "iphone") {
//On iOS, when we're closing the tab group, this is a result
//of the tab group example of 'Close/Animate Tab Group' and
//we want to reopen the tab group so the user can continue with
//using Kitchen Sink. HOWEVER, on Android, this is also triggered
//when the app is being closed via back button, where reopening
//the tab group is not desired. This is purely a quirk of the tests.
		tabGroup.open();
	}
	setTimeout(function()
	{
		messageWin.close({opacity:0,duration:500});
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
	if (Ti.Platform.osname != 'android')
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
	}

	// loading indicator
	actInd = Titanium.UI.createActivityIndicator({
		style:Titanium.UI.iPhone && Titanium.UI.iPhone.ActivityIndicatorStyle.BIG,
		height:30,
		width:30
	});

	if (Ti.Platform.osname != 'android')
	{
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
	} else {
		actInd.message = "Loading";
	}
	actInd.show();

}

function hideIndicator()
{
	actInd.hide();
	if (Ti.Platform.osname != 'android') {
		indWin.close({opacity:0,duration:500});
	}
}

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

// test out logging to developer console, formatting and localization
Ti.API.info(String.format("%s%s",L("welcome_message","default_not_set"),Titanium.version));
Ti.API.debug(String.format("%s %s",L("user_agent_message","default_not_set"),Titanium.userAgent));

Ti.API.debug(String.format("locale specific date is %s",String.formatDate(new Date()))); // default is short
Ti.API.debug(String.format("locale specific date (medium) is %s",String.formatDate(new Date(),"medium")));
Ti.API.debug(String.format("locale specific date (long) is %s",String.formatDate(new Date(),"long")));
Ti.API.debug(String.format("locale specific time is %s",String.formatTime(new Date())));
Ti.API.debug(String.format("locale specific currency is %s",String.formatCurrency(12.99)));
Ti.API.debug(String.format("locale specific decimal is %s",String.formatDecimal(12.99)));


Ti.API.info("should be en, was = "+Ti.Locale.currentLanguage);
Ti.API.info("welcome_message = "+Ti.Locale.getString("welcome_message"));
Ti.API.info("should be def, was = "+Ti.Locale.getString("welcome_message2","def"));
Ti.API.info("welcome_message = "+L("welcome_message"));
Ti.API.info("should be def, was = "+L("welcome_message2","def"));
Ti.API.info("should be 1, was = "+String.format('%d',1));
Ti.API.info("should be 1.0, was = "+String.format('%1.1f',1));
Ti.API.info("should be hello, was = "+String.format('%s','hello'));

// test to check that we can iterate over titanium based objects
(function(){
	Ti.API.info("you should see a list of properties (3 or more) below this line");
	Ti.API.info("---------------------------------------------------------------");
	for (var p in win1)
	{
		Ti.API.info("         win1 property: "+p);
	}
	Ti.API.info("Did you see properties? ^^^^^ ");
	Ti.API.info("---------------------------------------------------------------");

	Ti.API.info("you should see a list of modules (3 or more) below this line");
	Ti.API.info("---------------------------------------------------------------");
	for (var p in Titanium)
	{
		Ti.API.info("             module: "+p);
	}
	Ti.API.info("Did you see modules? ^^^^^ ");
	Ti.API.info("---------------------------------------------------------------");
})();


Ti.include("examples/version.js");

if (isiOS4Plus())
{
	// register a background service. this JS will run when the app is backgrounded
	var service = Ti.App.iOS.registerBackgroundService({url:'bg.js'});

	Ti.API.info("registered background service = "+service);

	// listen for a local notification event
	Ti.App.iOS.addEventListener('notification',function(e)
	{
		Ti.API.info("local notification received: "+JSON.stringify(e));
	});

	// fired when an app resumes for suspension
	Ti.App.addEventListener('resume',function(e){
		Ti.API.info("app is resuming from the background");
	});
	Ti.App.addEventListener('resumed',function(e){
		Ti.API.info("app has resumed from the background");
	});

	Ti.App.addEventListener('pause',function(e){
		Ti.API.info("app was paused from the foreground");
	});
}

if (Ti.App.Properties.getBool('showNotice', true)){
	var alertNotice = Ti.UI.createAlertDialog({
		buttonNames: ['OK', 'Visit docs', 'Don\'t show again'],
		cancel:0,
		title: 'Notice',
		message: 'While this KitchenSink provides an extensive demonstration of the Titanium API, its structure is not recommended for production apps. Please refer to our documentation for more details.'
	});
	alertNotice.show();
	alertNotice.addEventListener('click', function(e){
		if(e.index === 1){
			Titanium.Platform.openURL('http://wiki.appcelerator.org/display/guides/Example+Applications');
		}
		if(e.index === 2){
			Ti.App.Properties.setBool('showNotice', false);
		}
	});
}

