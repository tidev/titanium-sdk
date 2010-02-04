var win = Ti.UI.createWindow({
	backgroundColor : '#081d35'
});

var l1 = Ti.UI.createLabel({
	top : '5px', left : '10px', width : '100px', height : '40px',
	text : 'Label 1:',
	color : 'red',
	highlightedColor : 'blue',
	font : 'monospace',
	textAlignment : Ti.UI.TEXT_ALIGNMENT_LEFT
});

var l2 = Ti.UI.createLabel({
	top : '55px', left : '10px', width : '100px', height : '40px',
	text : 'Label 1:',
	color : 'red',
	backgroundColor : 'white',
	highlightedColor : 'blue',
	font : 'serif',
	textAlignment : Ti.UI.TEXT_ALIGNMENT_CENTER
});

var l3 = Ti.UI.createLabel({
	top : '105px', left : '10px', width : '100px', height : '40px',
	text : 'Label 1:',
	color : 'blue',
	backgroundColor : 'yellow',
	highlightedColor : 'blue',
	font : 'sans-serif',
	textAlignment : Ti.UI.TEXT_ALIGNMENT_RIGHT
});
win.add(l1);
win.add(l2);
win.add(l3);
win.open();
