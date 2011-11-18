var win = Titanium.UI.currentWindow;
win.backgroundColor = '#EEE';

//
// BASIC SWITCH
//
var basicSearchbarLabel = Titanium.UI.createLabel({
	text: '' ,
	backgroundColor: '#FFF',
	color: '#999',
	font: {
		fontFamily: 'Helvetica Neue',
		fontSize: 15
	},
	top: 10,
	left: 10,
	height: 30,
	width: 'auto'
});

win.add(basicSearchbarLabel);

var search = Titanium.UI.createSearchBar({
	barColor: '#000',
	height: 43,
	top: 50,
	left: 10
});

win.add(search);

//
// FOCUS
//
var b1 = Titanium.UI.createButton({
	title: 'Focus Search Bar',
	height: 40,
	width: 200,
	top: 100,
	left: 10,
	fontSize: 20
});
win.add(b1);
b1.addEventListener('click', function() {
	search.focus();
});

//
// BLUR
//
var b2 = Titanium.UI.createButton({
	title: 'Blur Search Bar',
	height: 40,
	width: 200,
	top: 150,
	left: 10,
	fontSize: 20
});
win.add(b2);
b2.addEventListener('click', function() {
	search.blur();
});

//
// CHANGE THE VALUE
//
var b4 = Titanium.UI.createButton({
	title: 'Change Value',
	height: 40,
	width: 200,
	top: 200,
	left: 10,
	fontSize: 20
});
win.add(b4);
b4.addEventListener('click', function() {
	search.value = 'I have changed ' + Math.floor(Math.random() * 1000);
});

//
// HIDE/SHOW
//
var b5 = Titanium.UI.createButton({
	title: 'Hide/Show',
	height: 40,
	width: 200,
	top: 250,
	left: 10,
	fontSize:20
});
win.add(b5);
var visible = true;
b5.addEventListener('click', function() {
	visible ? search.hide() : search.show();
	visible = !visible;
});


var closeButton = Ti.UI.createButton({
	title: 'Close',
	height: 40,
	top: 300,
	left: 10,
	width: 200,
	fontSize: 20
});

closeButton.addEventListener('click', function() {
	Ti.UI.currentWindow.close();
});

win.add(closeButton);
//
// SEARCH BAR EVENTS
//
search.addEventListener('change', function(e) {
	basicSearchbarLabel.text = 'search bar: you type ' + e.value + ' act val ' + search.value;

});
search.addEventListener('return', function(e) {
	Titanium.UI.createAlertDialog({title:'Search Bar', message:'You typed ' + e.value }).show();
	search.blur();
});

search.addEventListener('focus', function(e) {
	basicSearchbarLabel.text = 'search bar: focus received';
});

search.addEventListener('blur', function(e) {
	basicSearchbarLabel.text = 'search bar:blur received';
});
