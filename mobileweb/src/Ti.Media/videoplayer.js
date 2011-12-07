Ti._5.createClass("Titanium.Media.VideoPlayer", function(args){
	args = args || {};

	var self = this,
		on = require.on,
		handles,
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

		_scalingMode = args.scalingMode || Ti.Media.VIDEO_SCALING_ASPECT_FIT,
		_mediaControlStyle = args.mediaControlStyle || Ti.Media.VIDEO_CONTROL_DEFAULT,
		_url = args.url;

	// Interfaces
	Ti._5.DOMView(self, "div", args, "VideoPlayer");
	Ti._5.Touchable(self);
	Ti._5.Styleable(self, args);
	Ti._5.EventDriven(self);
	Ti._5.Positionable(self, args);

	// Properties
	self.playbackState = Ti.Media.VIDEO_PLAYBACK_STATE_STOPPED;
	self.playing = false;
	self.initialPlaybackTime = self.currentPlaybackTime = 0;
	self.loadState = Ti.Media.VIDEO_LOAD_STATE_UNKNOWN;
	self.autoplay = !!args.autoplay;
	self.repeatMode = args.repeatMode || Ti.Media.VIDEO_REPEAT_MODE_NONE;

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
				entering: _fullscreen,
				source: self
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
			video.controls = val === Ti.Media.VIDEO_CONTROL_DEFAULT;
			return _mediaControlStyle = val;
		}
	});

	function setSize() {
		var cls = "scaling-aspect-fit";
		switch (_scalingMode) {
			case Ti.Media.VIDEO_SCALING_NONE: 			cls = "scaling-none";			break;
			case Ti.Media.VIDEO_SCALING_MODE_FILL:		cls = "scaling-mode-fill";		break;
			case Ti.Media.VIDEO_SCALING_ASPECT_FILL:	cls = "scaling-aspect-fill";	break;
		}
		self.dom.className = self.dom.className.replace(/(scaling\-[\w\-]+)/, "") + ' ' + cls;
	}

	function setPlaybackState(state) {
		self.fireEvent("playbackState", {
			playbackState: self.playbackState = state,
			source: self
		});
	}

	function setLoadState(state) {
		self.fireEvent("loadstate", {
			loadState: self.loadState = state,
			source: self
		});
	}

	function complete(evt) {
		var ended = evt.type === "ended";
		self.playing = false;
		self.fireEvent("complete", {
			reason: ended ? Ti.Media.VIDEO_FINISH_REASON_PLAYBACK_ENDED : Ti.Media.VIDEO_FINISH_REASON_USER_EXITED,
			source: self
		});
		ended && self.repeatMode === Ti.Media.VIDEO_REPEAT_MODE_ONE && this.play();
	}

	function stalled() {
		self.playing = false;
		setLoadState(Ti.Media.VIDEO_LOAD_STATE_STALLED);
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
				duration: d,
				source: self
			});
			setDuration(d);
		}
	}

	function createVideo(dontCreate) {
		var i, src, match,
			url = self.url;

		if (video && video.parentNode && dontCreate) {
			return video;
		}

		self.release();

		video = document.createElement("video");
		video.tabindex = 0;
		_mediaControlStyle === Ti.Media.VIDEO_CONTROL_DEFAULT && (video.controls = 1);

		handles = [
			on(video, "playing", function() {
				self.playing = true;
				self.fireEvent("playing", {
					url: video.currentSrc,
					source: self
				});
				setPlaybackState(Ti.Media.VIDEO_PLAYBACK_STATE_PLAYING);
			}),
			on(video, "pause", function() {
				self.playing = false;
				setPlaybackState(this.currentTime == 0 ? Ti.Media.VIDEO_PLAYBACK_STATE_STOPPED : Ti.Media.VIDEO_PLAYBACK_STATE_PAUSED);
			}),
			on(video, "canplay", function() {
				setLoadState(Ti.Media.VIDEO_LOAD_STATE_PLAYABLE);
				self.autoplay && video.play();
			}),
			on(video, "canplaythrough", function() {
				setLoadState(Ti.Media.VIDEO_LOAD_STATE_PLAYTHROUGH_OK);
				self.fireEvent("preload", {
					source: self
				});
			}),
			on(video, "loadeddata", function() {
				self.fireEvent("load", {
					source: self
				});
			}),
			on(video, "loadedmetadata", metaDataLoaded),
			on(video, "durationchange", durationChange),
			on(video, "timeupdate", function(){
				self.currentPlaybackTime = Math.round(this.currentTime);
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
				setLoadState(Ti.Media.VIDEO_LOAD_STATE_UNKNOWN);
				self.fireEvent("error", {
					message: msg,
					source: self
				});
				self.fireEvent("complete", {
					reason: Ti.Media.VIDEO_FINISH_REASON_PLAYBACK_ERROR,
					source: self
				});
			}),
			on(video, "suspend", function() {
				self.playing = false;
				setLoadState(Ti.Media.VIDEO_LOAD_STATE_UNKNOWN);
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
	self.pause = function(){
		createVideo(1).pause();
	};

	self.play = function(){
		createVideo(1).play();
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
		var v = createVideo(1);
		v.pause();
		v.currentTime = 0;
	};

	// if we have a url, then create the video
	self.url && createVideo();
});