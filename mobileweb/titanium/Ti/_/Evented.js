define(function() {
	
	var is = require.is;

	return {
		destroy: function() {
			for (var i in this) {
				delete this[i];
			}
			this._alive = 0;
		},

		addEventListener: function(name, handler) {
			this.listeners || (this.listeners = {});
			(this.listeners[name] = this.listeners[name] || []).push(handler)
		},

		removeEventListener: function(name, handler) {
			if (this.listeners) {
				if (handler) {
					var i = 0,
						events = this.listeners[name],
						l = events && events.length || 0;
	
					for (; i < l; i++) {
						events[i] === handler && events.splice(i, 1);
					}
				} else {
					delete this.listeners[name];
				}
			}
		},

		fireEvent: function(name, eventData) {
			var i = 0,
				modifiers = this._modifiers && this._modifiers[name],
				listeners = this.listeners && this.listeners[name],
				l = modifiers && modifiers.length,
				data = require.mix({
					source: this,
					type: name
				}, eventData);
				
			while (i < l) {
				modifiers[i++].call(this, data);
			}

			i = 0;
			l = listeners && listeners.length;
			while (i < l) {
				listeners[i++].call(this, data);
			}
		},
		
		_addEventModifier: function(name, handler) {
			this._modifiers || (this._modifiers = {});
			if (is(name,"Array")) {
				for (var i in name){
					(this._modifiers[name[i]] = this._modifiers[name[i]] || []).push(handler);
				}
			} else {
				(this._modifiers[name] = this._modifiers[name] || []).push(handler);
			}
		},
	};

});