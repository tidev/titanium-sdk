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
	}
})