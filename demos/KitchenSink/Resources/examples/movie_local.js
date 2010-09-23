var win = Titanium.UI.currentWindow;
var android = (Titanium.Platform.name == 'android');

var activeMovie = Titanium.Media.createVideoPlayer({
	contentURL:'../movie.mp4',
	backgroundColor:'#111',
	movieControlMode:Titanium.Media.VIDEO_CONTROL_DEFAULT,
	scalingMode:Titanium.Media.VIDEO_SCALING_MODE_FILL
});

if (parseFloat(Titanium.Platform.version) >= 3.2)
{
	activeMovie.movieControlStyle = Titanium.Media.VIDEO_CONTROL_EMBEDDED;
//	activeMovie.movieControlStyle = Titanium.Media.VIDEO_CONTROL_FULLSCREEN;
//	activeMovie.movieControlStyle = Titanium.Media.VIDEO_CONTROL_NONE;
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
	height:25,
	color:'white',
	font:{fontSize:24,fontFamily:'Helvetica Neue'}
});

// add label to view
activeMovie.add(movieLabel);

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

activeMovie.play();

win.addEventListener('close', function() {
	activeMovie.stop();
});
