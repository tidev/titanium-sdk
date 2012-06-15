var win = Titanium.UI.currentWindow;
win.backgroundImage = '../images/corkboard.jpg';

var image1 = Titanium.UI.createView({
	backgroundImage:'../images/smallpic1.jpg',
	height:75,
	width:75,
	top:40,
	left:50,
	borderWidth:3,
	borderColor:'#fff',
	zIndex:1
});

win.add(image1);

var scaled1 = false;
image1.addEventListener('click', function()
{
	var t = Titanium.UI.create2DMatrix();

	if (!scaled1)
	{
		t = t.scale(4.0);
		var newLeft = (Ti.Platform.displayCaps.platformWidth-75)/2;
		var newTop = (Ti.Platform.displayCaps.platformHeight-75)/2;
		image1.animate({transform:t,left:newLeft,top:newTop,zIndex:10,duration:500});
		scaled1 = true;
	}
	else
	{
		image1.animate({transform:t,left:50,top:40,zIndex:1,duration:500});
		scaled1 = false;
	}
	
});

var image2 = Titanium.UI.createView({
	backgroundImage:'../images/smallpic2.jpg',
	height:75,
	width:75,
	top:30,
	right:50,
	borderWidth:3,
	borderColor:'#fff',
	zIndex:1
});

win.add(image2);

var scaled2 = false;
image2.addEventListener('click', function()
{
	var t = Titanium.UI.create2DMatrix();
	if (!scaled2)
	{
		t = t.scale(4.0);
		var newLeft = (Ti.Platform.displayCaps.platformWidth-75)/2;
		var newTop = (Ti.Platform.displayCaps.platformHeight-75)/2;
		image2.animate({transform:t,right:newLeft,top:newTop,zIndex:10,duration:500});
		scaled2 = true;
	}
	else
	{
		image2.animate({transform:t,top:30,right:50,zIndex:1,duration:500});
		scaled2 = false;
	}
});

var image3 = Titanium.UI.createView({
	backgroundImage:'../images/smallpic3.jpg',
	height:75,
	width:75,
	top:200,
	left:120,
	borderWidth:3,
	borderColor:'#fff',
	zIndex:1
});

win.add(image3);

var scaled3 = false;
image3.addEventListener('click', function()
{
	var t = Titanium.UI.create2DMatrix();
	if (!scaled3)
	{
		t = t.scale(4.0);
		var newLeft = (Ti.Platform.displayCaps.platformWidth-75)/2;
		var newTop = (Ti.Platform.displayCaps.platformHeight-75)/2;
		image3.animate({transform:t,left:newLeft,top:newTop,zIndex:10,duration:500});
		scaled3 = true;
	}
	else
	{
		image3.animate({transform:t,left:120,top:200,zIndex:1,duration:500});
		scaled3 = false;
	}
});

var label = Titanium.UI.createLabel({
	text:'Click images to toggle scale',
	color:'#fff',
	bottom:20,
	width:'auto',
	height:'auto',
	textAlign:'center'
});

win.add(label);