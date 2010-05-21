var win = Ti.UI.currentWindow;

var player = null;

var info = Ti.UI.createLabel({
	text:'',
	height:'auto',
	width:'auto',
	top:200
});
win.add(info);
var title = Ti.UI.createLabel({
	text:'',
	height:'auto',
	width:'auto',
	top:220
});
win.add(title);
var timeBar = Ti.UI.createProgressBar({
	min:0,
	value:0,
	width:200,
	height:40,
	top:240,
	color:'#888',
	style:Titanium.UI.iPhone.ProgressBarStyle.PLAIN,
});
win.add(timeBar);

var playback = null;
var barUpdate = function () {
	timeBar.value = player.currentPlaybackTime;
	Ti.API.log('Playback time: '+player.currentPlaybackTime);
};

try {
	player = Titanium.Media.appMusicPlayer;
	
	player.addEventListener('stateChange', function() {
		if (player.playbackState == Titanium.Media.MUSIC_PLAYER_STATE_STOPPED) {
			title.text = '';
			info.text = '';
			timeBar.hide();
			timeBar.max = 0;
			timeBar.value = 0;
			clearInterval(playback);
			playback = null;
		}
		if (player.playbackState == Titanium.Media.MUSIC_PLAYER_STATE_PLAYING) {
			info.text = player.nowPlaying.artist + ' : ' + player.nowPlaying.albumTitle;
			title.text = player.nowPlaying.title;
			timeBar.show();
			timeBar.max = player.nowPlaying.playbackDuration;
			timeBar.value = player.currentPlaybackTime;
			if (playback == null) {
				playback = setInterval(barUpdate, 500);
			}
		}
	});
	player.addEventListener('playingChange', function() {
		if (player.playbackState == Titanium.Media.MUSIC_PLAYER_STATE_PLAYING) {
			info.text = player.nowPlaying.artist + ' : ' + player.nowPlaying.albumTitle;
			title.text = player.nowPlaying.title;
			timeBar.show();
			timeBar.max = player.nowPlaying.playbackDuration;
			timeBar.value = 0;
			if (playback == null) {
				playback = setInterval(barUpdate, 500);
			}
		}
	});
	player.addEventListener('volumeChange', function() {
		Ti.API.log('Volume change: '+player.volume);
	});
}
catch (e) {
	// create alert
	var a = Titanium.UI.createAlertDialog({title:'Music Player'});
	a.setMessage('Please run this test on device: Inoperative on simulator');

	// show alert
	a.show();
}

var b1 = Ti.UI.createButton({
	title:'Play',
	width:80,
	height:40,
	left:20,
	top:20
});
b1.addEventListener('click', function() {
	player.play();
});
win.add(b1);

var b2 = Ti.UI.createButton({
	title:'Pause',
	width:80,
	height:40,
	top:20,
});
b2.addEventListener('click', function() {
	player.pause();
});
win.add(b2);

var b3 = Ti.UI.createButton({
	title:'Stop',
	width:80,
	height:40,
	top:20,
	right:20
});
b3.addEventListener('click', function() {
	player.stop();
});
win.add(b3);

var b4 = Ti.UI.createButton({
	title:'Seek >>',
	width:80,
	height:40,
	top:80,
	left:20
});
b4.addEventListener('click', function() {
	player.seekForward();
});
win.add(b4);

var b5 = Ti.UI.createButton({
	title:'Stop seek',
	width:80,
	height:40,
	top:80
});
b5.addEventListener('click', function() {
	player.stopSeeking();
});
win.add(b5);

var b6 = Ti.UI.createButton({
	title:'Seek <<',
	width:80,
	height:40,
	top:80,
	right:20
});
b6.addEventListener('click', function() {
	player.seekBackward();
});
win.add(b6);

var b7 = Ti.UI.createButton({
	title:'Skip >>',
	width:80,
	height:40,
	top:140,
	left:20
});
b7.addEventListener('click', function() {
	player.skipToNext();
});
win.add(b7);

var b8 = Ti.UI.createButton({
	title:'Skip |>',
	width:80,
	height:40,
	top:140,
});
b8.addEventListener('click', function() {
	player.skipToBeginning();
});
win.add(b8);

var b9 = Ti.UI.createButton({
	title:'Skip <<',
	width:80,
	height:40,
	top:140,
	right:20
});
b9.addEventListener('click', function() {
	player.skipToPrevious();
});
win.add(b9);

// MODAL SETTINGS BIT...
var settingsWindow = Ti.UI.createWindow({
	backgroundColor:'#fff',
	title:'Picker settings',
});

