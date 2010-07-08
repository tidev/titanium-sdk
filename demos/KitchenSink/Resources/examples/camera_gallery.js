var win = Titanium.UI.currentWindow;


Titanium.Media.showCamera({

	success:function(event)
	{
		Titanium.UI.createAlertDialog({title:'Camera', message:'Check your Photo Gallery'}).show();
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
	saveToPhotoGallery:true,
	allowEditing:true
});
