
var section1 = Ti.UI.createTableViewSection({
	headerTitle:'Header 1'
});
for (var i=0; i < 4; i++) {
	section1.add(Ti.UI.createTableViewRow({
		title:'Row '+i
	}));
}

var section2 = Ti.UI.createTableViewSection();
for (var i=4; i < 10; i++) {
	section2.add(Ti.UI.createTableViewRow({
		title:'Row '+i
	}));
}

var tv = Ti.UI.createTableView({
	data:[section1,section2],
	top: 10,
	left: 10,
	height: 300,
	width: 300
});
Ti.UI.currentWindow.add(tv);



var closeButton = Ti.UI.createButton({
	title:'Close Window',
	height:40,
	width:300,
	top: 320,
	left:10,
	font:{fontSize:20}
});

closeButton.addEventListener('click', function(){
	Titanium.UI.currentWindow.close();
});

Ti.UI.currentWindow.add(closeButton);
