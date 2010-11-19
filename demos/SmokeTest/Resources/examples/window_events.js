// current window
var win = Titanium.UI.currentWindow;

var focusText = 'Focus not fired';
if (Titanium.App.Properties.getString('window_focus_event')!=null)
{
	focusText = 'Focus fired ' + Titanium.App.Properties.getString('window_focus_event');
}

var blurText = 'Blur not fired';
if (Titanium.App.Properties.getString('window_blur_event')!=null)
{
	blurText = 'Blur fired ' + Titanium.App.Properties.getString('window_blur_event');
}

var openText = 'Open not fired';
if (Titanium.App.Properties.getString('window_open_event'))
{
	openText = 'Open fired ' + Titanium.App.Properties.getString('window_open_event');
}

var closeText = 'Close not fired';
if (Titanium.App.Properties.getString('window_close_event'))
{
	closeText = 'Close fired ' + Titanium.App.Properties.getString('window_close_event');
}

//
// FOCUS LABEL
//
var focusLabel = Titanium.UI.createLabel({
	text:focusText,
	font:{
		fontFamily:'Helvetica Neue',
		fontSize:13
	},
	left:10,
	top:10,
	height:'auto',
	width:'auto'
});

win.add(focusLabel);

//
// BLUR LABEL
//
var blurLabel = Titanium.UI.createLabel({
	text:blurText,
	font:{
		fontFamily:'Helvetica Neue',
		fontSize:13
	},
	left:10,
	top:30,
	height:'auto',
	width:'auto'
});

win.add(blurLabel);

//
// OPEN LABEL
//
var openLabel = Titanium.UI.createLabel({
	text:openText,
	font:{
		fontFamily:'Helvetica Neue',
		fontSize:13
	},
	left:10,
	top:50,
	height:'auto',
	width:'auto'
});

win.add(openLabel);

//
// CLOSE LABEL
//
var closeLabel = Titanium.UI.createLabel({
	text:closeText,
	font:{
		fontFamily:'Helvetica Neue',
		fontSize:13
	},
	left:10,
	top:70,
	height:'auto',
	width:'auto'
});

win.add(closeLabel);


var l0 = Titanium.UI.createLabel({
	text:'try to trigger each event',
	bottom:50,
	width:300,
	height:'auto',
	textAlign:'center'
});

win.add(l0);

var l1 = Titanium.UI.createLabel({
	text:'touchstart not fired',
	top:90,
	left:10,
	width:300,
	height:'auto',
	font:{fontSize:14,fontFamily:'Helvetica Neue'}
});

win.add(l1);

var l2 = Titanium.UI.createLabel({
	text:'touchmove not fired',
	top:110,
	left:10,
	width:300,
	height:'auto',
	font:{fontSize:13,fontFamily:'Helvetica Neue'}
});

win.add(l2);

var l3 = Titanium.UI.createLabel({
	text:'touchend not fired',
	top:130,
	left:10,
	width:300,
	height:'auto',
	font:{fontSize:13,fontFamily:'Helvetica Neue'}
});

win.add(l3);

var l4 = Titanium.UI.createLabel({
	text:'touchcancel not fired',
	top:270,
	left:10,
	width:300,
	height:'auto',
	font:{fontSize:13,fontFamily:'Helvetica Neue'}
});

win.add(l4);

var l5 = Titanium.UI.createLabel({
	text:'singletap not fired',
	top:150,
	left:10,
	width:300,
	height:'auto',
	font:{fontSize:13,fontFamily:'Helvetica Neue'}
});

win.add(l5);

var l6 = Titanium.UI.createLabel({
	text:'doubletap not fired',
	top:170,
	left:10,
	width:300,
	height:'auto',
	font:{fontSize:13,fontFamily:'Helvetica Neue'}
});

win.add(l6);

var l7 = Titanium.UI.createLabel({
	text:'twofingertap not fired',
	top:190,
	left:10,
	width:300,
	height:'auto',
	font:{fontSize:13,fontFamily:'Helvetica Neue'}
});

win.add(l7);

var l8 = Titanium.UI.createLabel({
	text:'swipe not fired',
	top:210,
	left:10,
	width:300,
	height:'auto',
	font:{fontSize:13,fontFamily:'Helvetica Neue'}
});

