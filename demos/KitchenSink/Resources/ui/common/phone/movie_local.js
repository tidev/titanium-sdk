function movie_local(_args) {
	var win = Titanium.UI.createWindow({
		title:_args.title
	});
	
	var options = {
		url: '/etc/movie.mp4',
		backgroundColor: '#111',
		scalingMode: Titanium.Media.VIDEO_SCALING_MODE_FILL,
		mediaControlStyle: Titanium.Media.VIDEO_CONTROL_NONE // See TIMOB-2802, which may change this property name
	};
	
	if (Titanium.Platform.osname == "ipad") {
		options.width = 400;
		options.height = 300;
	}
	
	var activeMovie = Titanium.Media.createVideoPlayer(options);
	win.add(activeMovie);
	
	// label 
	var movieLabel = Titanium.UI.createLabel({
		text:'Do not try this at home',
		width:Ti.UI.SIZE,
		height:35,
		color:'white',
		font:{fontSize:12,fontFamily:'Helvetica Neue'}
	});
	
	// add label to view
	activeMovie.add(movieLabel);
	
	// label click
	movieLabel.addEventListener('click',function()
	{
		movieLabel.text = "You clicked the video label. Sweet!";
		movieLabel.text = "mediaControlStyle = " + activeMovie.mediaControlStyle;
	});
	
	activeMovie.addEventListener('load', function()
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
		if (Ti.Platform.name === 'android') {
			// So you have a chance to see the "completed" dialog.
			win.close();
			dlg.show();
		} else {
			dlg.show();
			win.close();
		}
	});

	var event1 = 'playbackState';
	if (Ti.version >= '3.0.0') {
		event1 = 'playbackstate';
	}
	
	activeMovie.addEventListener(event1,function(e){
	    Ti.API.info('Event PlaybackState Fired: '+e.playbackState);
	    Ti.API.info('activeMovie.endPlaybackTime: '+activeMovie.endPlaybackTime);
	    Ti.API.info('activeMovie.playableDuration: '+activeMovie.playableDuration);
	});
	
	activeMovie.play();
	
	win.addEventListener('close', function() {
		activeMovie.stop();
	});
	
	return win;
};

module.exports = movie_local;
