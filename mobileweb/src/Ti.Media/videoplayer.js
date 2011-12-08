Ti._5.createClass("Titanium.Media.VideoPlayer", function(args){
	args = args || {};

	var self = this,
		media = Ti.Media,
		on = require.on,
		handles,
		/*STOPPED = "stopped",
		STOPPING = "stopping",
		PAUSED = "paused",
		PLAYING = "playing",*/
		STOPPED = 0,
		STOPPING = 1,
		PAUSED = 2,
		PLAYING = 3,
		currentState = STOPPED,
		video = document.createElement("video"),
		nativeFullscreen,
		fakeFullscreen = true,
		mimeTypes = {
			"m4v": "video/mp4",
			"mov": "video/quicktime",
			"mp4": "video/mp4",
			"ogg": "video/ogg",
			"ogv": "video/ogg",
			"webm": "video/webm"
		},

		// TODO: Add check for Firefox <http://www.thecssninja.com/javascript/fullscreen>
		_fullscreen = (function(s){ return args.fullscreen || s && s(); }(video.webkitDisplayingFullscreen)),

		_scalingMode = args.scalingMode || media.VIDEO_SCALING_ASPECT_FIT,
		_mediaControlStyle = args.mediaControlStyle || media.VIDEO_CONTROL_DEFAULT,
		_url = args.url;

	// Interfaces
	Ti._5.DOMView(self, "div", args, "VideoPlayer");
	Ti._5.Touchable(self);
	Ti._5.Styleable(self, args);
	Ti._5.EventDriven(self);
	Ti._5.Positionable(self, args);

	// Properties
	self.playbackState = media.VIDEO_PLAYBACK_STATE_STOPPED;
	self.playing = false;
	self.initialPlaybackTime = self.currentPlaybackTime = 0;
	self.loadState = media.VIDEO_LOAD_STATE_UNKNOWN;
	self.autoplay = !!args.autoplay;
	self.repeatMode = args.repeatMode || media.VIDEO_REPEAT_MODE_NONE;

	function setDuration(t) {
		self.duration = self.playableDuration = self.endPlaybackTime = t;
	}
	setDuration(0.0);

	Object.defineProperty(self, "fullscreen", {
		get: function(){ return _fullscreen; },
		set: function(fs){
			var h;

			fs = !!fs;
			if (nativeFullscreen) {
				try {
					if (fs) {
						video.webkitEnterFullscreen();
					} else {
						video.webkitExitFullscreen();
					}
				} catch(ex) {}
			} else if (fakeFullscreen) {
				video.className = fs ? "fullscreen" : "";
				fs && (h = on(window, "keydown", function(e){
					if (e.keyCode === 27) {
						self.fullscreen = 0;
						h();
					}
				}));
			}

			// need to set this after we've already switched to fullscreen
			_fullscreen = fs;

			self.fireEvent("fullscreen", {
				entering: _fullscreen
			});
		}
	});

	Object.defineProperty(self, "scalingMode", {
		get: function() {
			return _scalingMode;
		},
		set: function(val) {
			_scalingMode = val;
			setSize();
			return val;
		}
	});

	Object.defineProperty(self, "url", {
		get: function() { return _url; },
		set: function(val) {
			_url = val;
			createVideo();
			return val;
		}
	});

	Object.defineProperty(self, "mediaControlStyle", {
		get: function() { return _mediaControlStyle; },
		set: function(val) {
			video.controls = val === media.VIDEO_CONTROL_DEFAULT;
			return _mediaControlStyle = val;
		}
	});

	function setSize() {
		self.dom.className = self.dom.className.replace(/(scaling\-[\w\-]+)/, "") + ' '
			+ (_scalingMode === media.VIDEO_SCALING_NONE ? "scaling-none" : "scaling-aspect-fit");
	}

	function setPlaybackState(state) {
		self.fireEvent("playbackState", {
			playbackState: self.playbackState = state
		});
	}

	function setLoadState(state) {
		self.fireEvent("loadstate", {
			loadState: self.loadState = state
		});
	}

	function complete(evt) {
		var ended = evt.type === "ended";
		self.playing = false;
		currentState = STOPPED;
		self.fireEvent("complete", {
			reason: ended ? media.VIDEO_FINISH_REASON_PLAYBACK_ENDED : media.VIDEO_FINISH_REASON_USER_EXITED
		});
		ended && self.repeatMode === media.VIDEO_REPEAT_MODE_ONE && setTimeout(function(){ video.play(); }, 1);
	}

	function stalled() {
		setLoadState(media.VIDEO_LOAD_STATE_STALLED);
	}

	function fullscreenChange(e) {
		_fullscreen && (_fullscreen = !_fullscreen);
	}

	function metaDataLoaded() {
		// TODO: Add check for Firefox <http://www.thecssninja.com/javascript/fullscreen>
		nativeFullscreen = this.webkitSupportsFullscreen;
		durationChange();
	}

	function durationChange() {
		var d = this.duration;
		if (d !== Infinity) {
			self.duration || self.fireEvent("durationAvailable", {
				duration: d
			});
			setDuration(d);
		}
	}

	function paused() {
		var pbs = media.VIDEO_PLAYBACK_STATE_STOPPED;
		self.playing = false;
		if (currentState === PLAYING) {
			currentState = PAUSED;
			pbs = media.VIDEO_PLAYBACK_STATE_PAUSED;
		} else if (currentState === STOPPING) {
			video.currentTime = 0;
		}
		setPlaybackState(pbs);
	}

	function createVideo(dontCreate) {
		var i, src, match,
			url = self.url;

		if (dontCreate && video && video.parentNode) {
			return video;
		}

		self.release();

		video = document.createElement("video");
		video.tabindex = 0;
		_mediaControlStyle === media.VIDEO_CONTROL_DEFAULT && (video.controls = 1);

		handles = [
			on(video, "playing", function() {
				currentState = PLAYING;
				self.playing = true;
				self.fireEvent("playing", {
					url: video.currentSrc
				});
				setPlaybackState(media.VIDEO_PLAYBACK_STATE_PLAYING);
			}),
			on(video, "pause", paused),
			on(video, "canplay", function() {
				setLoadState(media.VIDEO_LOAD_STATE_PLAYABLE);
				currentState === STOPPED && self.autoplay && video.play();
			}),
			on(video, "canplaythrough", function() {
				setLoadState(media.VIDEO_LOAD_STATE_PLAYTHROUGH_OK);
				self.fireEvent("preload");
			}),
			on(video, "loadeddata", function() {
				self.fireEvent("load");
			}),
			on(video, "loadedmetadata", metaDataLoaded),
			on(video, "durationchange", durationChange),
			on(video, "timeupdate", function(){
				self.currentPlaybackTime = Math.round(this.currentTime);
				currentState === STOPPING && this.pause();
			}),
			on(video, "error", function() {
				var msg = "Unknown error";
				switch (this.error.code) {
					case 1: msg = "Aborted"; break;
					case 2: msg = "Decode error"; break;
					case 3: msg = "Network error"; break;
					case 4: msg = "Unsupported format";
				}
				self.playing = false;
				setLoadState(media.VIDEO_LOAD_STATE_UNKNOWN);
				self.fireEvent("error", {
					message: msg
				});
				self.fireEvent("complete", {
					reason: media.VIDEO_FINISH_REASON_PLAYBACK_ERROR
				});
			}),
			on(video, "abort", complete),
			on(video, "ended", complete),
			on(video, "stalled", stalled),
			on(video, "waiting", stalled),
			on(video, "mozfullscreenchange", fullscreenChange),
			on(video, "webkitfullscreenchange", fullscreenChange)
		];

		setSize();
		self.dom.appendChild(video);

		require.is(url, "Array") || (url = [url]);

		for (i = 0; i < url.length; i++) {
			src = document.createElement("source");
			src.src = url[i];
			match = url[i].match(/.+\.([^\/\.]+?)$/);
			match && mimeTypes[match[1]] && (src.type = mimeTypes[match[1]]);
			video.appendChild(src);
		}

		return video;
	}

	// Methods
	self.play = function(){
		currentState !== PLAYING && createVideo(1).play();
	};

	self.pause = function(){
		currentState === PLAYING && createVideo(1).pause();
	};

	self.release = function(){
		var i,
			parent = video && video.parentNode;
		if (parent) {
			for (i = 0; i < handles.length; i++) {
				handles[i]();
			}
			parent.removeChild(video);
		}
		video = null;
	};

	self.stop = function(){
		currentState = STOPPING;
		video.pause();
		video.currentTime = 0;
	};

	// if we have a url, then create the video
	self.url && createVideo();
});