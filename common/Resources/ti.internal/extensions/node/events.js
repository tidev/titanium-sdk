/**
 * @param {EventEmitter} emitter the EventEmitter instance to use to register for it's events
 * @param {string} eventName the name of the event to register for
 * @param {function} listener the listener callback/function to invoke when the event is emitted
 * @param {boolean} prepend whether to prepend or append the listener
 * @returns {EventEmitter}
 */
function _addListener(emitter, eventName, listener, prepend) {
	if (!emitter._eventsToListeners) { // no events/listeners registered
		emitter._eventsToListeners = {}; // initialize it
	}
	// if there's someone listening to 'newListener' events, emit that **before** we add the listener (to avoid infinite recursion)
	if (emitter._eventsToListeners.newListener) {
		emitter.emit('newListener', eventName, listener);
	}

	const eventListeners = emitter._eventsToListeners[eventName] || [];
	if (prepend) {
		eventListeners.unshift(listener);
	} else {
		eventListeners.push(listener);
	}
	emitter._eventsToListeners[eventName] = eventListeners;

	// Check max listeners and spit out warning if >
	const max = emitter.getMaxListeners();
	const length = eventListeners.length;
	if (max > 0 && length > max) {
		const w = new Error(`Possible EventEmitter memory leak detected. ${length} ${eventName} listeners added. Use emitter.setMaxListeners() to increase limit`);
		w.name = 'MaxListenersExceededWarning';
		w.emitter = emitter;
		w.type = eventName;
		w.count = length;
		process.emitWarning(w);
	}
	return emitter;
}

function onceWrap(emitter, eventName, listener) {
	function wrapper(...args) {
		this.emitter.removeListener(this.eventName, this.wrappedFunc); // remove ourselves
		this.listener.apply(this.emitter, args); // then forward the event callback
	}
	// we have to use bind with a custom 'this', because events fire with 'this' pointing at the emitter
	const wrapperThis = {
		emitter, eventName, listener
	};
	const bound = wrapper.bind(wrapperThis); // bind to force "this" to refer to our custom object tracking the wrapper/emitter/listener
	bound.listener = listener; // have to add listener property for "unwrapping"
	wrapperThis.wrappedFunc = bound;
	return bound;
}

// many consumers make use of this via util.inherits, which does not chain constructor calls!
// so we need to be aware that _eventsToListeners maye be null/undefined on instances, and check in methods before accessing it
export default class EventEmitter {
	constructor() {
		this._eventsToListeners = {};
		this._maxListeners = undefined;
	}

	addListener(eventName, listener) {
		return _addListener(this, eventName, listener, false);
	}

	on(eventName, listener) {
		return this.addListener(eventName, listener);
	}

	prependListener(eventName, listener) {
		return _addListener(this, eventName, listener, true);
	}

	once(eventName, listener) {
		this.on(eventName, onceWrap(this, eventName, listener));
	}

	prependOnceListener(eventName, listener) {
		this.prependListener(eventName, onceWrap(this, eventName, listener));
	}

	removeListener(eventName, listener) {
		if (!this._eventsToListeners) { // no events/listeners registered
			return this;
		}
		const eventListeners = this._eventsToListeners[eventName] || [];
		const length = eventListeners.length;
		let foundIndex = -1;
		let unwrappedListener;
		// Need to search LIFO, and need to handle wrapped functions (once wrappers)
		for (let i = length - 1; i >= 0; i--) {
			if (eventListeners[i] === listener || eventListeners[i].listener === listener) {
				foundIndex = i;
				unwrappedListener = eventListeners[i].listener;
				break;
			}
		}

		if (foundIndex !== -1) {
			if (length === 1) { // length was 1 and we want to remove last entry, so delete the event type from our listener mapping now!
				delete this._eventsToListeners[eventName];
			} else { // we had 2+ listeners, so store array without this given listener
				eventListeners.splice(foundIndex, 1); // modifies in place, no need to assign to this.listeners[eventName]
			}
			// Don't emit if there's no listeners for 'removeListener' type!
			if (this._eventsToListeners.removeListener) {
				this.emit('removeListener', eventName, unwrappedListener || listener);
			}
		}
		return this;
	}

	off(eventName, listener) {
		return this.removeListener(eventName, listener);
	}

	emit(eventName, ...args) {
		if (!this._eventsToListeners) { // no events/listeners registered
			return false;
		}
		const eventListeners = this._eventsToListeners[eventName] || [];
		for (const listener of eventListeners.slice()) { // must operate on copy because listeners ,ay get remove as side-effect of calling
			listener.call(this, ...args);
		}
		return eventListeners.length !== 0;
	}

	listenerCount(eventName) {
		if (!this._eventsToListeners) { // no events/listeners registered
			return 0;
		}
		const eventListeners = this._eventsToListeners[eventName] || [];
		return eventListeners.length;
	}

	eventNames() {
		return Object.getOwnPropertyNames(this._eventsToListeners || {});
	}

	listeners(eventName) {
		if (!this._eventsToListeners) { // no events/listeners registered
			return [];
		}
		// Need to "unwrap" once wrappers!
		const raw = (this._eventsToListeners[eventName] || []);
		return raw.map(l => l.listener || l);  // here we unwrap the once wrapper if there is one or fall back to listener function
	}

	rawListeners(eventName) {
		if (!this._eventsToListeners) { // no events/listeners registered
			return [];
		}
		return (this._eventsToListeners[eventName] || []).slice(0); // return a copy
	}

	getMaxListeners() {
		return this._maxListeners || EventEmitter.defaultMaxListeners;
	}

	setMaxListeners(n) {
		this._maxListeners = n; // TODO: Type check n, make sure >= 0 (o equals no limit)
		return this;
	}

	removeAllListeners(eventName) {
		if (!this._eventsToListeners) { // no events/listeners registered
			this._eventsToListeners = {}; // initialize it
		}
		if (!this._eventsToListeners.removeListener) {
			// no need to emit! we can just wipe!
			if (eventName === undefined) {
				// remove every type!
				this._eventsToListeners = {};
			} else {
				// remove specific type
				delete this._eventsToListeners[eventName];
			}
			return this;
		}

		// yuck, we'll have to emit 'removeListener' events as we go
		if (eventName === undefined) {
			// Remove all types (but do 'removeListener' last!)
			const names = Object.keys(this._eventsToListeners).filter(name => name !== 'removeListener');
			names.forEach(name => this.removeAllListeners(name));
			this.removeAllListeners('removeListener');
			this._eventsToListeners = {};
		} else {
			// remove listeners for one type, back to front (Last-in, first-out, except where prepend f-ed it up)
			const listeners = this._eventsToListeners[eventName] || [];
			for (let i = listeners.length - 1; i >= 0; i--) {
				this.removeListener(eventName, listeners[i]);
			}
		}

		return this;
	}
}

EventEmitter.defaultMaxListeners = 10;
EventEmitter.listenerCount = function (emitter, eventName) {
	return emitter.listenerCount(eventName);
};
EventEmitter.EventEmitter = EventEmitter;
