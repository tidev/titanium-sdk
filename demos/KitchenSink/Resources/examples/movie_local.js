var win = Titanium.UI.currentWindow;
var android = (Titanium.Platform.name == 'android');

var options = {
	contentURL:'../movie.mp4',
	backgroundColor:'#111',
	scalingMode:Titanium.Media.VIDEO_SCALING_MODE_FILL
};

if (android) {
	options.mediaControlStyle = Titanium.Media.VIDEO_CONTROL_DEFAULT;
} else {
	if (parseFloat(Titanium.Platform.version) >= 3.2) {
		options.mediaControlStyle = Titanium.Media.VIDEO_CONTROL_NONE;
	} else {
		options.movieControlMode = Titanium.Media.VIDEO_CONTROL_NONE;
	}
}

var activeMovie = Titanium.Media.createVideoPlayer(options);

if (!android && parseFloat(Titanium.Platform.version) >= 3.2)
{
	activeMovie.mediaControlStyle = Titanium.Media.VIDEO_CONTROL_EMBEDDED;
//	activeMovie.mediaControlStyle = Titanium.Media.VIDEO_CONTROL_FULLSCREEN;
//	activeMovie.mediaControlStyle = Titanium.Media.VIDEO_CONTROL_NONE;
	if (Titanium.Platform.osname == "ipad") {
		activeMovie.width = 400;
		activeMovie.height = 300;
	}
	win.add(activeMovie);
}

// label 
var movieLabel = Titanium.UI.createLabel({
	text:'Do not try this at home',
	width:'auto',
	height:35,
	color:'white',
	font:{fontSize:24,fontFamily:'Helvetica Neue'}
});

// add label to view
activeMovie.add(movieLabel);

// label click
movieLabel.addEventListener('click',function()
{
	movieLabel.text = "You clicked the video label. Sweet!";
	if (android) {
		activeMovie.mediaControlStyle = Titanium.Media.VIDEO_CONTROL_NONE;
	}
});

activeMovie.addEventListener('load',function()
{
	// animate label
	var t = Titanium.UI.create2DMatrix();
	t = t.scale(3);
	movieLabel.animate({transform:t, duration:500, color:'red'},function()
	{
		var t = Titanium.UI.create2DMatrix();
		movieLabel.animate({transform:t, duration:500, color:'white'});
	});
});
activeMovie.addEventListener('complete',function()
{
	var dlg = Titanium.UI.createAlertDialog({title:'Movie', message:'Completed!'});
	if (Ti.Platform.name == 'android') {
		dlg.addEventListener('click', function(e) {
			activeMovie.hide();
			win.close();
		});
		dlg.show();
	} else {
		dlg.show();
		win.close();
	}
});

activeMovie.addEventListener('playbackState',function(e){
    Ti.API.info('Event PlaybackState Fired: '+e.playbackState);
    Ti.API.info('activeMovie.endPlaybackTime: '+activeMovie.endPlaybackTime);
    Ti.API.info('activeMovie.playableDuration: '+activeMovie.playableDuration);
});

activeMovie.play();

win.addEventListener('close', function() {
	activeMovie.stop();
});
