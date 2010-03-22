var win = Titanium.UI.currentWindow;
win.backgroundColor = '#13386c';

//
// SCALE
//
var button = Titanium.UI.createButton({
	title:'Animate (Scale)',
	width:200,
	height:40,
	top:20
});

button.addEventListener('click', function()
{
	var t1 = Ti.UI.create2DMatrix();
	t1 = t1.scale(0.001);
	var a1 = Titanium.UI.createAnimation();
	a1.transform = t1;
	a1.duration = 500;
	win.animate(a1);
	
	a1.addEventListener('complete', function()
	{
		// simple reset animation
		var t2 = Ti.UI.create2DMatrix();
		var a2 = Titanium.UI.createAnimation();
		a2.transform = t2;
		a2.duration = 500;
		win.animate(a2);
		
	});
});

win.add(button);

//
//  SLIDE
//
var button2 = Titanium.UI.createButton({
	title:'Animate (Slide)',
	width:200,
	height:40,
	top:70
});

button2.addEventListener('click', function()
{
	// use inline style
	win.animate({right:-320, duration:500}, function()
	{
		win.animate({right:0, left:-320, duration:500}, function()
		{
			win.animate({right:0, left:0, duration:500});
		});
	});
});

win.add(button2);

//
//  CUSTOM
//
var button3 = Titanium.UI.createButton({
	title:'Animate (Custom)',
	width:200,
	height:40,
	top:120
});

button3.addEventListener('click', function()
{
	var t1 = Ti.UI.create3DMatrix();
	t1 = t1.scale(0.00001);
	t1 = t1.rotate(180,0,0,1);
	var a1 = Titanium.UI.createAnimation();
	a1.transform = t1;
	a1.duration = 500;
	win.animate(a1);
	
	a1.addEventListener('complete', function()
	{
		// simply reset animation
		var t2 = Ti.UI.create3DMatrix();
		var a2 = Titanium.UI.createAnimation();
		a2.transform = t2;
		a2.duration = 500;
		win.animate(a2);
		
	});
});

win.add(button3);