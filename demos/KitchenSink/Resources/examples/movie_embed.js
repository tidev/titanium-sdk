var win = Titanium.UI.currentWindow;

var statusLabel = Titanium.UI.createLabel({
	text:'tap on movie content',
	width:'auto',
	bottom:50,
	font:{fontSize:12,fontFamily:'Helvetica Neue'}
});
win.add(statusLabel);

var activeMovie = Titanium.Media.createVideoPlayer({
	url:'movie.mp4',
	backgroundColor:'#111',
	mediaControlStyle: Titanium.Media.VIDEO_CONTROL_EMBEDDED,
	scalingMode:Titanium.Media.VIDEO_SCALING_MODE_FILL,
	width:100,
	height:100,
	autoplay:true
});

// The built-in media playback controls look crazy at 100x100 in Android
if (Ti.Platform.name === "android") {
	activeMovie.width = 250;
	activeMovie.height = 250;
}

win.add(activeMovie);

// label 
var movieLabel = Titanium.UI.createLabel({
	text:'Do not try this at home',
	width:'auto',
	height:25,
	color:'white',
	font:{fontSize:18,fontFamily:'Helvetica Neue'}
});

// add label to view
activeMovie.add(movieLabel);

// movie click
activeMovie.addEventListener('click',function()
{
	var newText = "";
	newText += " initialPlaybackTime: " + activeMovie.initialPlaybackTime;
	newText += "; playableDuration: " + activeMovie.playableDuration;
	newText += "; endPlaybackTime: " + activeMovie.endPlaybackTime;
	newText += "; duration: " + activeMovie.duration;
	newText += "; currentPlaybackTime: " + activeMovie.currentPlaybackTime;
	statusLabel.text = newText;
});

// label click
movieLabel.addEventListener('click',function()
{
	movieLabel.text = "You clicked the video label. Sweet!";
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
	Ti.API.debug('Completed!');
	var dlg = Titanium.UI.createAlertDialog({title:'Movie', message:'Completed!'});
	if (Ti.Platform.name === "android") {
		// Gives a chance to see the dialog
		win.close();
		dlg.show();
	} else {
		dlg.show();
		win.close();
	}
});

if (Ti.Platform.name !== "android") {
	// Thumbnails not supported
	var thumbnailImage = activeMovie.thumbnailImageAtTime(4.0, Titanium.Media.VIDEO_TIME_OPTION_EXACT);
	win.add(Titanium.UI.createImageView({
		image:thumbnailImage,
		bottom:10,
		width:100,
		height:100
	}));
}

activeMovie.play();

win.addEventListener('close', function() {
	activeMovie.stop();
});
