describe("Ti.Media tests", {
	soundAPIs: function() {
		valueOf(Ti.Media.createSound).shouldBeFunction();
		
		var sound = Ti.Media.createSound("sound.wav");
		valueOf(sound).shouldNotBeNull();
		valueOf(sound.getTime).shouldBeFunction();
		valueOf(sound.setTime).shouldBeFunction();
		valueOf(sound.time).shouldBeNumber();
		
		valueOf(sound.isLooping).shouldBeFunction();
		valueOf(sound.setLooping).shouldBeFunction();
		valueOf(sound.looping).shouldBeBoolean();
		
		valueOf(sound.isPaused).shouldBeFunction();
		valueOf(sound.paused).shouldBeBoolean();
		
		valueOf(sound.isPlaying).shouldBeFunction();
		valueOf(sound.playing).shouldBeBoolean();
		
		valueOf(sound.pause).shouldBeFunction();
		valueOf(sound.play).shouldBeFunction();
		valueOf(sound.release).shouldBeFunction();
		valueOf(sound.reset).shouldBeFunction();
		valueOf(sound.stop).shouldBeFunction();
	},
	// https://appcelerator.lighthouseapp.com/projects/32238-titanium-mobile/tickets/2586
	audioPlayerAPIs: function() {
		var isAndroid = (Ti.Platform.osname === 'android');
		valueOf(Ti.Media.createAudioPlayer).shouldBeFunction();
		var player = Ti.Media.createAudioPlayer();
		valueOf(player).shouldNotBeNull();
		valueOf(player.pause).shouldBeFunction();
		valueOf(player.start).shouldBeFunction();
		valueOf(player.setUrl).shouldBeFunction();
		if (!isAndroid) valueOf(player.stateDescription).shouldBeFunction();
		valueOf(player.stop).shouldBeFunction();
		if (!isAndroid) valueOf(player.idle).shouldBeBoolean();
		if (!isAndroid) valueOf(player.state).shouldBeNumber();
		valueOf(player.paused).shouldBeBoolean();
		if (!isAndroid) valueOf(player.waiting).shouldBeBoolean();
	}
})
