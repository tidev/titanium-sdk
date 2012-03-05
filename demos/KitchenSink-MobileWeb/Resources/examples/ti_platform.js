var win = Titanium.UI.currentWindow;
win.backgroundColor = '#EEE';

var show = Ti.UI.createButton({
	title: 'Show',
	left: 90,
	top: 10,
	width: 140,
	height: 45,
	fontSize: 20
});

var close = Ti.UI.createButton({
	title: 'Close',
	left: 90,
	top: 60,
	width: 140,
	height: 45,
	fontSize: 20
});

var ta = Ti.UI.createTextArea({
	top: 110,
	left: 10,
	width: 300,
	height: 180,
	backgroundColor: 'white',
	fontSize: 18
});

win.add(show);
win.add(close);
win.add(ta);

close.addEventListener('click', function(){
	Titanium.UI.currentWindow.close();
});

show.addEventListener('click',function(){
	ta.value = 'Operation system: ' + Ti.Platform.osname + '\r\n';
	ta.value = ta.value + 'OS type: ' + Ti.Platform.ostype + '\r\n';
	ta.value = ta.value + 'Platform name: ' + Ti.Platform.name + '\r\n';
	ta.value = ta.value + 'Window height: ' + Ti.Platform.displayCaps.platformHeight + '\r\n';
	ta.value = ta.value + 'Window width: ' + Ti.Platform.displayCaps.platformWidth + '\r\n';
});
