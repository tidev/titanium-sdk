function activity_indicator(_args) {
	var osname = Ti.Platform.osname;

	var isIos = (osname === 'iphone' || osname === 'ipad');
	var isAndroid = (osname === 'android');

	var sdkVersion = parseFloat(Ti.version);
	var ActivityIndicatorStyle = Titanium.UI.ActivityIndicatorStyle;


	var win = Ti.UI.createWindow({
		title:_args.title,
		backgroundColor : '#13386c'
	});
	
	Ti.include("/etc/version.js");
	var isIOS7 = isiOS7Plus();


	var indicatorAdded = false;
	//
	// BASE INDICATOR
	//
	var actInd = Titanium.UI.createActivityIndicator({
		bottom : 10,
		width : Ti.UI.SIZE,
		height : Ti.UI.SIZE
	});
	if (ActivityIndicatorStyle) {
		actInd.style = ActivityIndicatorStyle.PLAIN;
	}

	var button0 = Titanium.UI.createButton({
		title : 'Hide',
		height : 35,
		width : 130,
		top : 10,
		right : 20
	});

	button0.addEventListener('click', function() {
		if(indicatorAdded == true)
		{
			actInd.message = null;
			actInd.width = Ti.UI.SIZE;
			actInd.hide();
			win.remove(actInd);
			indicatorAdded = false
		}
	});

	//
	// BASIC ACTIVITY INDICATOR
	//
	var button1 = Titanium.UI.createButton({
		title : 'Show (Basic)',
		height : 35,
		width : 130,
		top : 10,
		left : 20
	});

	button1.addEventListener('click', function() {
		if (ActivityIndicatorStyle) {
			actInd.style = ActivityIndicatorStyle.PLAIN;
		}
		if(indicatorAdded == false)
		{
			win.add(actInd);
			actInd.show();
			indicatorAdded = true;
		}
	});

	//
	// ACTIVITY INDICATOR (BIG)
	//
	var button2 = Titanium.UI.createButton({
		title : 'Show Indicator (BIG)',
		height : 35,
		width : 200,
		top : 55
	});

	button2.addEventListener('click', function() {
		if (ActivityIndicatorStyle) {
			actInd.style = ActivityIndicatorStyle.BIG;
		}
		if(indicatorAdded == false)
		{
			win.add(actInd);
			actInd.show();
			indicatorAdded = true;
		}
	});

	//
	// ACTIVITY INDICATOR (DARK)
	//
	var button3 = Titanium.UI.createButton({
		title : 'Show Indicator (DARK)',
		height : 35,
		width : 200,
		top : 100
	});

	button3.addEventListener('click', function() {
		if (ActivityIndicatorStyle) {
			actInd.style = ActivityIndicatorStyle.DARK;
		}
		if(indicatorAdded == false)
		{
			win.add(actInd);
			actInd.show();
			indicatorAdded = true;
		}
	});

	//
	// ACTIVITY INDICATOR (BIG_DARK)
	//
	var button8 = Titanium.UI.createButton({
		title : 'Show Indicator (BIG_DARK)',
		height : 35,
		width : 200,
		top : 145
	});

	button8.addEventListener('click', function() {
		if (ActivityIndicatorStyle) {
			actInd.style = ActivityIndicatorStyle.BIG_DARK;
		}
		if(indicatorAdded == false)
		{
			win.add(actInd);
			actInd.show();
			indicatorAdded = true;
		}
	});

	//
	// ACTIVITY INDICATOR (MESSAGE)
	//
	var button4 = Titanium.UI.createButton({
		title : 'Show Indicator (Message)',
		height : 35,
		width : 200,
		top : 145
	});
	if (!isIos) {
		button4.top = 190;
	}
	button4.addEventListener('click', function() {
		if (ActivityIndicatorStyle) {
			actInd.style = ActivityIndicatorStyle.PLAIN;
		}
		actInd.font = {
			fontFamily : 'Helvetica Neue',
			fontSize : 15,
			fontWeight : 'bold'
		};
		actInd.color = 'white';
		actInd.message = 'Loading...';
		actInd.width = 210;
		if(!indicatorAdded)
		{
			win.add(actInd);
			actInd.show();
			indicatorAdded = true;
		}
	});

	//
	// ACTIVITY INDICATOR (TOOLBAR)
	//
	var toolActInd = Titanium.UI.createActivityIndicator();
	if (ActivityIndicatorStyle) {
		if (isIOS7) {
			toolActInd.style = ActivityIndicatorStyle.DARK;
		} else {
			toolActInd.style = ActivityIndicatorStyle.PLAIN;
		}
	}

	var button5 = Titanium.UI.createButton({
		title : 'Show Indicator (Toolbar)',
		height : 35,
		width : 200,
		top : 190
	});

	button5.addEventListener('click', function() {
		toolActInd.style = (isIOS7?ActivityIndicatorStyle.DARK:ActivityIndicatorStyle.PLAIN);
		toolActInd.font = {fontFamily : 'Helvetica Neue',fontSize : 15,fontWeight : 'bold'};
		toolActInd.color = (isIOS7?'black':'white');
		toolActInd.message = 'Loading...';
		win.setToolbar([toolActInd], {animated : true});
		toolActInd.show();
		button5.enabled = false;
		setTimeout(function() {
			win.setToolbar(null, {animated : true});
			button5.enabled = true;
		}, 3000);

	});

	//
	// ACTIVITY INDICATOR (NAVBAR)
	//
	var navActInd = Titanium.UI.createActivityIndicator();

	if (ActivityIndicatorStyle) {
		if (isIOS7) {
			navActInd.style = ActivityIndicatorStyle.DARK;
		} else {
			navActInd.style = ActivityIndicatorStyle.PLAIN;
		}
	}
	var button6 = Titanium.UI.createButton({
		title : 'Show Indicator (Navbar)',
		height : 35,
		width : 200,
		top : 235
	});

	button6.addEventListener('click', function() {

		win.setRightNavButton(navActInd);
		navActInd.show();
		button6.enabled = false;
		setTimeout(function() {
			win.setRightNavButton(null);
			button6.enabled = true;
		}, 3000);

	});

	//
	// ACTIVITY INDICATOR (TITLE CONTROL)
	//
	var button7 = Titanium.UI.createButton({
		title : 'Show Indicator (Title)',
		height : 35,
		width : 200,
		top : 280
	});

	button7.addEventListener('click', function() {
		if(indicatorAdded)
		{
			actInd.message = null;
			actInd.width = Ti.UI.SIZE;
			actInd.hide();
			win.remove(actInd);
		}
		if (ActivityIndicatorStyle) {
			if (isIOS7) {
				actInd.style = ActivityIndicatorStyle.DARK;
			}
		}
		win.setTitleControl(actInd);
		actInd.show();
		indicatorAdded = true;
		button0.enabled = false;
		button4.enabled = false;
		setTimeout(function() {
			actInd.hide();
			win.setTitleControl(null);
			indicatorAdded = false;
			button0.enabled = true;
			button4.enabled = true;
			win.title = 'Activity Indicator';

		}, 3000);
	});

	// add iOS elements
	if (isIos) {
		win.add(button1);
		win.add(button0);
		win.add(button2);
		win.add(button3);
		win.add(button4);
		win.add(button5);
		win.add(button6);
		win.add(button7);
	} else {
		if (sdkVersion < 3.0) {
			if (isAndroid) {
				win.addEventListener('open', function(e) {
					win.add(actInd);
					actInd.show();
					actInd.message = 'Loading...';
					setTimeout(function() {
						actInd.hide();
					}, 2000);
				});
			} else {
				win.add(actInd);
				actInd.show();
				actInd.message = 'Loading...';
				setTimeout(function() {
					actInd.hide();
				}, 2000);
			}
		} else {// Use the new Activity Indicator (TIMOB-6092)
			win.add(button1);
			win.add(button0);
			win.add(button2);
			win.add(button3);
			win.add(button8);
			win.add(button4);
		}
	}

	return win;
};

module.exports = activity_indicator;
