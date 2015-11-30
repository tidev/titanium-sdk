function cam_file(_args) {
	var win = Titanium.UI.createWindow({
		title:_args.title
	});
	
	function showCamera() {
		win.removeEventListener('focus',showCamera);
		Titanium.Media.showCamera({		
			success:function(event) {
				var cropRect = event.cropRect;
				var image = event.media;
				var filename = Titanium.Filesystem.applicationDataDirectory + "/"+ 'camera_photo' + new Date().getTime() + ".png";
				var f = Titanium.Filesystem.getFile(filename);
				if (f.exists()) {
					Ti.API.info('The file exist , trying to delete it before using it :' + f.deleteFile());
					f = Titanium.Filesystem.getFile(filename);
				}
				f.write(image);
				win.backgroundImage = f.nativePath;
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
	};
	
	win.addEventListener('focus',showCamera);
	
	return win;
};

module.exports = cam_file;