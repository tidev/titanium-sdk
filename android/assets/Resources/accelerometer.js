var win = Ti.UI.createWindow({
	backgroundColor : '#081d35'
});

var l1 = Ti.UI.createLabel({
	top : '5px', left : '10px', width : '20px', height : '20px',
	text : 'X:',
	color : 'white',
	font : 'sans-serif',
	fontWeight : 'bold',
	textAlignment : Ti.UI.TEXT_ALIGNMENT_LEFT
});

var vx = Ti.UI.createLabel({
	top : '5px', left : '35px', width : '200px', height : '20px',
	color : 'black',
	backgroundColor : 'white',
	font : 'monospace',
	fontWeight : 'bold',
	textAlignment : Ti.UI.TEXT_ALIGNMENT_RIGHT
});

var l2 = Ti.UI.createLabel({
	top : '30px', left : '10px', width : '20px', height : '20px',
	text : 'Y:',
	color : 'white',
	font : 'sans-serif',
	fontWeight : 'bold',
	textAlignment : Ti.UI.TEXT_ALIGNMENT_LEFT
});

var vy = Ti.UI.createLabel({
	top : '30px', left : '35px', width : '200px', height : '20px',
	color : 'black',
	backgroundColor : 'white',
	font : 'monospace',
	fontWeight : 'bold',
	textAlignment : Ti.UI.TEXT_ALIGNMENT_RIGHT
});

var l3 = Ti.UI.createLabel({
	top : '55px', left : '10px', width : '20px', height : '20px',
	text : 'Z:',
	color : 'white',
	font : 'sans-serif',
	fontWeight : 'bold',
	textAlignment : Ti.UI.TEXT_ALIGNMENT_LEFT
});

var vz = Ti.UI.createLabel({
	top : '55px', left : '35px', width : '200px', height : '20px',
	color : 'black',
	backgroundColor : 'white',
	font : 'monospace',
	fontWeight : 'bold',
	textAlignment : Ti.UI.TEXT_ALIGNMENT_RIGHT
});

win.add(l1);
win.add(vx);
win.add(l2);
win.add(vy);
win.add(l3);
win.add(vz);
win.open();

Ti.Accelerometer.addEventListener('update', function(e) {
	vx.text = e.x;
	vy.text = e.y;
	vz.text = e.z;
});
