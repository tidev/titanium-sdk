define(['Ti/_/declare', 'Ti/_/Media/Audio'], function(declare, Audio) {
	
	var messageMap = [void 0, 'Aborted', 'Decode error', 'Network error', 'Unsupported format'],
		ENDED = 9,
		ABORT = 10,
		ERROR = 11;
	
	return declare('Ti.Media.Sound', Audio, {
		
		_changeState: function(newState, description) {
			Audio.prototype._changeState.apply(this, arguments);
			var evt = {};
			evt.src = this;
			switch (this._currentState) {
				case ENDED:
					evt.type = 'complete';
					evt.success = true;
					this.looping || this.fireEvent('complete', evt);  // external (interface) event
					break;
				case ERROR: 
					evt.type = 'error';	
					evt.message = description;
					this.fireEvent('error', evt);  // external (interface) event
					break;
			}
		},
		
		_durationChange: function() {
            var d = this._audio.duration;
			// Blackberry OS 7 gives the initial duration as Infinity
			// So we leave duration at zero until the duration of <audio> is finite.
			d === Infinity || (this.constants.__values__.duration = Math.floor(d));
		},
		
		_loadedmetadata: function() {
			this._durationChange();
		},
		
		_error: function() {
			this._changeState(ERROR, 'error: ' + (messageMap[this._audio.error.code] || 'Unknown error'));
		},
		
		_ended: function() {
			this._changeState(ENDED, 'ended');
		},
		
		_abort: function() {
			this._changeState(ABORT, 'abort');
		},
		
		_beforeInit: function() {
			this._audio.volume = this.volume;
			this._audio.loop = this.looping;
			this._audio.currentTime = this.time / 1000;
		},
		
		_afterInit: function() {
			// _nextCmd: this variable records the command that was requested before the <audio> tag 
			// was initialized. It will be executed when the tag becomes initialized.
			this._nextCmd && this._nextCmd();
			this._nextCmd = 0;
		},
		
		release: function() {
			this.constants.__values__.duration = 0;
			Audio.prototype.release.apply(this, arguments);
		},
		
		reset: function() {
			this.time = 0;
		},
		
		isLooping: function() {
			return this.looping;
		},
		
		constants: {
			duration: 0
		},
		
		properties: {
			// The following 2 properties mirror (cache) the according properties of the <audio> tag:
			// time, looping.
			//
			// Reason: if the <audio> tag is not initialized, direct referencing of the tag's properties
			// leads to exception. To prevent this situation, we mirror the properties and use them
			// if the tag's properties cannot be accessed at the moment.

			time: {
				value: 0,
				get: function(value) {
					return this._initialized ? Math.floor(this._audio.currentTime * 1000) : value;
				},
				set: function(value) {
					this._initialized && (this._audio.currentTime = value / 1000);
					return value;
				}
			},
			
			looping: {
				value: false,
				set: function(value) {
					this._initialized && (this._audio.loop = value);
					return value;
				}
			}
		}
	});

});
