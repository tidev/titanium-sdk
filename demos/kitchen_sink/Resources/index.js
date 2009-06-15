// set current window's bar color
Titanium.UI.currentWindow.setBarColor('#336699');
Titanium.UI.setTabBadge(10);

Titanium.UI.ready = function()
{

	// create movie
	var activeMovie = Titanium.Media.createVideoPlayer({
			contentURL:'movie.mp4',
			backgroundColor:'#111',
			movieControlMode:Titanium.Media.VIDEO_CONTROL_DEFAULT,
			scalingMode:Titanium.Media.VIDEO_SCALING_MODE_FILL
	});

	// create data for table view
	var data = [
		{title:'Play Movie',hasChild:false},
		{title:'Take Picture',hasChild:false},
		{title:'Open Photo Gallery',hasChild:false},
		{title:'Play Audio',hasChild:true},
		{title:'Vibrate',hasChild:false}
	];

	// create a table view
	Titanium.UI.createTableView('table',data,function(index)
	{
		switch(index)
		{
			case 0:
			{
				playMovie();
				break;
			}
			case 1:
			{
				showCamera();
				break;
			}
			case 2:
			{
				showPhotoGallery();
				break;
			}
			case 3:
			{
				playAudio();
				break;
			}
			case 4:
			{
				vibrate();
				break;
			}

		}
	});

	function vibrate()
	{
		Titanium.Media.vibrate();
	};

	function playMovie()
	{
		activeMovie.play();
	};

	function showCamera()
	{
		Titanium.Media.showCamera({

			success:function(image,details)
			{
				var win = Titanium.UI.createWindow();
				win.setURL('image.html');
				Titanium.App.Properties.setString('photo',image.url);
				if (!isUndefined(details)) {
					Titanium.App.Properties.setString('x',details.cropRect.x);
					Titanium.App.Properties.setString('y',details.cropRect.y);
					Titanium.App.Properties.setString('height',details.cropRect.height);
					Titanium.App.Properties.setString('width',details.cropRect.width);
				} else {
					Titanium.App.Properties.setString('x',0);
					Titanium.App.Properties.setString('y',0);
					Titanium.App.Properties.setString('height',image.height);
					Titanium.App.Properties.setString('width',image.width);
				}
				win.open({animated:true});

			},
			cancel:function()
			{

			},
			error:function(error)
			{
				// create alert
				var alert = Titanium.UI.createAlert();

				// set title
				alert.setTitle('Camera Error');

				// set message
				if (error.code = Titanium.Media.NO_CAMERA)
				{
					alert.setMessage('Device does not have camera');
				}
				else
				{
					alert.setMessage('Unexpected error: ' + error.code);
				}

				// set button names
				alert.setButtonNames(['OK']);

				// show alert
				alert.show();
			},
			allowImageEditing:true
		});
	};

	function showPhotoGallery()
	{
		Titanium.Media.openPhotoGallery({
			success: function(image,details)
			{
				var win = Titanium.UI.createWindow();
				win.setURL('image.html');
				Titanium.App.Properties.setString('photo',image.url);
				if (!isUndefined(details)) {
					Titanium.App.Properties.setString('x',details.cropRect.x);
					Titanium.App.Properties.setString('y',details.cropRect.y);
					Titanium.App.Properties.setString('height',details.cropRect.height);
					Titanium.App.Properties.setString('width',details.cropRect.width);
				} else {
					Titanium.App.Properties.setString('x',0);
					Titanium.App.Properties.setString('y',0);
					Titanium.App.Properties.setString('height',image.height);
					Titanium.App.Properties.setString('width',image.width);
				}
				win.open({animated:true});
			},
			error: function(error)
			{
				Titanium.UI.createAlertDialog( {
					title: "Error from Gallery",
					message: error.message,
					buttonNames: OK
				} ).show();
			},
			cancel: function()
			{

			},
			allowImageEditing:true
		});
	};

	function playAudio()
	{
		// create window
		var win = Titanium.UI.createWindow();
		win.hideTabBar = true;
		win.setBarColor('black')
		win.setURL('audio.html');
		win.setTitle('Zzz');
		win.orientation = 'either';
		win.open({animation:true});
	};

};