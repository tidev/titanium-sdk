var win = Titanium.UI.currentWindow;

//
// REUSABLE ANIMATION WITH TRANSFORM
//
var t = Ti.UI.create2DMatrix();
t = t.rotate(90);

var a = Titanium.UI.createAnimation();
a.transform = t;
a.duration = 1000;
a.autoreverse = true;

//
// TOP LEFT
//
var view1 = Titanium.UI.createView({
	backgroundColor:'#336699',
	top:10,
	left:220,
	height:50,
	width:50,
	anchorPoint:{x:0,y:0}
});
win.add(view1);

var topLeft = Titanium.UI.createButton({
	title:'Top Left',
	height:40,
	width:200,
	top:10,
	left:10
});

topLeft.addEventListener('click', function()
{
	view1.animate(a);
});

win.add(topLeft);

//
// TOP RIGHT
//
var view2 = Titanium.UI.createView({
	backgroundColor:'#336699',
	top:80,
	left:220,
	height:50,
	width:50,
	anchorPoint:{x:1,y:0}
});
win.add(view2);

var topRight = Titanium.UI.createButton({
	title:'Top Right',
	height:40,
	width:200,
	top:80,
	left:10
});

topRight.addEventListener('click', function()
{
	view2.animate(a);
});

win.add(topRight);

//
// BOTTOM LEFT
//
var view3 = Titanium.UI.createView({
	backgroundColor:'#336699',
	top:150,
	left:220,
	height:50,
	width:50,
	anchorPoint:{x:0,y:1}
});
win.add(view3);

var bottomLeft = Titanium.UI.createButton({
	title:'Bottom Left',
	height:40,
	width:200,
	top:150,
	left:10
});

bottomLeft.addEventListener('click', function()
{
	view3.animate(a);
});

win.add(bottomLeft);

//
// BOTTOM RIGHT
//
var view4 = Titanium.UI.createView({
	backgroundColor:'#336699',
	top:220,
	left:220,
	height:50,
	width:50,
	anchorPoint:{x:1,y:1}
});
win.add(view4);
var bottomRight = Titanium.UI.createButton({
	title:'Bottom Right',
	height:40,
	width:200,
	top:220,
	left:10
});

bottomRight.addEventListener('click', function()
{
	view4.animate(a);	
});

win.add(bottomRight);

//
// CENTER
//
var view5 = Titanium.UI.createView({
	backgroundColor:'#336699',
	top:290,
	left:220,
	height:50,
	width:50,
	anchorPoint:{x:0.5,y:0.5}
});
win.add(view5);

var center = Titanium.UI.createButton({
	title:'Center',
	height:40,
	width:200,
	top:290,
	left:10
});

center.addEventListener('click', function()
{
	view5.animate(a);
});

win.add(center);

