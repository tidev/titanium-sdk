Titanium.Media.showCamera({

	success:function(event)
	{
		var cropRect = event.cropRect;
		var image = event.media;
		var thumbnail = event.thumbnail;

		// set image view
		//imageView.image = image;
		Titanium.API.info('CAMERA:  x ' + event.x + ' y ' + event.y + ' width ' + event.width + ' height ' + event.height);
		Titanium.API.info('CAMERA: media ' + event.media.mimeType);
		Titanium.API.info('CAMERA SUCCESS cropRect.x ' + cropRect.x + ' cropRect.y ' + cropRect.y  + ' cropRect.height ' + cropRect.height + ' cropRect.width ' + cropRect.width);

		Titanium.Media.previewImage({
			image : image,
			error : function(error) {
				Ti.UI.createNotification({message: error.message}).show();
			}
		});

	},
	cancel:function()
	{
		Ti.UI.createNotification({message:'Cancelled'}).show();
	},
	error:function(error)
	{
		// create alert
		var a = Titanium.UI.createAlertDialog({title:'Camera'});

		// set message
		if (error.code == Titanium.Media.NO_CAMERA)
		{
			a.setMessage('Device does not have camera capabilities');
		}
		else
		{
			a.setMessage('Unexpected error: ' + error.code);
		}

		// show alert
		a.show();
	},
	allowImageEditing:true,
});
