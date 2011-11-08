var win = Ti.UI.currentWindow;

var v1 = Ti.UI.createView({
	height:100,
	width:400,
	backgroundColor:'#336699',
	top:10,
	borderRadius:10
});

win.add(v1);

var v2 = Ti.UI.createView({
	height:100,
	width:400,
	backgroundColor:'#ff0000',
	top:120,
	borderRadius:10
});

win.add(v2);

var v3 = Ti.UI.createWebView({
	height:100,
	width:400,
	backgroundColor:'#ff9900',
	top:230,
	borderRadius:10,
	html:'<html><body><div style="color:#fff;text-align:center">FOO</div></body></html>'
});

win.add(v3);

var b1 = Ti.UI.createButton({
	height:50,
	width:200,
	title:'Remove View 1',
	top:340
});

win.add(b1);

b1.addEventListener('click', function()
{
	win.remove(v1);
});

var b2 = Ti.UI.createButton({
	height:50,
	width:200,
	title:'Remove View 2',
	top:400
});

win.add(b2);

b2.addEventListener('click', function()
{
	win.remove(v2);
});
var b3 = Ti.UI.createButton({
	height:50,
	width:200,
	title:'Remove View 3',
	top:460
});

win.add(b3);

b3.addEventListener('click', function()
{
	win.remove(v3);
});
