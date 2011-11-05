var f = Titanium.Filesystem.getFile(Titanium.Filesystem.resourcesDirectory,'images/appcelerator_small.png');

Titanium.Media.saveToPhotoGallery(f,{
	success: function(e) {
		Titanium.UI.createAlertDialog({
			title:'Photo Gallery',
			message:'Check your photo gallery for an appcelerator logo'
		}).show();		
	},
	error: function(e) {
		Titanium.UI.createAlertDialog({
			title:'Error saving',
			message:e.error
		}).show();
	}
});

