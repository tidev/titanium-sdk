var win = Titanium.UI.currentWindow;

var f = Ti.Filesystem.getFile(Titanium.Filesystem.resourcesDirectory,'images/apple_logo.jpg');

var imageView = Titanium.UI.createImageView({
	image:f,
	width:300,
	height:300,
	top:100
});

win.add(imageView);

var l = Titanium.UI.createLabel({
	text:'Click Image of Apple Logo',
	bottom:20,
	width:'auto',
	height:'auto',
	color:'#999',
	font: {
		fontSize:24	
	}
});
win.add(l);

imageView.addEventListener('click', function()
{
	Titanium.UI.createAlertDialog({title:'Image View', message:'You clicked me!', buttonNames:['OK']}).show();
});