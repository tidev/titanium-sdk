
var media_url = "http://movies.apple.com/media/us/ipad/2010/tours/apple-ipad-video-us-20100127_r848-9cie.mov";
var win = Titanium.UI.currentWindow;

var activeMovie = Titanium.Media.createVideoPlayer({
	url:media_url,
	backgroundColor:'#111',
	movieControlMode:Titanium.Media.VIDEO_CONTROL_DEFAULT, // See TIMOB-2802, which may change this property name
	scalingMode:Titanium.Media.VIDEO_SCALING_MODE_FILL,
	bottom: 50,
	volume: 1.0
});

var volumeSlider = Ti.UI.createSlider({
	left:10, right:10, bottom:10,
	height:30,
	value: 100, min: 0, max: 100,
});

volumeSlider.addEventListener('change', function(e) {
	activeMovie.volume = e.value/100
});

win.add(volumeSlider);
win.add(activeMovie);
activeMovie.play();

win.addEventListener('close', function() {
	alert("Window closed");
	activeMovie.stop();
});
