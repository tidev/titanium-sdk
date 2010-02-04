
var url = Titanium.UI.createTextField({
	value:'http://202.6.74.107:8060/triplej.mp3',
	color:'#336699',
	returnKeyType:Titanium.UI.RETURNKEY_GO,
	enableReturnKey:true,
	keyboardType:Titanium.UI.KEYBOARD_URL,
	autocorrect:false,
	hintText:'url',
	textAlign:'left',
	clearOnEdit:true,
	height:35,
	top:50,
	borderStyle:Titanium.UI.INPUT_BORDERSTYLE_ROUNDED,
});
var streamButton = Ti.UI.createButton({title:'Start Streaming',top:100,width:120,height:38});

var progressLabel = Ti.UI.createLabel({text:'',top:170,left:0,right:0,height:40,color:'pink',textAlignment:'center'});
var stateLabel = Ti.UI.createLabel({text:'',top:200,left:0,right:0,height:40,color:'blue',textAlignment:'center'});

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
