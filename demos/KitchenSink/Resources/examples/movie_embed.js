var win = Titanium.UI.currentWindow;

var activeMovie = Titanium.Media.createVideoPlayer({
	contentURL:'../movie.mp4',
	backgroundColor:'#111',
	movieControlStyle: Titanium.Media.VIDEO_CONTROL_EMBEDDED,
	scalingMode:Titanium.Media.VIDEO_SCALING_MODE_FILL,
	width:100,
	height:100,
});

win.add(activeMovie);

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
	Titanium.UI.createAlertDialog({title:'Movie', message:'Completed!'}).show();
	win.close();
});

var thumbnailImage = activeMovie.thumbnailImageAtTime(4.0, Titanium.Media.VIDEO_TIME_OPTION_EXACT);
win.add(Titanium.UI.createImageView({
	image:thumbnailImage,
	bottom:10,
	width:100,
	height:100
}));

activeMovie.play();
