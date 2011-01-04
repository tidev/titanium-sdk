var win = Ti.UI.currentWindow;
var view = Ti.UI.createView({
	height: '100%',
	width: '100%',
	backgroundColor: 'white'
});
win.add(view);

view.add(Ti.UI.createLabel({
	left: 0, top: 5,
	width: '150px',
	backgroundColor: 'orange',
	color: 'black',
	text: 'left: 0, top: 5, width: 150px'
}));

view.add(Ti.UI.createLabel({
	left: 100, top: '10%',
	width: '75pt',
	backgroundColor: 'orange',
	color: 'black',
	text: 'left: 100, top: 10%, width: 75pt'
}));

view.add(Ti.UI.createLabel({
	left: 0, top: '20%',
	width: '100%',
	height: '5%',
	backgroundColor: 'orange',
	color: 'black',
	text: 'left: 0, top: 20%, width: 100%, height: 5%'
}));

view.add(Ti.UI.createLabel({
	left: '8mm', top: '100pt',
	width: '150sp',
	backgroundColor: 'orange',
	color: 'black',
	text: 'left: 8mm, top: 100pt, width: 150sp'
}));

view.add(Ti.UI.createLabel({
	left: '0.2in', top: 275,
	width: '150dip',
	backgroundColor: 'orange',
	color: 'black',
	text: 'left: 0.2in, top: 275, width: 150dip'
}));

view.add(Ti.UI.createLabel({
	center: 0, bottom: '40%',
	width: '75pt',
	backgroundColor: 'orange',
	color: 'black',
	text: 'center: 0, bottom: 40%, width: 75pt'
}));

view.add(Ti.UI.createLabel({
	center: '10%', bottom: '30%',
	width: '75pt',
	backgroundColor: 'orange',
	color: 'black',
	text: 'center: 10%, bottom: 30%, width: 75pt'
}));

view.add(Ti.UI.createLabel({
	left: 0,
	bottom: '20%',
	width: '50%',
	backgroundColor: 'orange',
	color: 'black',
	text: 'left:0, bottom: 20%, width: 50%'
}));

view.add(Ti.UI.createLabel({
	left: '50%',
	bottom: '10%',
	width: '50%',
	backgroundColor: 'orange',
	color: 'black',
	text: 'left: 50%, bottom: 10%, width: 50%'
}));

win.open();
