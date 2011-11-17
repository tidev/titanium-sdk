var win = Titanium.UI.currentWindow;

var stopped = false;
var nextAnimation = null;
//
// create tip (window + view + label)
//
var winContainer = Titanium.UI.createWindow({
	height:30,
	width:200,
	bottom:100
});

var view = Titanium.UI.createView({
	backgroundColor:'#000',
	height:30,
	width:200,
	opacity:0.7,
	borderRadius:10
});
winContainer.add(view);

var label = Titanium.UI.createLabel({
	text:'Hovering tip...',
	color:'#fff',
	textAlign:'center',
	width:'auto',
	height:'auto'
});
winContainer.add(label);

//
// button to start animation
//
var button = Titanium.UI.createButton({
	title:'Start Animation',
	width:200,
	height:40,
	top:20
});
button.addEventListener('click', function()
{
	stopped = false;
	
	var a1 = Titanium.UI.createAnimation();
	a1.bottom = 120;
	a1.duration = 800;

	var a2 = Titanium.UI.createAnimation();
	a2.bottom = 80;
	a2.duration = 800;
	
	if (nextAnimation == null) {
		nextAnimation = a1;
	}
	winContainer.animate(nextAnimation);
	
	a1.addEventListener('complete', function()
	{
		if (!stopped)
		{
			winContainer.animate(nextAnimation);
			nextAnimation = a2;
		}
	});

	a2.addEventListener('complete', function()
	{
		if (!stopped)
		{
			winContainer.animate(nextAnimation);
			nextAnimation = a1;
		}
	});
	

});
win.add(button);

//
// button to stop animation
//
var button2 = Titanium.UI.createButton({
	title:'Stop Animation',
	width:200,
	height:40,
	top:70
});

button2.addEventListener('click', function()
{
	if (!stopped) 
	{
		stopped = true;
	}
});
win.add(button2);

// open container 
winContainer.open();

// add close listenr to close container
win.addEventListener('close', function()
{
	winContainer.close();
});