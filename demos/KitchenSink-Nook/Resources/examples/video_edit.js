var win = Ti.UI.currentWindow;

Ti.Media.startVideoEditing({
	media:'../movie.mp4',
	
	cancel:function()
	{
		alert("editing cancelled");
	},
	
	success:function(event)
	{
		var activeMovie = Titanium.Media.createVideoPlayer({
			media:event.media,
			backgroundColor:'#111',
			movieControlMode:Titanium.Media.VIDEO_CONTROL_DEFAULT,
			movieControlStyle:Titanium.Media.VIDEO_CONTROL_FULLSCREEN,
			scalingMode:Titanium.Media.VIDEO_SCALING_MODE_FILL
		});
		win.add(activeMovie);
	},
	
	error:function(e)
	{
		alert("Error: "+e.error);
	}
});
