function gallery_cam(_args) {
	var win = Ti.UI.createWindow({
		title:_args.title
	});

	function showCamera() {
		win.removeEventListener('focus', showCamera);
		Titanium.Media.showCamera({
			success:function(event) {
				var cropRect = event.cropRect;
				var image = event.media;
				
				Titanium.Media.saveToPhotoGallery(image);
				
				Titanium.UI.createAlertDialog({title:'Photo Gallery',message:'Check your photo gallery'}).show();		
			},
			cancel:function() {
		
			},
			error:function(error) {
				// create alert
				var a = Titanium.UI.createAlertDialog({title:'Camera'});
		
				// set message
				if (error.code == Titanium.Media.NO_CAMERA) {
					a.setMessage('Device does not have video recording capabilities');
				} else {
					a.setMessage('Unexpected error: ' + error.code);
				}
				// show alert
				a.show();
			},
			allowEditing:true
		});
	}

	win.addEventListener('focus', showCamera);
	return win;
};

module.exports = gallery_cam;