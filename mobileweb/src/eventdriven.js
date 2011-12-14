Ti._5.EventDriven = function(obj) {
	var listeners = null;

	obj.addEventListener = function(eventName, handler){
		listeners || (listeners = {});
		(listeners[eventName] = listeners[eventName] || []).push(handler);
	};

	obj.removeEventListener = function(eventName, handler){
		if (listeners) {
			if (handler) {
				var i = 0,
					events = listeners[eventName],
					l = events && events.length || 0;

				for (; i < l; i++) {
					events[i] === handler && events.splice(i, 1);
				}
			} else {
				delete listeners[eventName];
			}
		}
	};

	obj.hasListener = function(eventName) {
		return listeners && listeners[eventName];
	};

	obj.fireEvent = function(eventName, eventData){
		if (listeners) {
			var i = 0,
				events = listeners[eventName],
				l = events && events.length,
				data = require.mix({
					source: obj,
					type: eventName
				}, eventData);

			while (i < l) {
				events[i++].call(obj, data);
			}
		}
	};
};
