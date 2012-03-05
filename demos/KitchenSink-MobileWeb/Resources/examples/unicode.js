var win = Ti.UI.currentWindow;
win.backgroundColor = '#EEE';

var button = Ti.UI.createButton({
	title: unescape('%u03A9') + ' Button with unicode symbols ' + unescape('%u0283') ,
	top:10,
	left: 10,
	width: 300,
	height: 50
});

win.add(button);

var отличнаяПеременная = 'This text defined by variable with Unicode name';

var label = Ti.UI.createLabel({
	top: 80,
	left: 10,
	width: 300,
	height: 50,
	color: 'red',
	text: отличнаяПеременная
});

win.add(label);

var closeButton = Ti.UI.createButton({
	title:'Close Window',
	height:50,
	width:300,
	top:130,
	left:10
});

closeButton.addEventListener('click', function(){
	Titanium.UI.currentWindow.close();
});



win.add(closeButton);

