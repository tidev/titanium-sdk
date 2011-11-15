var win = Titanium.UI.currentWindow;
win.backgroundColor = '#eee';

var warningLabel = Ti.UI.createLabel({
	top: 10,
	left: 10,
	color: 'red',
	width: 300,
	height: 70,
	fontSize: 20,
	text: 'This demo works only on mobile device with working accelerometer' 
});

win.add(warningLabel);

var x = Titanium.UI.createLabel({
	text:'x:',
	top:80,
	left:10,
	font:{fontSize:14},
	color:'#555',
	width:300,
	height:'auto'
});
win.add(x);

var y = Titanium.UI.createLabel({
	text:'y:',
	top:100,
	left:10,
	font:{fontSize:14},
	color:'#555',
	width:300,
	height:'auto'
});
win.add(y);

var z = Titanium.UI.createLabel({
	text:'z:',
	top:120,
	left:10,
	font:{fontSize:14},
	color:'#555',
	width:300,
	height:'auto'
});
win.add(z);

var ts = Titanium.UI.createLabel({
	text:'timestamp:',
	top:170,
	left:10,
	font:{fontSize:14},
	color:'#555',
	width:300,
	height:'auto'
});
win.add(ts);

var accelerometerCallback = function(e) {
	
	ts.text = 'timestamp: ' + e.timestamp;
	x.text = 'x: ' + e.x;
	y.text = 'y:' + e.y;
	z.text = 'z:' + e.z;
}

Ti.Accelerometer.addEventListener('update', accelerometerCallback);

var closeButton = Ti.UI.createButton({
	title:'Close Window',
	height:40,
	width:300,
	left:10,
	top:210,
	font:{fontSize:20}
});
win.add(closeButton);

closeButton.addEventListener('click', function(){
	win.close();
});
