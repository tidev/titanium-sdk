/*global define*/
define(function() {

	var mix = require.mix;

	return {
		destroy: function() {
			for (var i in this) {
				delete this[i];
			}
			this._alive = 0;
		},

		addEventListener: function(name, handler) {
			this.listeners || (this.listeners = {});
			(this.listeners[name] = this.listeners[name] || []).push(handler);
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

		fireEvent: function(name, data) {
			var i = 0,
				modifiers = this._modifiers && this._modifiers[name],
				listeners = this.listeners && this.listeners[name],
				l = modifiers && modifiers.length;

			data = data || {};
			mix(data, {
				source: data.source || this,
				type: name
			});

			while (i < l) {
				modifiers[i++].call(this, data);
			}

			if (listeners) {
				// We deep copy the listeners because the original list can change in the middle of a callback
				listeners = [].concat(listeners);
				i = 0;
				l = listeners.length;
				while (i < l) {
					listeners[i++].call(this, data);
				}
			}
		},

		applyProperties: function(props) {
			mix(this, props);
		},

		_addEventModifier: function(name, handler) {
			this._modifiers || (this._modifiers = {});
			(Array.isArray(name) ? name : [name]).forEach(function(n) {
				(this._modifiers[n] = this._modifiers[n] || []).push(handler);
			}, this);
		},

		constants: {
			apiName: {
				get: function() {
					return this.declaredClass;
				}
			}
		}
	};

});