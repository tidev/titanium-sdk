var win = Titanium.UI.currentWindow;

var recording = Ti.Media.createAudioRecorder();
var file;
var timer;
var sound;


var label = Titanium.UI.createLabel({
	text:'',
	top:150,
	color:'#999',
	textAlign:'center'
});

win.add(label);

var duration = 0;

function showLevels()
{
	var peak = Ti.Media.peakMicrophonePower;
	var avg = Ti.Media.averageMicrophonePower;
	duration++;
	label.text = 'duration: '+duration+' seconds\npeak power: '+peak+'\navg power: '+avg;
}

var b1 = Titanium.UI.createButton({
	title:'Start Recording',
	width:200,
	height:40,
	top:20
});
b1.addEventListener('click', function()
{
	if (recording.recording)
	{
		file = recording.stop();
		b1.title = "Start Recording";
		b2.show();
		clearInterval(timer);
		Ti.Media.stopMicrophoneMonitor();
	}
	else
	{
		b1.title = "Stop Recording";
		recording.start();
		b2.hide();
		Ti.Media.startMicrophoneMonitor();
		duration = 0;
		timer = setInterval(showLevels,1000);
	}
});
win.add(b1);

var b2 = Titanium.UI.createButton({
	title:'Playback Recording',
	width:200,
	height:40,
	top:80
});

win.add(b2);
b2.addEventListener('click', function()
{
	if (sound && sound.playing)
	{
		sound.stop();
		sound.release();
		sound = null;
		b2.title = 'Playback Recording';
	}
	else
	{
		sound = Titanium.Media.createSound({sound:file});
		sound.addEventListener('complete', function()
		{
			b2.title = 'Playback Record';
		});
		sound.play();
		b2.title = 'Stop Playback';
	}
});
