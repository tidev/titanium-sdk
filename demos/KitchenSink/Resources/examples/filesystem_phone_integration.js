var win = Titanium.UI.currentWindow;

var b1 = Titanium.UI.createButton({
	title:'Camera',
	width:200,
	height:40,
	top:10
});
win.add(b1);

b1.addEventListener('click', function()
{
	Titanium.Media.showCamera({

		success:function(event)
		{
			var image = event.media;
			var dir = Titanium.Filesystem.applicationDataDirectory + '/camera_photo.png';
			var f = Titanium.Filesystem.getFile(dir);
			f.write(image);
			Titanium.API.info('dir ' + dir + ' url ' + f.url);
			win.backgroundImage(f.url);
		},
		cancel:function()
		{

		},
		error:function(error)
		{
			// create alert
			var a = Titanium.UI.createAlertDialog({title:'Camera'});

			// set message
			if (error.code == Titanium.Media.NO_CAMERA)
			{
				a.setMessage('Device does not have a camera');
			}
			else
			{
				a.setMessage('Unexpected error: ' + error.code);
			}

			// show alert
			a.show();
		},
		allowImageEditing:true,
	});
	
});

var b2 = Titanium.UI.createButton({
	title:'Photo Gallery',
	width:200,
	height:40,
	top:60
});
win.add(b2);

var b3 = Titanium.UI.createButton({
	title:'Remote Movie',
	width:200,
	height:40,
	top:110
});
win.add(b3);

var b4 = Titanium.UI.createButton({
	title:'Remote Sound',
	width:200,
	height:40,
	top:160
});
win.add(b4);

var b5 = Titanium.UI.createButton({
	title:'Record/Save Movie',
	width:200,
	height:40,
	top:210
});

win.add(b5);

b5.addEventListener('click', function()
{
	var xhr = Titanium.Network.createHTTPClient();

	xhr.onload = function()
	{
		Titanium.API.info('ONLOAD CALLED')
	};
	xhr.ondatastream = function(e)
	{
		for (v in e)
		{
			Titanium.API.info('v ' + v + ' e[v] ' + e[v]);
		}
		if (e.progress==1)
		{
			var dir = Titanium.Filesystem.applicationDataDirectory + '/apple_movie.mov';
			var f = Titanium.Filesystem.getFile(dir);
			f.write(this.responseData);
			Titanium.API.info('dir ' + dir + ' url ' + f.url);
			var activeMovie = Titanium.Media.createVideoPlayer({
				contentURL:f.url,
				backgroundColor:'#111',
				movieControlMode:Titanium.Media.VIDEO_CONTROL_DEFAULT,
				scalingMode:Titanium.Media.VIDEO_SCALING_MODE_FILL
			});
			activeMovie.play();
		}
	};
	
	// open the client
	xhr.open('GET',"http://movies.apple.com/media/us/ipad/2010/tours/apple-ipad-video-us-20100127_r848-9cie.mov");

	// send the data
	xhr.send();
	
});
