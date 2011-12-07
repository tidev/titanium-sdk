(function(oParentNamespace) {

	// Create object
	oParentNamespace.EventDriven = function(obj) {
		var listeners = null;
		
		obj.addEventListener = function(eventName, cb){
			if(listeners == null) {
				listeners = {};
			}
			var events = listeners[eventName];
			if (events == null) {
				listeners[eventName] = events = [];
			}
			events.push(cb);
		};
		
		obj.removeEventListener = function(eventName, cb){
			if (listeners != null) {
				var events = listeners[eventName];
				if (events != null) {
					if ('undefined' != typeof cb) {
						for (var ii = 0; ii < events.length; ii++) {
							if (cb == events[ii]) {
								events.splice(ii, 1);
							} 
						}
					} /*else {
						// If event listener name is empty - remove all listeners
						listeners[eventName] = {};
					}*/
				}
			}
		};
		
		obj.hasListener = function(eventName) {
			return listeners && listeners[eventName];
		};
		
		obj.fireEvent = function(eventName, eventData){
			if (listeners != null) {
				var events = listeners[eventName];
				if (events != null) {
					var ev = eventData ? Ti._5.extend({}, eventData) : {};
					ev.type = eventName;
					for (var ii = 0; ii < events.length; ii++) {
						events[ii].call(obj, ev);
					}
				}
			}
		};
	};
})(Ti._5);		