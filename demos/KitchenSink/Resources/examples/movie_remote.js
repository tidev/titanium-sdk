var win = Titanium.UI.currentWindow;

var activeMovie = Titanium.Media.createVideoPlayer({
	contentURL:'http://movies.apple.com/media/us/ipad/2010/tours/apple-ipad-video-us-20100127_r848-9cie.mov',
	backgroundColor:'#111',
	movieControlMode:Titanium.Media.VIDEO_CONTROL_DEFAULT,
	scalingMode:Titanium.Media.VIDEO_SCALING_MODE_FILL
});

activeMovie.addEventListener('complete',function()
{
	Titanium.UI.createAlertDialog({title:'Movie', message:'Completed!'}).show();
	win.close();
});

activeMovie.play();
