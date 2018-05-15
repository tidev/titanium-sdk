var vidWin = Titanium.UI.createWindow({
	title : 'Video View Demo',
	backgroundColor : '#fff'
});
 
var videoPlayer = Titanium.Media.createVideoPlayer({
	top : activeMovieTop,
	width : Alloy.CFG.phoneWidth,
	bottom : (Alloy.CFG.isiPhoneX) ? 80 : 50,
	visible : false,
	zIndex : 999999,
	mediaControlStyle : Titanium.Media.VIDEO_CONTROL_DEFAULT,
	scalingMode : Titanium.Media.VIDEO_SCALING_ASPECT_FILL,
	autoplay : false,
	elevation : 24,
	media : videoMedia
});
 
//videoPlayer.url = 'movie.mp4';
vidWin.add(videoPlayer);
vidWin.open(); 