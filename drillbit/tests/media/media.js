describe("Ti.Media tests", {
	constants: function() {
		valueOf(Ti.Media).shouldNotBeNull();
		
		// Video Scaling
		valueOf(Ti.Media.VIDEO_SCALING_NONE).shouldNotBeNull();
		valueOf(Ti.Media.VIDEO_SCALING_ASPECT_FILL).shouldNotBeNull();
		valueOf(Ti.Media.VIDEO_SCALING_ASPECT_FIT).shouldNotBeNull();
		valueOf(Ti.Media.VIDEO_SCALING_MODE_FILL).shouldNotBeNull();
	},
	soundAPIs: function() {
		valueOf(Ti.Media.createSound).shouldBeFunction();
		
		var sound = Ti.Media.createSound({ url : "sound.wav" });
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
		if (!isAndroid) valueOf(player.bufferSize).shouldBeInteger();
		
	},
	videoPlayerAPIs: function() {
		var isAndroid = (Ti.Platform.osname === 'android');
		
		valueOf(Ti.Media.createVideoPlayer).shouldBeFunction();
		var player = Ti.Media.createVideoPlayer();
		valueOf(player).shouldNotBeNull();
		valueOf(player.add).shouldBeFunction();
		valueOf(player.pause).shouldBeFunction();
		valueOf(player.start).shouldBeFunction();
		valueOf(player.stop).shouldBeFunction();
		if (!isAndroid) valueOf(player.setUrl).shouldBeFunction();
		valueOf(player.hide).shouldBeFunction();
		valueOf(player.setMediaControlStyle).shouldBeFunction();
		valueOf(player.getMediaControlStyle).shouldBeFunction();
		valueOf(player.getScalingMode).shouldBeFunction();
		valueOf(player.setScalingMode).shouldBeFunction();
	},
	audioTimeValidation: asyncTest({
		start: function() {
			var sound = Ti.Media.createSound({ url : "sound.wav" });
			var initial_pos = 3000;
			sound.time = initial_pos;
			sound.setTime(initial_pos);
			valueOf(sound.getTime()).shouldBe(initial_pos);
			valueOf(sound.time).shouldBe(initial_pos);
			sound.play();
			setTimeout(this.async(function(e) {
				var time = sound.getTime();
				Ti.API.info("PROGRESS: " + time);
				valueOf(time).shouldBeGreaterThan(initial_pos);
				// assume we get an event in < 2 seconds.
				valueOf(time).shouldBeLessThan(initial_pos + 3000); 
				sound.stop();
				sound = null;
				}), 1000);
		},
		timeout: 5000,
		timeoutError: "Timed out waiting for sound to play."
	})
	// TODO: Need a player streaming test for validating some of those features
})
