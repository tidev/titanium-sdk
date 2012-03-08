var win = Titanium.UI.currentWindow;

var circle = Titanium.UI.createView({
	height:100,
	width:100,
	borderRadius:50,
	backgroundColor:'#336699',
	top:0,
	left:0
});

win.add(circle);

var a = Ti.UI.createAnimation();
a.top = 400;
a.left = 300;
a.duration = 10000;

var l = Ti.UI.createLabel({
	text:'N/A',
	bottom:10,
	height:20,
	color:'#999',
	textAlign:'center'
});

win.add(l);

var b = Ti.UI.createButton({
	title:'Stop Animation',
	height:30,
	width:200
});
win.add(b);
b.addEventListener('click', function()
{
	var newLeft = circle.animatedCenter.x - circle.width/2;
	var newTop =  circle.animatedCenter.y - circle.height/2;
	circle.animate({left:newLeft,top:newTop});
});
circle.animate(a, function()
{
	clearInterval(interval);
});

var interval = setInterval(function()
{
	l.text = 'center x: ' + circle.animatedCenter.x + ' y: ' + circle.animatedCenter.y;
},1000);

win.addEventListener('close', function() {
	clearInterval(interval);
});