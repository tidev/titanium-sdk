var currentWindow = Ti.UI.currentWindow;
currentWindow.backgroundColor = '#fff';


var l = Ti.UI.createLabel({
	text: "First window",
	fontSize: 30,
	top: 10,
	left: 10
});
currentWindow.add(l);

var openWindow2 = Ti.UI.createButton({
	title:'Open Second Window',
	height:40,
	top:50,
	left:10,
	width:300,
	font:{fontSize:20}
});
currentWindow.add(openWindow2);
openWindow2.addEventListener('click', function(){
	var w = Ti.UI.createWindow({url:'/examples/nested_windows2.js', backgroundColor:'blue'});
	w.open();
});

var closeWindow = Ti.UI.createButton({
	title:'Close Window',
	height:40,
	top:100,
	left:10,
	width:300,
	font:{fontSize:20}
});
currentWindow.add(closeWindow);
	
closeWindow.addEventListener('click', function(){
	Ti.UI.currentWindow.close();
});
