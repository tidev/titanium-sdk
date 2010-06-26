var win = Titanium.UI.currentWindow;

var count = 0;

// Need this so that any sound which is playing when we come in continues to
// do so
Titanium.Media.defaultAudioSessionMode = Ti.Media.AUDIO_SESSION_MODE_AMBIENT;

var startAudio = Titanium.UI.createButton({
	title:'Toggle Audio Session Mode',
	top:10,
	width:250,
	height:40
});
startAudio.addEventListener('click', function()
{
	if (count == 4)count=0; else count++
	Ti.API.info('playing audio with mode ' + modeArray[count].desc + ' count ' + count);
	audio.audioSessionMode = modeArray[count].mode;
	l.text = modeArray[count].desc
	audio.start()
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
	title:'Toggle Sound Session Mode',
	top:110,
	width:250,
	height:40
});
startSound.addEventListener('click', function()
{
	if (count == 4)count=0; else count++
	Ti.API.info('playing sound with mode ' + modeArray[count].desc + ' count ' + count);
	sound.audioSessionMode = modeArray[count].mode;
	l.text = modeArray[count].desc;
	sound.play()
	
});

var stopSound = Titanium.UI.createButton({
	title:'Stop Sound',
	top:160,
	width:250,
	height:40
});
stopSound.addEventListener('click', function()
{
	sound.stop()
});

var l = Ti.UI.createLabel({
	text:'Play sounds to toggle audio mode - try running this test when you have the iPod playing!',
	top:210,
	width:300,
	height:30
});

win.add(startAudio);
win.add(stopAudio);
win.add(startSound);
win.add(stopSound);
win.add(l);

var modeArray = [
	{mode:Ti.Media.AUDIO_SESSION_MODE_SOLO_AMBIENT,desc:'Solo Ambient Mode'},
	{mode:Ti.Media.AUDIO_SESSION_MODE_AMBIENT,desc:'Ambient Mode'},
	{mode:Ti.Media.AUDIO_SESSION_MODE_PLAYBACK,desc:'Playback Mode'},
	{mode:Ti.Media.AUDIO_SESSION_MODE_RECORD,desc:'Record Mode'},
	{mode:Ti.Media.AUDIO_SESSION_MODE_PLAY_AND_RECORD,desc:'Play and Record Mode'}
];

var audio = Ti.Media.createAudioPlayer({url:'http://202.6.74.107:8060/triplej.mp3'});
var sound = Titanium.Media.createSound({url:'../cricket.wav'});

