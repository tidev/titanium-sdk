var Ti = {
	_event_listeners: [],
	
	createEventListener: function(listener) {
		var newListener = { listener: listener, systemId: -1, index: this._event_listeners.length };
		this._event_listeners.push(newListener);
		return newListener;
	},

	getEventListener: function(listener) {
		for (var i = 0;i < this._event_listeners.length; i++) {
			if (this._event_listeners[i].listener == listener) {
				return this._event_listeners[i];
			}
		}
		return null;
	},
	
	getEventListenerBySystemId: function(systemId) {
		for (var i = 0;i < this._event_listeners.length; i++) {
			if (this._event_listeners[i].systemId == systemId) {
				return this._event_listeners[i];
			}
		}
		return null;
	},

	API: _TiAPI,
	App: {
		addEventListener: function(eventName, listener)
		{
			var newListener = Ti.createEventListener(listener);
			newListener.systemId = _TiApp.addEventListener(eventName, newListener.index);
			return newListener.systemId;
		},
		
		removeEventListener: function(eventName, listener)
		{
			if (typeof listener == 'number') {
				_TiApp.removeEventListener(eventName, listener);
				
				var l = Ti.getEventListenerBySystemId(listener);
				if (l != null) {
					Ti._event_listeners.remove(l.index);
				}
			} else {
				var l = Ti.getEventListener(listener);
				if (l != null) {
					_TiApp.removeEventListener(eventName, l.systemId);
					Ti._event_listeners.remove(l.index);
				}
			}
		},
		
		fireEvent: function(eventName, data)
		{
			_TiApp.fireEvent(eventName, JSON.stringify(data));
		}
	},
	
	executeListener: function(id, data)
	{
		var listener = this.getEventListener(id);
		if (listener != null) {
			listener.listener(data);
		}
	}
};

var Titanium = Ti;

