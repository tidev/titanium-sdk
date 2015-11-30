function gallery_file() {
	// Test of Tizen-specific Titanium.Media.saveToPhotoGallery.
	//Kitchen Sink path:  Phone - Save to Gallery - From File
	//Save the image to photoGallery from local file

	var win = Ti.UI.createWindow();
	var f = Titanium.Filesystem.getFile(Titanium.Filesystem.resourcesDirectory,'images/appcelerator_small.png');

	// Will fail on Tizen until https://jira.appcelerator.org/browse/TIMOB-12416 is fixed.

	Titanium.Media.saveToPhotoGallery(f, {
		success: function(e) {
			Titanium.UI.createAlertDialog({
				title:'Photo Gallery',
				message:'Check your photo gallery for an appcelerator logo'
			}).show();		
		},
		error: function() {
			Titanium.UI.createAlertDialog({
				title:'Error saving'
			}).show();
		}
	});
	return win;
};

module.exports = gallery_file;