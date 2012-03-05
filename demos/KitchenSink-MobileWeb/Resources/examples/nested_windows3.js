var currentWindow = Ti.UI.currentWindow;

var l = Ti.UI.createLabel({
	text: "Third window",
	fontSize: 30,
	top: 10,
	left: 10
});
currentWindow.add(l);

var closeWindow = Ti.UI.createButton({
	title:'Close Window',
	height:40,
	top:50,
	left:10,
	width:300,
	font:{fontSize:20}
});
currentWindow.add(closeWindow);
	
closeWindow.addEventListener('click', function(){
	Ti.UI.currentWindow.close();
});
