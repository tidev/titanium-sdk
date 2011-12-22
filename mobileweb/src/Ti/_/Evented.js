define("Ti/_/Evented", ["Ti/_/declare"], function(declare) {

	return {
		listener: null,

		addEventListener: function(name, handler) {
			this.listener || (this.listener = {});
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
				events = this.listeners && this.listeners[name],
				l = events && events.length,
				data = require.mix({
					source: this,
					type: name
				}, eventData);

			while (i < l) {
				events[i++].call(this, data);
			}
		}
	};

});