win.add(l8);

var l9 = Titanium.UI.createLabel({
	text:'click not fired',
	top:230,
	left:10,
	width:300,
	height:'auto',
	font:{fontSize:13,fontFamily:'Helvetica Neue'}
});

win.add(l9);

var l10 = Titanium.UI.createLabel({
	text:'dblclick not fired',
	top:250,
	left:10,
	width:300,
	height:'auto',
	font:{fontSize:13,fontFamily:'Helvetica Neue'}
});

win.add(l10);

function pad (x)
{
	if (x < 10)
	{
		return '0' + x;
	}
	return x;
}
function formatTime()
{
	var date = new Date();
	var h = date.getHours();
	var m = date.getMinutes();
	var s = date.getSeconds();
	return pad(h) + ':' + pad(m) + ':' + pad(s);
}

//
//  EVENT LISTENERS
//
win.addEventListener('open', function()
{
	var date = formatTime();
	Titanium.App.Properties.setString('window_open_event', date);
	openLabel.text = 'Open fired ' + date;
});
win.addEventListener('close', function()
{
	var date = formatTime();
	Titanium.App.Properties.setString('window_close_event', date);
	closeLabel.text = 'Close fired ' + date;
});
win.addEventListener('focus', function()
{
	var date = formatTime();
	Titanium.App.Properties.setString('window_focus_event', date);
	focusLabel.text = 'Focus fired ' + date;
	Ti.API.info('FOCUS fired in window');
});
win.addEventListener('blur', function()
{
	var date = formatTime();
	Titanium.App.Properties.setString('window_blur_event',  date);
	blurLabel.text = 'Blur fired ' + date;
	Ti.API.info('BLUR fired in window');
});

win.addEventListener('touchstart', function(e)
{
	l1.color = 'red';
	l1.text = 'touchstart fired x ' + e.x + ' y ' + e.y;
	setTimeout(function()
	{
		l1.color = '#333';
	},200);
});
win.addEventListener('touchmove', function(e)
{
	l2.color = 'red';
	l2.text = 'touchmove fired x ' + e.x + ' y ' + e.y;
	setTimeout(function()
	{
		l2.color = '#333';
	},200);

});
win.addEventListener('touchend', function(e)
{
	l3.color = 'red';
	l3.text = 'touchend fired x ' + e.x + ' y ' + e.y;
	setTimeout(function()
	{
		l3.color = '#333';
	},200);
});
win.addEventListener('touchcancel', function(e)
{
	l4.color = 'red';
	l4.text = 'touchcancel fired x ' + e.x + ' y ' + e.y;
	setTimeout(function()
	{
		l4.color = '#333';
	},200);
});
win.addEventListener('singletap', function(e)
{
	l5.color = 'red';
	l5.text = 'singletap fired x ' + e.x + ' y ' + e.y;
	setTimeout(function()
	{
		l5.color = '#333';
	},200);
});
win.addEventListener('doubletap', function(e)
{
	l6.color = 'red';
	l6.text = 'doubletap fired x ' + e.x + ' y ' + e.y;
	setTimeout(function()
	{
		l6.color = '#333';
	},200);
});
win.addEventListener('twofingertap', function(e)
{
	l7.color = 'red';
	l7.text = 'twofingertap fired x ' + e.x + ' y ' + e.y;
	setTimeout(function()
	{
		l7.color = '#333';
	},200);
});
win.addEventListener('swipe', function(e)
{
	l8.color = 'red';
	l8.text = 'swipe fired x ' + e.x + ' y ' + e.y + ' direction ' + e.direction;
	setTimeout(function()
	{
		l8.color = '#333';
	},200);
});
win.addEventListener('click', function(e)
{
	l9.color = 'red';
	l9.text = 'click fired x ' + e.x + ' y ' + e.y;
	setTimeout(function()
	{
		l9.color = '#333';
	},200);
});
win.addEventListener('dblclick', function(e)
{
	l10.color = 'red';
	l10.text = 'dblclick fired x ' + e.x + ' y ' + e.y;
	setTimeout(function()
	{
		l10.color = '#333';
	},200);
});
