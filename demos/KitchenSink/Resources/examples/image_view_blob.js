var win = Titanium.UI.currentWindow;

//
//  you can call toImage() on any view and get a blob  
//	then pass the blob to an image view via the image property
//
var imageView = Titanium.UI.createImageView({
	image:win.tabGroup.toImage(),
	width:200,
	height:300,
	top:20
});

win.add(imageView);

var l = Titanium.UI.createLabel({
	text:'Click Image of Tab Group',
	bottom:20,
	color:'#999',
	width:'auto',
	height:'auto'
});
win.add(l);

imageView.addEventListener('click', function()
{
	Titanium.UI.createAlertDialog({title:'Image View', message:'You clicked me!'}).show();
});