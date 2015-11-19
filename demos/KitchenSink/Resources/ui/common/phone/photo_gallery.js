var popoverView, arrowDirection, imageView;

function openGallery() {
	Titanium.Media.openPhotoGallery({
	
		success:function(event)
		{
			var cropRect = event.cropRect;
			var image = event.media;
	
			// set image view
			Ti.API.debug('Our type was: '+event.mediaType);
			if(event.mediaType == Ti.Media.MEDIA_TYPE_PHOTO)
			{
				imageView.image = image;
			}
			else
			{
				// is this necessary?
			}
	
			Titanium.API.info('PHOTO GALLERY SUCCESS cropRect.x ' + cropRect.x + ' cropRect.y ' + cropRect.y  + ' cropRect.height ' + cropRect.height + ' cropRect.width ' + cropRect.width);
	
		},
		cancel:function()
		{
	
		},
		error:function(error)
		{
		},
		allowEditing:true,
		popoverView:popoverView,
		arrowDirection:arrowDirection,
		mediaTypes:[Ti.Media.MEDIA_TYPE_VIDEO,Ti.Media.MEDIA_TYPE_PHOTO]
	});
}

function photo_gallery(_args) {
	var win = Titanium.UI.createWindow({
		title:_args.title
	});
	imageView = Titanium.UI.createImageView({
		height:200,
		width:200,
		top:20,
		left:10,
		backgroundColor:'#999'
	});
	win.add(imageView);
	
	if (Titanium.Platform.osname == 'ipad')
	{
		// photogallery displays in a popover on the ipad and we
		// want to make it relative to our image with a left arrow
		arrowDirection = Ti.UI.iPad.POPOVER_ARROW_DIRECTION_LEFT;
		popoverView = imageView;
	}
	
	win.addEventListener('open', function(e) {
		openGallery();	
	});	
	
	return win;
};

module.exports = photo_gallery;
