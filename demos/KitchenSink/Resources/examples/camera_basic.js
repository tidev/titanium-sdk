var win = Titanium.UI.currentWindow;

var imageView = Titanium.UI.createImageView({
	height:200,
	width:200,
	top:20,
	left:10,
	backgroundColor:'#999'
});

win.add(imageView);

var thumbnailView = Titanium.UI.createImageView({
	height:50,
	width:50,
	top:240,
	left:10,
	backgroundColor:'#999'
});

win.add(thumbnailView);

Titanium.Media.showCamera({

	success:function(event)
	{
		var cropRect = event.cropRect;
		var image = event.media;
		var thumbnail = event.thumbnail;
		
		// set image view
		imageView.image = image;
		thumbnailView.image = thumbnail;
		
		Titanium.API.info('CAMERA SUCCESS cropRect.x ' + cropRect.x + ' cropRect.y ' + cropRect.y  + ' cropRect.height ' + cropRect.height + ' cropRect.width ' + cropRect.width);
		
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
			a.setMessage('Please run this test on device');
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
