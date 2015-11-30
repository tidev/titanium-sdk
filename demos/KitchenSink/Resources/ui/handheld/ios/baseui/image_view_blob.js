function image_view_blog(_args) {
	var win = Titanium.UI.createWindow({
		title:_args.title
	});
	
	// start a blob async and notify callback when completed
	_args.tabGroup.toImage(function(e)
	{
		Ti.API.info("tiGroup blob has been rendered: "+e.blob.width+"x"+e.blob.height);
	});
	
	//
	//  you can call toImage() on any view and get a blob  
	//	then pass the blob to an image view via the image property
	//
	var imageView = Titanium.UI.createImageView({
		image:_args.tabGroup.toImage(),
		width:200,
		height:300,
		top:20
	});
	
	win.add(imageView);
	
	var l = Titanium.UI.createLabel({
		text:'Click Image of Tab Group',
		bottom:20,
		color:'#999',
		width:Ti.UI.SIZE,
		height:Ti.UI.SIZE
	});
	win.add(l);
	
	imageView.addEventListener('click', function()
	{
		Titanium.UI.createAlertDialog({title:'Image View', message:'You clicked me!'}).show();
	});
	
	return win;
};

module.exports = image_view_blog;