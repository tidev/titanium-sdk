var win = Titanium.UI.currentWindow;

var b1 = Titanium.UI.createButton({
	title:'Set App Badge',
	width:200,
	height:40,
	top:10
});
b1.addEventListener('click', function()
{
	Titanium.UI.iPhone.appBadge = 20;
});

win.add(b1);

var b2 = Titanium.UI.createButton({
	title:'Reset App Badge',
	width:200,
	height:40,
	top:60
});
b2.addEventListener('click', function()
{
	Titanium.UI.iPhone.appBadge = null;
});

win.add(b2);