var win = Titanium.UI.currentWindow;

var view = Titanium.UI.createView();

win.add(view);

var l0 = Titanium.UI.createLabel({
	text:'try to trigger each event',
	bottom:50,
	width:300,
	textAlign:'center',
	height:'auto'
});

view.add(l0);

var l1 = Titanium.UI.createLabel({
	text:'touchstart not fired',
	top:10,
	width:300,
	height:'auto',
	font:{fontSize:14,fontFamily:'Helvetica Neue'}
});

view.add(l1);

var l2 = Titanium.UI.createLabel({
	text:'touchmove not fired',
	top:30,
	left:10,
	width:300,
	height:'auto',
	font:{fontSize:13,fontFamily:'Helvetica Neue'}
});

view.add(l2);

var l3 = Titanium.UI.createLabel({
	text:'touchend not fired',
	top:50,
	left:10,
	width:300,
	height:'auto',
	font:{fontSize:13,fontFamily:'Helvetica Neue'}
});

view.add(l3);

var l4 = Titanium.UI.createLabel({
	text:'touchcancel not fired',
	top:190,
	left:10,
	width:300,
	height:'auto',
	font:{fontSize:13,fontFamily:'Helvetica Neue'}
});

view.add(l4);

var l5 = Titanium.UI.createLabel({
	text:'singletap not fired',
	top:90,
	left:10,
	width:300,
	height:'auto',
	font:{fontSize:13,fontFamily:'Helvetica Neue'}
});

view.add(l5);

var l6 = Titanium.UI.createLabel({
	text:'doubletap not fired',
	top:110,
	left:10,
	width:300,
	height:'auto',
	font:{fontSize:13,fontFamily:'Helvetica Neue'}
});

view.add(l6);

var l7 = Titanium.UI.createLabel({
	text:'twofingertap not fired',
	top:130,
	left:10,
	width:300,
	height:'auto',
	font:{fontSize:13,fontFamily:'Helvetica Neue'}
});

view.add(l7);

var l8 = Titanium.UI.createLabel({
	text:'swipe not fired',
	top:150,
	left:10,
	width:300,
	height:'auto',
	font:{fontSize:13,fontFamily:'Helvetica Neue'}
});

view.add(l8);

var l9 = Titanium.UI.createLabel({
	text:'click not fired',
	top:170,
	left:10,
	width:300,
	height:'auto',
	font:{fontSize:13,fontFamily:'Helvetica Neue'}
});

view.add(l9);

var l10 = Titanium.UI.createLabel({
	text:'dblclick not fired',
	top:70,
	left:10,
	width:300,
	height:'auto',
	font:{fontSize:13,fontFamily:'Helvetica Neue'}
});

view.add(l10);

view.addEventListener('touchstart', function(e)
{
	l1.color = 'red';
	l1.text = 'touchstart fired x ' + e.x + ' y ' + e.y + " ("+e.globalPoint.x+","+e.globalPoint.y+")";
	setTimeout(function()
	{
		l1.color = '#333';
	},200);
});
view.addEventListener('touchmove', function(e)
{
	l2.color = 'red';
	l2.text = 'touchmove fired x ' + e.x + ' y ' + e.y + " ("+e.globalPoint.x+","+e.globalPoint.y+")";
	setTimeout(function()
	{
		l2.color = '#333';
	},200);

});
view.addEventListener('touchend', function(e)
{
	l3.color = 'red';
	l3.text = 'touchend fired x ' + e.x + ' y ' + e.y + " ("+e.globalPoint.x+","+e.globalPoint.y+")";
	setTimeout(function()
	{
		l3.color = '#333';
	},200);
});
view.addEventListener('touchcancel', function(e)
{
	l4.color = 'red';
	l4.text = 'touchcancel fired x ' + e.x + ' y ' + e.y + " ("+e.globalPoint.x+","+e.globalPoint.y+")";
	setTimeout(function()
	{
		l4.color = '#333';
	},200);
});
view.addEventListener('singletap', function(e)
{
	l5.color = 'red';
	l5.text = 'singletap fired x ' + e.x + ' y ' + e.y + " ("+e.globalPoint.x+","+e.globalPoint.y+")";
	setTimeout(function()
	{
		l5.color = '#333';
	},200);
});
view.addEventListener('doubletap', function(e)
{
	l6.color = 'red';
	l6.text = 'doubletap fired x ' + e.x + ' y ' + e.y + " ("+e.globalPoint.x+","+e.globalPoint.y+")";
	setTimeout(function()
	{
		l6.color = '#333';
	},200);
});
view.addEventListener('twofingertap', function(e)
{
	l7.color = 'red';
	l7.text = 'twofingertap fired x ' + e.x + ' y ' + e.y + " ("+e.globalPoint.x+","+e.globalPoint.y+")";
	setTimeout(function()
	{
		l7.color = '#333';
	},200);
});
view.addEventListener('swipe', function(e)
{
	l8.color = 'red';
	l8.text = 'swipe fired x ' + e.x + ' y ' + e.y + " ("+e.globalPoint.x+","+e.globalPoint.y+") direction " + e.direction;
	setTimeout(function()
	{
		l8.color = '#333';
	},200);
});
view.addEventListener('click', function(e)
{
	l9.color = 'red';
	l9.text = 'click fired x ' + e.x + ' y ' + e.y + " ("+e.globalPoint.x+","+e.globalPoint.y+")";
	setTimeout(function()
	{
		l9.color = '#333';
	},200);
});
view.addEventListener('dblclick', function(e)
{
	l10.color = 'red';
	l10.text = 'dblclick fired x ' + e.x + ' y ' + e.y + " ("+e.globalPoint.x+","+e.globalPoint.y+")";
	setTimeout(function()
	{
		l10.color = '#333';
	},200);
});

