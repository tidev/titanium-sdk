var win = Titanium.UI.currentWindow;

var b1 = Titanium.UI.createButton({
	title:'Hide/Show',
	width:200,
	height:40,
	top:10
});
var hidden = false;
b1.addEventListener('click', function()
{
	if (!hidden)
	{
		Titanium.UI.iPhone.hideStatusBar();
		hidden=true;
	}
	else
	{
		Titanium.UI.iPhone.showStatusBar();
		hidden=false;
	}
});

win.add(b1);

var b2 = Titanium.UI.createButton({
	title:'Toggle Style',
	width:200,
	height:40,
	top:60
});
var style=0;
b2.addEventListener('click', function()
{
	switch(style)
	{
		case 0:
			Titanium.UI.iPhone.statusBarStyle = Titanium.UI.iPhone.StatusBar.OPAQUE_BLACK;
			style++;
			break;
		case 1:
			Titanium.UI.iPhone.statusBarStyle = Titanium.UI.iPhone.StatusBar.GRAY;
			style++;
			break;
		case 2:
			Titanium.UI.iPhone.statusBarStyle = Titanium.UI.iPhone.StatusBar.TRANSLUCENT_BLACK;
			style++;
			break;
		case 3:
			Titanium.UI.iPhone.statusBarStyle = Titanium.UI.iPhone.StatusBar.DEFAULT;
			style=0;
			break;
	}
});
win.add(b2);