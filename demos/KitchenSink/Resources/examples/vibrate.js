var win = Titanium.UI.currentWindow;

var b1 = Titanium.UI.createButton({
	title:'Vibrate',
	height:40,
	width:300,
	top:10
});

win.add(b1);

b1.addEventListener('click', function()
{
	Titanium.Media.vibrate();	
});
