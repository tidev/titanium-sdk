function cam_popover(_args) {
	var win = Titanium.UI.createWindow({
		title:_args.title
	});
	
	var popoverButton = Titanium.UI.createButton({
		title:'Pop Camera',
		width:130,
		height:40,
		top:30		
	});
	popoverButton.addEventListener('click',function(){
		Titanium.Media.showCamera({
			inPopOver:true,
			saveToPhotoGallery:false,
			autohide:true,
			allowEditing:true,
			popoverView:popoverButton,
			success:function(event) {
	    		Ti.API.debug("Success In Camera");
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
	  		error:function(event) {
	  			Ti.API.debug("Error In Camera");
	  		},
	  		cancel:function(event) {
	  			Ti.API.debug("Cancel In Camera");
	  		}
		});
	});
	win.add(popoverButton);
	return win;
}

module.exports = cam_popover;
