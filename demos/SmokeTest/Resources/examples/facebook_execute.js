var win = Ti.UI.currentWindow;
//
// Login Button
//
var fbButton = Titanium.Facebook.createLoginButton({
	'style':'wide',
	'apikey':'9494e611f2a93b8d7bfcdfa8cefdaf9f',
	'sessionProxy':'http://api.appcelerator.com/p/fbconnect/',
	bottom:10
});
win.add(fbButton);

var b1 = Ti.UI.createButton({
	title:'Upload Photo',
	width:200,
	height:40,
	top:10
});
win.add(b1);


function uploadPhoto()
{
	Titanium.Media.openPhotoGallery({

		success:function(event)
		{
			b1.title = 'Uploading Photo...';
			Titanium.Facebook.execute('facebook.photos.upload',{}, function(r)
			{
				if (r.success)
				{
					Ti.UI.createAlertDialog({title:'Facebook', message:'Your photo was uploaded'}).show();
				}
				else
				{
					Ti.UI.createAlertDialog({title:'Facebook', message:'Error ' + r.error}).show();

				}
				b1.title = 'Upload Photo';
				

			}, event.media);

		},
		cancel:function()
		{

		},
		error:function(error)
		{
		},
		allowEditing:true
	});
};

b1.addEventListener('click', function()
{
	if (Titanium.Facebook.isLoggedIn()==false)
	{
		Ti.UI.createAlertDialog({title:'Facebook', message:'Login before uploading your photo'}).show();
		return;
	}
	if (!Titanium.Facebook.hasPermission("photo_upload"))
	{
		Titanium.Facebook.requestPermission("photo_upload",function(evt)
		{
			if (evt.success)
			{
				uploadPhoto();
			}
		});
	}
	else
	{
		uploadPhoto();
	}
	
});
