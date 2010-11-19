var win = Titanium.UI.currentWindow;

var count = 0;

// Need this so that any sound which is playing when we come in continues to
// do so
Titanium.Media.audioSessionMode = Ti.Media.AUDIO_SESSION_MODE_AMBIENT;

var modeArray = [
	{mode:Ti.Media.AUDIO_SESSION_MODE_AMBIENT,desc:'Ambient Mode'},
	{mode:Ti.Media.AUDIO_SESSION_MODE_SOLO_AMBIENT,desc:'Solo Ambient Mode'},
	{mode:Ti.Media.AUDIO_SESSION_MODE_PLAYBACK,desc:'Playback Mode'},
	{mode:Ti.Media.AUDIO_SESSION_MODE_PLAY_AND_RECORD,desc:'Play and Record Mode'}
];

var audio = Ti.Media.createAudioPlayer({url:'http://202.6.74.107:8060/triplej.mp3'});
var sound = Titanium.Media.createSound({url:'../cricket.wav'});

var startAudio = Titanium.UI.createButton({
	title:'Play streaming audio',
	top:10,
	width:250,
	height:40
});
startAudio.addEventListener('click', function()
{
	Ti.API.info('streaming with mode ' + modeArray[count].desc + ' count ' + count);
	audio.start();
});

var stopAudio = Titanium.UI.createButton({
	title:'Stop Audio',
	top:60,
	width:250,
	height:40
});
stopAudio.addEventListener('click', function()
{
	audio.stop();
});

var startSound = Titanium.UI.createButton({
	title:'Play sound',
	top:110,
	width:250,
	height:40
});
startSound.addEventListener('click', function()
{
	Ti.API.info('playing sound with mode ' + modeArray[count].desc + ' count ' + count);
	sound.play();
});

var stopSound = Titanium.UI.createButton({
	title:'Stop Sound',
	top:160,
	width:250,
	height:40
});
stopSound.addEventListener('click', function()
{
	sound.stop();
});

var changeMode = Titanium.UI.createButton({
	title:'Change audio mode',
	top:210,
	width:250,
	height:40
});
changeMode.addEventListener('click', function()
{
	audio.stop();
	sound.stop();

	if (count == modeArray.length-1)count=0; else count++;
	Titanium.Media.audioSessionMode = modeArray[count].mode;
	l.text = modeArray[count].desc;
});

var l = Ti.UI.createLabel({
	text:'Ambient: Try running w/iPod!',
	top:260,
	width:300,
	height:30
});

win.add(startAudio);
win.add(stopAudio);
win.add(startSound);
win.add(stopSound);
win.add(changeMode);
win.add(l);

