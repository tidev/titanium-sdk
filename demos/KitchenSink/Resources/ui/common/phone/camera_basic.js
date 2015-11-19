var win;

function fireUpTheCamera() {
	if (Ti.Platform.osname === 'android'|| Ti.Platform.osname == "iphone" || Ti.Platform.osname == 'ipad') {
		win.removeEventListener('focus', fireUpTheCamera);
	}
	Titanium.Media.showCamera({
	
		success:function(event) {
			var cropRect = event.cropRect;
			var image = event.media;
	
			Ti.API.debug('Our type was: '+event.mediaType);
			if(event.mediaType == Ti.Media.MEDIA_TYPE_PHOTO)
			{
				var imageView = Ti.UI.createImageView({
					width:win.width,
					height:win.height,
					image:event.media
				});
				win.add(imageView);
			}
			else
			{
				alert("got the wrong type back ="+event.mediaType);
			}
		},
		cancel:function() {
		},
		error:function(error) {
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
		saveToPhotoGallery:true,
		allowEditing:true,
		mediaTypes:[Ti.Media.MEDIA_TYPE_VIDEO,Ti.Media.MEDIA_TYPE_PHOTO]
	});
}

function cam_basic(_args) {
	win = Titanium.UI.createWindow({
		title:_args.title
	});
	if (Ti.Platform.osname === 'android'|| Ti.Platform.osname == "iphone" || Ti.Platform.osname == 'ipad') {
		win.addEventListener('focus', fireUpTheCamera);
	} else {
		fireUpTheCamera();	
	}
	return win;
};

module.exports = cam_basic;