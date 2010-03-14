var xhr = Titanium.Network.createHTTPClient();

xhr.onload = function()
{
	Titanium.Media.saveToPhotoGallery(this.responseData);
	Titanium.UI.createAlertDialog({title:'Photo Gallery',message:'Check your photo gallery for a titanium logo'}).show();		
};
// open the client
xhr.open('GET','http://www.appcelerator.com/wp-content/uploads/2009/06/titanium_desk.png');

// send the data
xhr.send();
