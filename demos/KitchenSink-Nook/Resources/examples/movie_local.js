// TODO: need to be able to leave the movie before it completes

var win = Titanium.UI.currentWindow;

var options = {
	contentURL:'../movie.mp4',
	backgroundColor:'#111',
	scalingMode:Titanium.Media.VIDEO_SCALING_MODE_FILL,
	mediaControlStyle: Titanium.Media.VIDEO_CONTROL_DEFAULT
};
var activeMovie = Titanium.Media.createVideoPlayer(options);

if (parseFloat(Titanium.Platform.version) >= 3.2)
{
	activeMovie.mediaControlStyle = Titanium.Media.VIDEO_CONTROL_EMBEDDED;
	win.add(activeMovie);
}

var movieLabel = Titanium.UI.createLabel({
	text:'Do not try this at home',
	width:'auto',
	height:35,
	color:'white',
	font:{fontSize:24,fontFamily:'Helvetica Neue'}
});
activeMovie.add(movieLabel);

// label click
movieLabel.addEventListener('click',function()
{
	movieLabel.text = "You clicked the video label. Sweet!";
	activeMovie.mediaControlStyle = Titanium.Media.VIDEO_CONTROL_NONE;
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
	var dlg = Titanium.UI.createAlertDialog({title:'Movie', message:'Completed!', buttonNames:['OK']});
	dlg.addEventListener('click', function(e) {
		activeMovie.hide();
		win.close();
	});
	dlg.show();
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
