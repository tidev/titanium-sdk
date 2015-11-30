function gallery_xhr(_args) {
	var win = Ti.UI.createWindow({
		title:_args.title
	});
	var xhr = Titanium.Network.createHTTPClient();
	
	xhr.onload = function()
	{
		Titanium.Media.saveToPhotoGallery(this.responseData);
		Titanium.UI.createAlertDialog({title:'Photo Gallery',message:'Check your photo gallery for a titanium logo'}).show();		
	};
	// open the client
	xhr.open('GET','http://static.appcelerator.com/images/header/appc_logo.png');
	
	// send the data
	xhr.send();
	return win;
};

module.exports = gallery_xhr;