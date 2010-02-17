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

var progressLabel = Titanium.UI.createLabel({
	text:'Time Played: Not Started',
	top:110,
	left:10,
	height:40,
	width:300,
	color:'#555',
	textAlignment:'center'
});
var stateLabel = Titanium.UI.createLabel({
	text:'State: Not Started',
	top:130,
	left:10,
	width:300,
	height:40,
	color:'#555'
});

Ti.UI.currentWindow.add(url);
Ti.UI.currentWindow.add(streamButton);
Ti.UI.currentWindow.add(progressLabel);
Ti.UI.currentWindow.add(stateLabel);
var streamer = Ti.Media.createAudioPlayer();

streamButton.addEventListener('click',function()
{
	if (streamButton.title == 'Stop Stream')
	{
		progressLabel.text = 'Stopped';
		streamer.stop();
		streamButton.title = "Start Streaming";
	}
	else
	{
		progressLabel.text = 'Starting ...';
		streamer.url = url.value;
		streamer.start();
		streamButton.title = "Stop Stream";
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
