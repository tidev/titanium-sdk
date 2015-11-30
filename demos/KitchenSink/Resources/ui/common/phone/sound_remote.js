function sound_remote(_args) {
	var win = Titanium.UI.createWindow({
		title:_args.title
	});
	
	var url = Titanium.UI.createTextField({
		value:'http://appcelerator.qe.test.data.s3.amazonaws.com/KSResources/audio/audio_session.mp3',
		color:'#336699',
		returnKeyType:Titanium.UI.RETURNKEY_GO,
		keyboardType:Titanium.UI.KEYBOARD_URL,
		hintText:'url',
		textAlign:'left',
		clearOnEdit:false, // this set to true was clearing the field on launch
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
	
	var streamSize1 = Ti.UI.createButton({
		title:'Small buffer',
		top:240,
		left:10,
		width:100,
		height:40
	});
	var streamSize2 = Ti.UI.createButton({
		title:'Default buffer',
		top:240,
		left:110,
		width:100,
		height:40
	});
	var streamSize3 = Ti.UI.createButton({
		title:'Large buffer',
		top:240,
		right:10,
		width:100,
		height:40	
	});
	
	win.add(url);
	win.add(streamButton);
	win.add(pauseButton);
	win.add(progressLabel);
	win.add(stateLabel);
	if (Ti.Platform.name != 'android') {
		win.add(streamSize1);
		win.add(streamSize2);
		win.add(streamSize3);
	}
	var streamer = Ti.Media.createAudioPlayer();
	
	streamButton.addEventListener('click',function()
	{
		if (streamButton.title == 'Stop Stream')
		{
			progressLabel.text = 'Stopped';
			streamer.stop();
			pauseButton.enabled = false;
			streamSize1.enabled = true;
			streamSize2.enabled = true;
			streamSize3.enabled = true;
			pauseButton.title = 'Pause Streaming';
			streamButton.title = "Start Streaming";
		}
		else
		{
			progressLabel.text = 'Starting ...';
			streamer.url = url.value;
			streamer.start();
			pauseButton.enabled = true;
			streamSize1.enabled = false;
			streamSize2.enabled = false;
			streamSize3.enabled = false;
	
			pauseButton.title = 'Pause Streaming';
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
	
	streamSize1.addEventListener('click', function()
	{
		streamer.bufferSize = 512;
		Ti.API.log('Set streamer buffer size to ' + streamer.bufferSize);
	});
	streamSize2.addEventListener('click', function()
	{
		streamer.bufferSize = 2048;
		Ti.API.log('Set streamer buffer size to ' + streamer.bufferSize);
	});
	streamSize3.addEventListener('click', function()
	{
		streamer.bufferSize = 4096;
		Ti.API.log('Set streamer buffer size to ' + streamer.bufferSize);
	});
	
	streamer.addEventListener('progress',function(e)
	{
		progressLabel.text = 'Time Played: ' + Math.round(e.progress) + ' milliseconds';
	});
	
	streamer.addEventListener('change',function(e)
	{
		stateLabel.text = 'State: '+e.description +' ('+e.state+')';
		if(e.description == "stopped") {
			progressLabel.text = 'Stopped';
			pauseButton.enabled = false;
			pauseButton.title = 'Pause Streaming';
			streamButton.title = "Start Streaming";
		}
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
	return win;
};

module.exports = sound_remote;
