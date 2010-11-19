// regression issue for #965

// dynamic url with dynamic encoding (from kosso)
var media_url = "http://phreadz.com/service/encoder.php?g=5LPOKP754&iph=1";
var win = Titanium.UI.currentWindow;

var activeMovie = Titanium.Media.createVideoPlayer({
	url:media_url,
	backgroundColor:'#111',
	movieControlMode:Titanium.Media.VIDEO_CONTROL_DEFAULT,
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