var win = Titanium.UI.currentWindow;

// for battery level to work, you have to turn it
// on first otherwise it will report -1.  if you
// add a battery listener, it will turn it on for you
// automagically
var needUpdate = false;
Titanium.Platform.batteryMonitoring = true;

win.addEventListener('close',function()
{
	// turn it off, no need to waste the battery
	Titanium.Platform.batteryMonitoring = false;
	Titanium.Platform.removeEventListener('battery');
});

function batteryStateToString(state)
{
	switch (state)
	{
		case Titanium.Platform.BATTERY_STATE_UNKNOWN:
			return 'unknown';
		case Titanium.Platform.BATTERY_STATE_UNPLUGGED:
			return 'unplugged';
		case Titanium.Platform.BATTERY_STATE_CHARGING:
			return 'charging';
		case Titanium.Platform.BATTERY_STATE_FULL:
			return 'full';
	}
	return '???';
}

var l1 = Titanium.UI.createLabel({
	text:'name/osname:' + Titanium.Platform.name+'/'+Titanium.Platform.osname,
	top:10,
	left:10,
	width:'auto',
	font:{fontSize:14},
	color:'#ddd',
	height:'auto'
});

win.add(l1);

var l2 = Titanium.UI.createLabel({
	text:'model:' + Titanium.Platform.model,
	top:30,
	left:10,
	width:300,
	height:'auto',
	font:{fontSize:14},
	color:'#ddd'
});

win.add(l2);

var l3 = Titanium.UI.createLabel({
	text:'version:' + Titanium.Platform.version,
	top:50,
	left:10,
	width:300,
	height:'auto',
	font:{fontSize:14},
	color:'#ddd'
});

win.add(l3);

var l4 = Titanium.UI.createLabel({
	text:'architecture:' + Titanium.Platform.architecture,
	top:70,
	left:10,
	width:300,
	height:'auto',
	font:{fontSize:14},
	color:'#ddd'
});

win.add(l4);

var l5 = Titanium.UI.createLabel({
	text:'macaddress:' + Titanium.Platform.macaddress,
	top:90,
	left:10,
	width:'auto',
	height:'auto',
	font:{fontSize:14},
	color:'#ddd'
});

win.add(l5);

var l6 = Titanium.UI.createLabel({
	text:'processor count:' + Titanium.Platform.processorCount,
	top:110,
	left:10,
	width:300,
	height:'auto',
	font:{fontSize:14},
	color:'#ddd'
});

win.add(l6);


var l7 = Titanium.UI.createLabel({
	text:'username:' + Titanium.Platform.username,
	top:130,
	left:10,
	width:300,
	height:'auto',
	font:{fontSize:14},
	color:'#ddd'
});

win.add(l7);

// NOTE: Needs to be tested on a physical device to get an accurate value;
// may select the wrong interface on non-mobile devices.
var l8 = Titanium.UI.createLabel({
	text:'address:' + Titanium.Platform.address,
	top:150,
	left:10,
	width:300,
	height:'auto',
	font:{fontSize:14},
	color:'#ddd'
});

win.add(l8);

var l9 = Titanium.UI.createLabel({
	text:'ostype:' + Titanium.Platform.ostype,
	top:170,
	left:10,
	width:300,
	height:'auto',
	font:{fontSize:14},
	color:'#ddd'
});

win.add(l9);

if (Titanium.Platform.batteryState == Ti.Platform.BATTERY_STATE_UNKNOWN) {
	needUpdate = true;
}

var l11 = Titanium.UI.createLabel({
	text:'battery state:' + batteryStateToString(Titanium.Platform.batteryState),
	top:190,
	left:10,
	width:300,
	height:'auto',
	font:{fontSize:14},
	color:'#ddd'
});

win.add(l11);

var l12 = Titanium.UI.createLabel({
	text:'battery level:' + Titanium.Platform.batteryLevel,
	top:210,
	left:10,
	width:300,
	height:'auto',
	font:{fontSize:14},
	color:'#ddd'
});

win.add(l12);

var l13 = Titanium.UI.createLabel({
	text:'display width-x-height:' + Titanium.Platform.displayCaps.platformWidth + 'x' + Titanium.Platform.displayCaps.platformHeight,
	top:230,
	left:10,
	width:300,
	height:'auto',
	font:{fontSize:14},
	color:'#ddd'
});

win.add(l13);

var l15 = Titanium.UI.createLabel({
	text:'display density:' + Titanium.Platform.displayCaps.density,
	top:250,
	left:10,
	width:300,
	height:'auto',
	font:{fontSize:14},
	color:'#ddd'
});

win.add(l15);

var l16 = Titanium.UI.createLabel({
	text:'display dpi:' + Titanium.Platform.displayCaps.dpi,
	top:270,
	left:10,
	width:300,
	height:'auto',
	font:{fontSize:14},
	color:'#ddd'
});

win.add(l16);

var l17 = Titanium.UI.createLabel({
	text:'available memory:' + Titanium.Platform.availableMemory,
	top:290,
	left:10,
	width:300,
	height:'auto',
	font:{fontSize:14},
	color:'#ddd'
});

win.add(l17);

var b = Titanium.UI.createButton({
	title:'Open URL',
	height:50,
	width:200,
	top:310
});
win.add(b);

b.addEventListener('click', function() {
	Titanium.Platform.openURL('http://www.appcelerator.com');
});

//
// BATTERY STATE CHANGE EVENT
//
Titanium.Platform.addEventListener('battery', function(e)
{
	if (needUpdate) {
		l11.text = 'battery state:' + batteryStateToString(e.state);
		l12.text = 'battery level:' + e.level;
	} else {
		//TODO: based on various reports from the google, you only get battery state changes
		//at 5% intervals.... to test this, you gotta unplug and leave your phone sitting for awhile
		var message = 'Battery Notification\n\nLevel: ' + e.level + ', State: '+batteryStateToString(e.state);
		Titanium.UI.createAlertDialog({title:'Platform', message:message}).show();
	}
});

Titanium.API.info("Current Phone Locale is "+Titanium.Platform.locale);
Titanium.API.info("OS name is " + Titanium.Platform.osname);

if (Titanium.Platform.osname == 'iphone' || Titanium.Platform.osname == 'ipad') {
	Titanium.API.info("Data network: " + Titanium.Platform.dataAddress);
	Titanium.API.info("Netmask: " + Titanium.Platform.netmask);
}
