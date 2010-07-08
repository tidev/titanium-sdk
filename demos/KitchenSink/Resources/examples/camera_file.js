var win = Titanium.UI.currentWindow;


Titanium.Media.showCamera({

	success:function(event)
	{
		var cropRect = event.cropRect;
		var image = event.media;
		
		var f = Titanium.Filesystem.getFile(Titanium.Filesystem.applicationDataDirectory,'camera_photo.png');
		f.write(image);
		win.backgroundImage = f.nativePath;
	},
	cancel:function()
	{

	},
	error:function(error)
	{
		// create alert
		var a = Titanium.UI.createAlertDialog({title:'Camera'});

		// set message
		if (error.code == Titanium.Media.NO_CAMERA)
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
	allowEditing:true
});
