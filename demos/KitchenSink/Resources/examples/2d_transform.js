var win = Titanium.UI.currentWindow;
win.backgroundColor = '#13386c';

//
// CREATE TWO CLOUDS
//
var t1 = Titanium.UI.create2DMatrix().scale(0.4);
var cloud1 = Titanium.UI.createView({
	backgroundImage:'../images/cloud.png',
	height:178,
	width:261,
	top:10,
	transform:t1
});

win.add(cloud1);

var t2 = Titanium.UI.create2DMatrix().scale(0.2);
var cloud2 = Titanium.UI.createView({
	backgroundImage:'../images/cloud.png',
	height:178,
	width:261,
	top:130,
	left:75,
	transform:t2
});

win.add(cloud2);


//
// START ANIMATION BUTTON
//
var button = Titanium.UI.createButton({
	title:'Animate',
	width:200,
	height:40,
	bottom:20
});

button.addEventListener('click', function()
{
	// cloud 1 animation/transform
	var t3 = Ti.UI.create2DMatrix();
	t3 = t3.rotate(20);
	t3 = t3.scale(1.5);

	var a = Titanium.UI.createAnimation();
	a.transform = t3;
	a.duration = 3000;
	a.autoreverse = true;
	a.repeat = 3;
	cloud1.animate(a);

	// cloud 2 animation/transform
	var t4 = Ti.UI.create2DMatrix();
	t4 = t4.rotate(-30);
	t4 = t4.scale(1.5);
	
	var a2 = Titanium.UI.createAnimation();
	a2.transform = t4;
	a2.duration = 3000;
	a2.autoreverse = true;
	a2.repeat = 3;
	a2.delay = 1500;
	cloud2.animate(a2);
});

win.add(button);
