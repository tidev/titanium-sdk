var win = Titanium.UI.currentWindow;

var url = Titanium.UI.createTextField({
	value:'http://202.6.74.107:8060/triplej.mp3',
	color:'#336699',
	returnKeyType:Titanium.UI.RETURNKEY_GO,
	keyboardType:Titanium.UI.KEYBOARD_URL,
	hintText:'url',
	textAlign:'left',
	clearOnEdit:true,
	height:35,
	top:10,
	width:300,
	borderStyle:Titanium.UI.INPUT_BORDERSTYLE_ROUNDED
});

var streamButton = Titanium.UI.createButton({
	title:'Start Streaming',
	top:60,
	width:200,
	height:40
});

var pauseButton = Titanium.UI.createButton({
	title:'Pause Streaming',
	top:110,
	width:200,
	height:40,
	enabled:false
});

var progressLabel = Titanium.UI.createLabel({
	text:'Time Played: Not Started',
	top:160,
	left:10,
	height:40,
	width:300,
	color:'#555',
	textAlignment:'center'
});
var stateLabel = Titanium.UI.createLabel({
	text:'State: Not Started',
	top:180,
	left:10,
	width:300,
	height:40,
	color:'#555'
});

Ti.UI.currentWindow.add(url);
Ti.UI.currentWindow.add(streamButton);
Ti.UI.currentWindow.add(pauseButton);
Ti.UI.currentWindow.add(progressLabel);
Ti.UI.currentWindow.add(stateLabel);
var streamer = Ti.Media.createAudioPlayer();

streamButton.addEventListener('click',function()
{
	if (streamButton.title == 'Stop Stream')
	{
		progressLabel.text = 'Stopped';
		streamer.stop();
		pauseButton.enabled = false;
		pauseButton.title = 'Pause Streaming'
		streamButton.title = "Start Streaming";
	}
	else
	{
		progressLabel.text = 'Starting ...';
		streamer.url = url.value;
		streamer.start();
		pauseButton.enabled = true;
		pauseButton.title = 'Pause Streaming'
		streamButton.title = "Stop Stream";
	}
});

pauseButton.addEventListener('click', function()
{
	streamer.pause();
	if (streamer.paused) {
		pauseButton.title = 'Unpause Streaming';
	}
	else {
		pauseButton.title = 'Pause Streaming';
	}
});

streamer.addEventListener('progress',function(e)
{
	progressLabel.text = 'Time Played: ' + Math.round(e.progress) + ' seconds';
});

streamer.addEventListener('change',function(e)
{
	stateLabel.text = 'State: '+e.description +' ('+e.state+')';
});

// save off current idle timer state
var idleTimer = Ti.App.idleTimerDisabled;

// while we're in this window don't let the app shutdown
// when the screen is idle
Ti.App.idleTimerDisabled = true;

win.addEventListener('close',function()
{
	Ti.API.info("window was closed, idleTimer reset to = "+idleTimer);
	
	// restore previous idle state when closed
	Ti.App.idleTimerDisabled = idleTimer;
});