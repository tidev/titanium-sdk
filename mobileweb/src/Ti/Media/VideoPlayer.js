define("Ti/Media/VideoPlayer", ["Ti/_/declare", "Ti/Media", "Ti/UI/View"], function(declare, Media, View) {

	var on = require.on,
		STOPPED = 0,
		STOPPING = 1,
		PAUSED = 2,
		PLAYING = 3,
		nativeFullscreen,
		fakeFullscreen = true,
		mimeTypes = {
			"m4v": "video/mp4",
			"mov": "video/quicktime",
			"mp4": "video/mp4",
			"ogg": "video/ogg",
			"ogv": "video/ogg",
			"webm": "video/webm"
		};

	return declare("Ti.Media.VideoPlayer", View, {

		_currentState: STOPPED,

		constructor: function() {
			this._handles = [];
		},

		properties: {
			autoplay: false,
			repeatMode: Media.VIDEO_REPEAT_MODE_NONE,
			fullscreen: {
				// TODO: Add check for Firefox <http://www.thecssninja.com/javascript/fullscreen>
				value: (function(s) {
					return s && s();
				}(document.createElement("video").webkitDisplayingFullscreen)),

				set: function(value) {
					var h,
						v = this._video;

					value = !!value;
					if (nativeFullscreen) {
						try {
							if (value) {
								v.webkitEnterFullscreen();
							} else {
								v.webkitExitFullscreen();
							}
						} catch(ex) {}
					} else if (fakeFullscreen) {
						v.className = value ? "fullscreen" : "";
						value && (h = on(window, "keydown", function(e) {
							if (e.keyCode === 27) {
								this.fullscreen = 0;
								h();
							}
						}));
					}

					this.fireEvent("fullscreen", {
						entering: value
					});

					return value;
				}
			},
			scalingMode: {
				set: function(value) {
					var n = this.domNode,
						fit = Media.VIDEO_SCALING_ASPECT_FIT,
						m = {};

					m[Media.VIDEO_SCALING_NONE] = "TiScalingNone";
					m[fit] = "TiScalingAspectFit";
					n.className = n.className.replace(/(scaling\-[\w\-]+)/, "") + ' ' + (m[value] || m[value = fit]);
					return value;
				}
			},
			url: {
				set: function(value) {
					this.constants.playing = false;
					this._currentState = STOPPED;
					this.properties.__values__.url = value;
					this._createVideo();
					return value;
				}
			},
			mediaControlStyle: {
				value: Media.VIDEO_CONTROL_DEFAULT,
				set: function(value) {
					this._video.controls = value === Media.VIDEO_CONTROL_DEFAULT;
					return value;
				}
			}
		},

		constants: {
			playbackState: Media.VIDEO_PLAYBACK_STATE_STOPPED,
			playing: false,
			initialPlaybackTime: 0,
			currentPlaybackTime: 0,
			endPlaybackTime: 0,
			playableDuration: 0,
			loadState: Media.VIDEO_LOAD_STATE_UNKNOWN,
			duration: 0
		},

		_set: function(type, state) {
			var evt = {};
			evt[type] = this.constants[type] = state;
			this.fireEvent(type === "loadState" ? type.toLowerCase() : type, evt);
		},

		_complete: function(evt) {
			var ended = evt.type === "ended";
			this.constants.playing = false;
			this._currentState = STOPPED;
			this.fireEvent("complete", {
				reason: ended ? Media.VIDEO_FINISH_REASON_PLAYBACK_ENDED : Media.VIDEO_FINISH_REASON_USER_EXITED
			});
			ended && this.repeatMode === Media.VIDEO_REPEAT_MODE_ONE && setTimeout(function() { this._video.play(); }, 1);
		},

		_stalled: function() {
			this._set("loadState", Media.VIDEO_LOAD_STATE_STALLED);
		},

		_fullscreenChange: function(e) {
			this.fullscreen && (this.fullscreen = !_fullscreen);
		},

		_metaDataLoaded: function() {
			// TODO: Add check for Firefox <http://www.thecssninja.com/javascript/fullscreen>
			nativeFullscreen = this._video.webkitSupportsFullscreen;
			this._durationChange();
		},

		_durationChange: function() {
			var d = this.duration,
				c = this.constants;
			if (d !== Infinity) {
				this.duration || this.fireEvent("durationAvailable", {
					duration: d
				});
				c.duration = c.playableDuration = c.endPlaybackTime = d;
			}
		},

		_paused: function() {
			var pbs = Media.VIDEO_PLAYBACK_STATE_STOPPED;
			this.constants.playing = false;
			if (this._currentState === PLAYING) {
				this._currentState = PAUSED;
				pbs = Media.VIDEO_PLAYBACK_STATE_PAUSED;
			} else if (this._currentState === STOPPING) {
				this._video.currentTime = 0;
			}
			this._set("playbackState", pbs);
		},

		_createVideo: function(dontCreate) {
			var i, src, match,
				video = this._video,
				url = this.url;

			if (!url) {
				return;
			}

			if (dontCreate && video && video.parentNode) {
				return video;
			}

			this.release();

			video = this._video = document.createElement("video");
			video.tabindex = 0;

			this.mediaControlStyle === Media.VIDEO_CONTROL_DEFAULT && (video.controls = 1);
			this.scalingMode = Media.VIDEO_SCALING_ASPECT_FIT;

			this._handles = [
				on(video, "playing", this, function() {
					this._currentState = PLAYING;
					this.constants.playing = true;
					this.fireEvent("playing", {
						url: video.currentSrc
					});
					this._set("playbackState", Media.VIDEO_PLAYBACK_STATE_PLAYING);
				}),
				on(video, "pause", this, "_paused"),
				on(video, "canplay", this, function() {
					this._set("loadState", Media.VIDEO_LOAD_STATE_PLAYABLE);
					this._currentState === STOPPED && this.autoplay && video.play();
				}),
				on(video, "canplaythrough", this, function() {
					this._set("loadState", Media.VIDEO_LOAD_STATE_PLAYTHROUGH_OK);
					this.fireEvent("preload");
				}),
				on(video, "loadeddata", this, function() {
					this.fireEvent("load");
				}),
				on(video, "loadedmetadata", this, "_metaDataLoaded"),
				on(video, "durationchange", this, "_durationChange"),
				on(video, "timeupdate", this, function() {
					this.constants.currentPlaybackTime = Math.round(this.currentTime);
					this._currentState === STOPPING && this.pause();
				}),
				on(video, "error", this, function() {
					console.debug("ERROR EVENT");
					console.debug(video);
					console.debug(video.error);
					var msg = "Unknown error";
					switch (video.error.code) {
						case 1: msg = "Aborted"; break;
						case 2: msg = "Decode error"; break;
						case 3: msg = "Network error"; break;
						case 4: msg = "Unsupported format";
					}
					this.constants.playing = false;
					this._set("loadState", Media.VIDEO_LOAD_STATE_UNKNOWN);
					this.fireEvent("error", {
						message: msg
					});
					this.fireEvent("complete", {
						reason: Media.VIDEO_FINISH_REASON_PLAYBACK_ERROR
					});
				}),
				on(video, "abort", this, "_complete"),
				on(video, "ended", this, "_complete"),
				on(video, "stalled", this, "_stalled"),
				on(video, "waiting", this, "_stalled"),
				on(video, "mozfullscreenchange", this, "_fullscreenChange"),
				on(video, "webkitfullscreenchange", this, "_fullscreenChange")
			];

			this.domNode.appendChild(video);

			require.is(url, "Array") || (url = [url]);

			for (i = 0; i < url.length; i++) {
				src = document.createElement("source");
				src.src = url[i];
				match = url[i].match(/.+\.([^\/\.]+?)$/);
				match && mimeTypes[match[1]] && (src.type = mimeTypes[match[1]]);
				video.appendChild(src);
			}

			return video;
		},

		play: function() {
			this._currentState !== PLAYING && this._createVideo(1).play();
		},

		pause: function() {
			this._currentState === PLAYING && this._createVideo(1).pause();
		},

		release: function() {
			var i,
				video = this._video,
				parent = video && video.parentNode;
			if (parent) {
				require.each(this._handles, function(h) { h(); });
				this._handles = [];
				parent.removeChild(video);
			}
			this._video = null;
		},

		stop: function() {
			this._currentState = STOPPING;
			this._video.pause();
			this._video.currentTime = 0;
		}

	});

});
