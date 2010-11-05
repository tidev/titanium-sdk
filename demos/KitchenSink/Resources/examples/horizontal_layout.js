var win = Ti.UI.currentWindow;

var view = Ti.UI.createView({
	height:300,
	width:320,
	layout:'horizontal'
});
win.add(view);

var l1 = Ti.UI.createLabel({
	text:'I am the first label',
	left:5,
	width:'auto',
	height:20
});

view.add(l1);

var l2 = Ti.UI.createLabel({
	text:'I am the second label',
	left:2,
	width:'auto',
	height:20
});

view.add(l2);

var l3 = Ti.UI.createLabel({
	text:'I am the third label',
	left:2,
	width:'auto',
	height:20
});

view.add(l3);