var settings = {
	success:function(picked)
	{
		if (!settings.autohide) {
			Ti.API.log("You didn't autohide me!");
			Ti.Media.hideMusicLibrary();
		}
		player.setQueue(picked);
	},
	error:function(error)
	{
		// create alert
		var a = Titanium.UI.createAlertDialog({title:'Music Picker'});

		// set message
		if (error.code == Titanium.Media.NO_MUSIC_PLAYER)
		{
			a.setMessage('Please run this test on device');
		}
		else
		{
			a.setMessage('Unexpected error: ' + error.code);
		}

		// show alert
		a.show();
	},
	mediaTypes:Ti.Media.MUSIC_MEDIA_TYPE_ALL,
	autohide:true
};

var modify = function(e) {
	Ti.API.log('Changing setting '+e.source.toggle+': '+e.source.value);
	settings[e.source.toggle] = e.source.value;
};

var v1 = Ti.UI.createView({
	top:10,
	left:10,
	width:250,
	height:30
});
var l1 = Ti.UI.createLabel({
	top:0,
	left:0,
	text:'Autohide: '
});
var s1 = Ti.UI.createSwitch({
	value:true,
	right:10,
	top:0,
	toggle:'autohide'
});
s1.addEventListener('change', modify);
v1.add(l1);
v1.add(s1);
settingsWindow.add(v1);

var v2 = Ti.UI.createView({
	top:45,
	left:10,
	width:250,
	height:30
});
var l2 = Ti.UI.createLabel({
	top:0,
	left:0,
	text:'Animated: '
});
var s2 = Ti.UI.createSwitch({
	value:true,
	top:0,
	right:10,
	toggle:'animated'
});
s2.addEventListener('change', modify);
v2.add(l2);
v2.add(s2);
settingsWindow.add(v2);

var v3 = Ti.UI.createView({
	top:80,
	left:10,
	width:250,
	height:30
});
var l3 = Ti.UI.createLabel({
	top:0,
	left:0,
	text:'Multiple: '
});
var s3 = Ti.UI.createSwitch({
	value:false,
	top:0,
	right:10,
	toggle:'allowMultipleSelections'
});
s3.addEventListener('change', modify);
v3.add(l3);
v3.add(s3);
settingsWindow.add(v3);

var switches = [];
for (var i=0; i < 5; i++) {
	var baseTop = 115;
	var v = Ti.UI.createView({
		top:baseTop+i*35,
		left:10,
		width:250,
		height:30
	});
	
	var text;
	var type;
	switch (i) {
		case 0:
			text = 'Music:';
			type = Ti.Media.MUSIC_MEDIA_TYPE_MUSIC;
			break;
		case 1:
			text = 'Podcasts:';
			type = Ti.Media.MUSIC_MEDIA_TYPE_PODCAST;
			break;
		case 2:
			text = 'Audiobooks:';
			type = Ti.Media.MUSIC_MEDIA_TYPE_AUDIOBOOK;
			break;
		case 3:
			text = 'Any audio:';
			type = Ti.Media.MUSIC_MEDIA_TYPE_ANY_AUDIO;
			break;
		case 4:
			text = 'All:';
			type = Ti.Media.MUSIC_MEDIA_TYPE_ALL;
			break;
	}
	
	var l = Ti.UI.createLabel({
		top:0,
		left:0,
		text:text
	});
	var s = Ti.UI.createSwitch({
		value:false,
		top:0,
		right:10,
		index:i,
		type:type
	});
	if (i == 4) {
		s.value = true;
	}
	
	s.addEventListener('change', function(e) {
		var type = e.source.type;
		var index = e.source.index;
		
		Ti.API.log('Setting media type: '+type+' to '+e.source.value);
		
		if (e.source.value) {
			settings.mediaTypes |= type;
		}
		else {
			settings.mediaTypes ^= type;
			for (var i=0; i < 5; i++) {
				if (index != i && switches[i].value) {
					settings.mediaTypes |= switches[i].type;
				}
			}
		}
	});
	switches.push(s);
	
	v.add(l);
	v.add(s);
	settingsWindow.add(v);
}

var back = Ti.UI.createButton({
	title:'Close',
	style:Titanium.UI.iPhone.SystemButtonStyle.PLAIN
});
back.addEventListener('click', function() {
	settingsWindow.close();
});
settingsWindow.setLeftNavButton(back);
/// ... END MODAL SETTINGS BIT

var b10 = Ti.UI.createButton({
	title:'Picker settings',
	width:120,
	height:40,
	bottom:20,
	left:20,
});
b10.addEventListener('click', function() {
	settingsWindow.open({modal:true});
});
win.add(b10);

var b11 = Ti.UI.createButton({
	title:'Display library',
	width:120,
	height:40,
	bottom:20,
	right:20
});
b11.addEventListener('click', function() {
	Ti.Media.openMusicLibrary(settings);
});
win.add(b11);

win.addEventListener('close', function() {
	player.stop();
	if (playback != null) {
		clearInterval(playback);
	}
});
