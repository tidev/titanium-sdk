var win = Titanium.UI.currentWindow;

var f = Ti.Filesystem.getFile(Titanium.Filesystem.resourcesDirectory,'images/apple_logo.jpg');

var imageView = Titanium.UI.createImageView({
	image:f,
	width:24,
	height:24,
	top:100
});

win.add(imageView);

var l = Titanium.UI.createLabel({
	text:'Click Image of Appcelerator Logo',
	bottom:20,
	width:'auto',
	height:'auto',
	color:'#999'
});
win.add(l);

imageView.addEventListener('click', function()
{
	Titanium.UI.createAlertDialog({title:'Image View', message:'You clicked me!'}).show();
});