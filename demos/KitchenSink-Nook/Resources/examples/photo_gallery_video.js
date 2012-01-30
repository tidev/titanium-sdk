Titanium.Media.showCamera({

	success:function(event)
	{
		var video = event.media;
		Titanium.Media.saveToPhotoGallery(video,{
			success: function(e) {
				Titanium.UI.createAlertDialog({
					title:'Photo Gallery',
					message:'Check your photo gallery for your video'
				}).show();		
			},
			error: function(e) {
				Titanium.UI.createAlertDialog({
					title:'Error saving',
					message:e.error
				}).show();
			}
		});
	},
	cancel:function()
	{

	},
	error:function(error)
	{
		// create alert
		var a = Titanium.UI.createAlertDialog({title:'Video'});

		// set message
		if (error.code == Titanium.Media.NO_VIDEO)
		{
			a.setMessage('Device does not have video recording capabilities');
		}
		else
		{
			a.setMessage('Unexpected error: ' + error.code);
		}

		// show alert
		a.show();
	},
	mediaTypes: Titanium.Media.MEDIA_TYPE_VIDEO,
	videoMaximumDuration:10000,
	videoQuality:Titanium.Media.QUALITY_HIGH
});
