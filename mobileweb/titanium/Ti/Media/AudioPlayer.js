define(['Ti/_/declare', 'Ti/_/Media/Audio'], function(declare, Audio) {
	
	var messageMap = [void 0, 'Aborted', 'Decode error', 'Network error', 'Unsupported format'],
		stateMap = ['buffering', 'initialized', 'paused', 'playing', 'starting',
					'stopped', 'stopping','waiting for data', 'waiting for queue'];
	
	return declare('Ti.Media.AudioPlayer', Audio, {
		
		_changeState: function(newState, description) {
			Audio.prototype._changeState.apply(this, arguments);
			
			var cons = this.constants.__values__,
				evt = {};
				
			cons.idle = this._initialized && !cons.playing;
			
			evt.src = this;
			evt.state = cons.state = newState;
			evt.description = description;
			
			this.fireEvent('change', evt);// external (interface) event
		},
		
		_error: function() {
			// The error event is missing in Titanium API.
			// So we will fire 'change' event with state='STATE_STOPPED' 
			// and description about error
			this._changeState(this.STATE_STOPPED, 'error: ' + (messageMap[this._audio.error.code] || 'Unknown error'));
		},
		
		_ended: function() {
			// stopped with description='ended'
			this._stop('ended');
		},
		
		_abort: function() {
			// stopped with description='abort'
			this._changeState(this.STATE_STOPPED, 'abort');
		},
		
		_timeupdate: function() {
			progress = Math.floor(this._audio.currentTime * 1000);
			this.fireEvent( 'progress', { 'progress': progress } );// external (interface) event
			
			Audio.prototype._timeupdate.apply(this, arguments);
		},
		
		_beforeInit: function() {
			this._audio.volume = this.volume;
		},
		
		_afterInit: function() {
			//autoplay or _nextCmd()
			if (this.autoplay || this._nextCmd === this.start) {
				this._audio.play();
			} else if ( this._nextCmd ) {
				this._nextCmd();
			}
			
			this._nextCmd = 0;
			this.autoplay = false;
		},
		
		stateDescription: function(stateId) {
			return stateMap[stateId] || '';
		},
		
		constants: {
			STATE_BUFFERING: 0,
			STATE_INITIALIZED: 1,
			STATE_PAUSED: 2,
			STATE_PLAYING: 3,
			STATE_STARTING: 4,
			STATE_STOPPED: 5,
			STATE_STOPPING: 6,
			STATE_WAITING_FOR_DATA: 7,
			STATE_WAITING_FOR_QUEUE: 8,
			playing: false,
			idle: false,
			state: this.STATE_STOPPED,
			progress: 0
		},
		
		properties: {
			// NOTE: This property is new. It is proposed for inclusion.
			autoplay: false
		}
	});

});
