var win = Titanium.UI.currentWindow;

var contentURL = 'http://movies.apple.com/media/us/ipad/2010/tours/apple-ipad-video-us-20100127_r848-9cie.mov';
if (Ti.Platform.name == 'android') {
	contentURL = "http://c0222252.cdn.cloudfiles.rackspacecloud.com/0032_MotoBlur.m4v";
}
var activeMovie = Titanium.Media.createVideoPlayer({
	contentURL: contentURL,
	backgroundColor:'#111',
	movieControlMode:Titanium.Media.VIDEO_CONTROL_DEFAULT,
	scalingMode:Titanium.Media.VIDEO_SCALING_MODE_FILL
});

if (parseFloat(Titanium.Platform.version) >= 3.2)
{
	win.add(activeMovie);
}

activeMovie.addEventListener('complete',function()
{
	Titanium.UI.createAlertDialog({title:'Movie', message:'Completed!'}).show();
	win.close();
});

activeMovie.play();

win.addEventListener('close', function() {
	activeMovie.stop();
});