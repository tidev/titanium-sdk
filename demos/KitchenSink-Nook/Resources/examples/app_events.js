var win = Titanium.UI.currentWindow;


var label = Ti.UI.createLabel({
	text:'No app event received. Make call while running app',
	textAlign:'center',
	width:'auto',
	font: {
		fontSize: 24	
	}
});

win.add(label);

var paused = false;

Titanium.App.addEventListener('pause',function(e)
{
	paused = true;
	label.text = "App has been paused";
});

Titanium.App.addEventListener('resume',function(e)
{
	if (paused)
	{
		label.text = "App has resumed";
	}
	else
	{
		label.text = "App has resumed (w/o pause)";
	}
});


