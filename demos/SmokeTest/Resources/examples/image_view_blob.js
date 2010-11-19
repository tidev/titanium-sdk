var win = Titanium.UI.currentWindow;

// start a blob async and notify callback when completed
win.tabGroup.toImage(function(e)
{
	Ti.API.info("tiGroup blob has been rendered: "+e.blob.width+"x"+e.blob.height);
});

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