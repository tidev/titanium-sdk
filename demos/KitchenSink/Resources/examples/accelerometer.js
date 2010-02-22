var win = Titanium.UI.currentWindow;

var x = Titanium.UI.createLabel({
	text:'x:',
	top:10,
	left:10,
	font:{fontSize:14},
	color:'#555',
	width:300,
	height:'auto'
});
win.add(x);

var y = Titanium.UI.createLabel({
	text:'y:',
	top:30,
	left:10,
	font:{fontSize:14},
	color:'#555',
	width:300,
	height:'auto'
});
win.add(y);

var z = Titanium.UI.createLabel({
	text:'z:',
	top:50,
	left:10,
	font:{fontSize:14},
	color:'#555',
	width:300,
	height:'auto'
});
win.add(z);

var ts = Titanium.UI.createLabel({
	text:'timestamp:',
	top:70,
	left:10,
	font:{fontSize:14},
	color:'#555',
	width:300,
	height:'auto'
});
win.add(ts);


Ti.Accelerometer.addEventListener('update',function(e)
{
	ts.text = e.timestamp;
	x.text = 'x: ' + e.x;
	y.text = 'y:' + e.y;
	z.text = 'z:' + e.z;
});
