var win = Titanium.UI.currentWindow;

var l = Ti.UI.createLabel({
	text:'',
	top:10,
	width:300,
	height:20,
	textAlign:'center'
});

win.add(l);

var l2 = Ti.UI.createLabel({
	text:'',
	top:30,
	height:20,
	textAlign:'center',
	width:300
});
win.add(l2);

var box = Titanium.UI.createView({
    height:50,
    width:50,
    backgroundColor:'#f00'
});
win.add(box);
win.addEventListener('touchstart', function(e)
{
	l.text = "touchstart " + e.x + ", " + e.y;
    Titanium.API.log("touchstart " + e.x + ", " + e.y); 
});

win.addEventListener('singletap', function(e)
{
	l2.text = "singletap " + e.x + ", " + e.y;
    Titanium.API.log("singletap " + e.x + ", " + e.y);
});



