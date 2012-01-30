var win = Titanium.UI.currentWindow;
win.backgroundColor = '#fff';

var v1 = Ti.UI.createView({
	height:40,
	left:10,
	top:10,
	layout:'horizontal'
});

Ti.UI.currentWindow.add(v1);

for (var i = 0; i < 20; i++) {
	var v = Ti.UI.createView({
		height:20,
		width:20,
		borderRadius:10,
		backgroundColor:'rgb(' + i*12 + ', 0, 0)'
	});
	v1.add(v);
}

var v2 = Ti.UI.createView({
	height:200,
	left:10,
	top:10,
	layout:'vertical'
});

Ti.UI.currentWindow.add(v2);

for (var i = 0; i < 5; i++) {
	var v = Ti.UI.createView({
		height:20,
		width:20,
		borderRadius:10,
		backgroundColor:'rgb(0, ' + i*50 + ', 0)'
	});
	v2.add(v);
}

var closeButton = Ti.UI.createButton({
	title:'Close Window',
	height:40,
	width:300,
	top:200,
	left:10,
	font:{fontSize:20}
});
Ti.UI.currentWindow.add(closeButton);

closeButton.addEventListener('click', function(){
	Ti.UI.currentWindow.close();
});
