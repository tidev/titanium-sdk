var f = Titanium.Filesystem.getFile(Titanium.Filesystem.resourcesDirectory,'images/appcelerator_small.png');

Titanium.Media.saveToPhotoGallery(f);

Titanium.UI.createAlertDialog({title:'Photo Gallery',message:'Check your photo gallery for an appcelerator logo'}).show();