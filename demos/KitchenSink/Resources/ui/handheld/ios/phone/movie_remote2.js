function movie_remote2(_args) {
	// regression issue for #965
	
	var media_url = "http://mirror.cessen.com/blender.org/peach/trailer/trailer_iphone.m4v";
	var win = Titanium.UI.createWindow({
		title:_args.title
	});
	
	var activeMovie = Titanium.Media.createVideoPlayer({
		url:media_url,
		backgroundColor:'#111',
		mediaControlStyle:Titanium.Media.VIDEO_CONTROL_DEFAULT, // See TIMOB-2802, which may change this property name
		scalingMode:Titanium.Media.VIDEO_SCALING_MODE_FILL
	});
	
	if (parseFloat(Titanium.Platform.version) >= 3.2)
	{
		win.add(activeMovie);
	}
	
	activeMovie.play();
	
	win.addEventListener('close', function() {
		alert("Window closed");
		activeMovie.stop();
	});
	return win;
};

module.exports = movie_remote2;