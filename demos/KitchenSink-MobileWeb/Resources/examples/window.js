var currentWindow = Titanium.UI.currentWindow;
currentWindow.backgroundColor = '#fff';

var view = Ti.UI.createView({
	layout:'vertical',
	top:10,
	width:320,
	height:400
});
currentWindow.add(view);

if (Ti.Platform.isBrowser){
	var htmlButton = Ti.UI.createButton({
		title:'Open remote HTML',
		height:40,
		top:10,
		left:10,
		width:300,
		font:{fontSize:20}
	});
	view.add(htmlButton);

	htmlButton.addEventListener('click', function()
	{
		var w = Ti.UI.createWindow({url:'examples/window.html'});
		w.open();
	});
	
}

var jsButton = Ti.UI.createButton({
	title:'Open JS Window',
	height:40,
	top:10,
	left:10,
	width:300,
	font:{fontSize:20}
});
view.add(jsButton);

jsButton.addEventListener('click', function()
{
	//TODO - make path hanlding consistent
	var url = (Ti.Platform.isBrowser)?'examples/window_url.js':'window_url.js';
	var w = Ti.UI.createWindow({backgroundColor:'blue', url:url});
	w.open();
});

var emptyButton = Ti.UI.createButton({
	title:'No URL',
	height:40,
	top:10,
	left:10,
	width:300,
	font:{fontSize:20}
});
view.add(emptyButton);

emptyButton.addEventListener('click', function()
{
	var w = Ti.UI.createWindow({backgroundColor:'red'});
	
	var closeButton = Ti.UI.createButton({
		title:'Close Window',
		height:40,
		width:300,
		top:10,
		left:10,
		font:{fontSize:20}
	});
	w.add(closeButton);

	closeButton.addEventListener('click', function()
	{
		w.close();
	});
	w.open();
});

var changeButton = Ti.UI.createButton({
	title:'Change title',
	height:40,
	top:10,
	left:10,
	width:300,
	font:{fontSize:20}
});
view.add(changeButton);

var beerCounter = 99;
changeButton.addEventListener('click', function() {
	currentWindow.title = (beerCounter > 0 ? beerCounter-- : "No more") + " bottles of beer on the wall";
});

var closeButton = Ti.UI.createButton({
	title:'Close Window',
	height:40,
	width:300,
	top:10,
	left:10,
	font:{fontSize:20}
});
view.add(closeButton);

closeButton.addEventListener('click', function(){
	Titanium.UI.currentWindow.close();
});

