var win = Titanium.UI.currentWindow;

var recording = Ti.Media.createAudioRecorder();

// default compression is Ti.Media.AUDIO_FORMAT_LINEAR_PCM
// default format is Ti.Media.AUDIO_FILEFORMAT_CAF

// this will give us a wave file with µLaw compression which
// is a generally small size and suitable for telephony recording
// for high end quality, you'll want LINEAR PCM - however, that
// will result in uncompressed audio and will be very large in size
recording.compression = Ti.Media.AUDIO_FORMAT_ULAW;
recording.format = Ti.Media.AUDIO_FILEFORMAT_WAVE;

Ti.Media.addEventListener('recordinginput', function(e) {
	Ti.API.info('Input availability changed: '+e.available);
	if (!e.available && recording.recording) {
		b1.fireEvent('click', {});
	}
});

var file;
var timer;
var sound;


var label = Titanium.UI.createLabel({
	text:'',
	top:150,
	color:'#999',
	textAlign:'center',
	width:'auto',
	height:'auto'
});

win.add(label);

function lineTypeToStr()
{
	var type = Ti.Media.audioLineType;
	switch(type)
	{
		case Ti.Media.AUDIO_HEADSET_INOUT:
			return "headset";
		case Ti.Media.AUDIO_RECEIVER_AND_MIC:
			return "receiver/mic";
		case Ti.Media.AUDIO_HEADPHONES_AND_MIC:
			return "headphones/mic";
		case Ti.Media.AUDIO_HEADPHONES:
			return "headphones";
		case Ti.Media.AUDIO_LINEOUT:
			return "lineout";
		case Ti.Media.AUDIO_SPEAKER:
			return "speaker";
		case Ti.Media.AUDIO_MICROPHONE:
			return "microphone";
		case Ti.Media.AUDIO_MUTED:
			return "silence switch on";
		case Ti.Media.AUDIO_UNAVAILABLE:
			return "unavailable";
		case Ti.Media.AUDIO_UNKNOWN:
			return "unknown";
	}
}

var linetype = Titanium.UI.createLabel({
	text: "audio line type: "+lineTypeToStr(),
	bottom:20,
	color:'#999',
	textAlign:'center',
	width:'auto',
	height:'auto'
});

win.add(linetype);

var volume = Titanium.UI.createLabel({
	text: "volume: "+Ti.Media.volume,
	bottom:50,
	color:'#999',
	textAlign:'center',
	width:'auto',
	height:'auto'
});

win.add(volume);

Ti.Media.addEventListener('linechange',function(e)
{
	linetype.text = "audio line type: "+lineTypeToStr();
});

Ti.Media.addEventListener('volume',function(e)
{
	volume.text = "volume: "+e.volume;
});

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
		if (!Ti.Media.canRecord) {
			Ti.UI.createAlertDialog({
				title:'Error!',
				message:'No audio recording hardware is currently connected.'
			}).show();
			return;
		}
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
		Ti.API.info("recording file size: "+file.size);
		sound = Titanium.Media.createSound({sound:file});
		sound.addEventListener('complete', function()
		{
			b2.title = 'Playback Recording';
		});
		sound.play();
		b2.title = 'Stop Playback';
	}
});

var switchLabel = Titanium.UI.createLabel({
	text:'Hi-fidelity:',
	width:'auto',
	height:'auto',
	textAlign:'center',
	color:'#999',
	bottom:115
});
var switcher = Titanium.UI.createSwitch({
	value:false,
	bottom:80,
});

switcher.addEventListener('change',function(e)
{
	if (!switcher.value)
	{
		recording.compression = Ti.Media.AUDIO_FORMAT_ULAW;
	}
	else
	{
		recording.compression = Ti.Media.AUDIO_FORMAT_LINEAR_PCM;
	}
});
win.add(switchLabel);
win.add(switcher);
