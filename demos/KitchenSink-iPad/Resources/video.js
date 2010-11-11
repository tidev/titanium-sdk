Video = {};
Video.view = Ti.UI.createView();
Video.videoObject = null;

Video.init = function()
{
	Video.videoObject = Titanium.Media.createVideoPlayer({
		contentURL:'movie.mp4',
		backgroundColor:'#111',
		movieControlMode:Titanium.Media.VIDEO_CONTROL_DEFAULT,
		scalingMode:Titanium.Media.VIDEO_SCALING_MODE_FILL,
		top:100,
		movieControlStyle:Titanium.Media.VIDEO_CONTROL_EMBEDDED,
		height:300,
		width:400,
		autoplay:false
	});

	Video.view.add(Video.videoObject);
};
