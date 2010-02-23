var win = Titanium.UI.currentWindow;


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

var l = Ti.UI.createLabel({
	text:'',
	top:10,
	height:'auto',
	textAlign:'center'
});

win.add(l);

var l2 = Ti.UI.createLabel({
	text:'',
	top:30,
	height:'auto',
	textAlign:'center'
});
win.add(l2);

var box = Titanium.UI.createView({
    height:50,
    width:50,
    backgroundColor:'#f00'
});
win.add(box);

