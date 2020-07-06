import EventEmitter from './events';
import util from './util';

function Stream(opts) {
	// FIXME: Can't call EventEmitter as a function!
	this._eventsToListeners = {};
	this._maxListeners = undefined;
	// EventEmitter.call(this, opts);
	// TODO: Provide more than an empty class?
}
Object.setPrototypeOf(Stream.prototype, EventEmitter.prototype);
Object.setPrototypeOf(Stream, EventEmitter);
// Use util.inherits?

function Readable(options) {
	if (!(this instanceof Readable)) {
		return new Readable(options);
	}

	// TODO: readableState?

	this.readable = true;

	if (options) {
		if (typeof options.read === 'function') {
			this._read = options.read;
		}
		if (typeof options.destroy === 'function') {
			this._destroy = options.destroy;
		}
	}

	Stream.call(this);
}
util.inherits(Readable, Stream);
Readable.prototype._destroy = function (err, cb) {
	cb(err);
};
Readable.prototype._read = function (n) {
	throw new Error('method not implemented: _read()');
};

function Writable(options) {
	const isDuplex = this instanceof Duplex;
	if (!isDuplex && !(this instanceof Writable)) {
		return new Writable(options);
	}
	this.writable = true;

	if (options) {
		if (typeof options.write === 'function') {
			this._write = options.write;
		}
		if (typeof options.writev === 'function') {
			this._writev = options.writev;
		}
		if (typeof options.destroy === 'function') {
			this._destroy = options.destroy;
		}
		if (typeof options.final === 'function') {
			this._final = options.final;
		}
	}

	Stream.call(this);
}
util.inherits(Writable, Stream);

function Duplex(options) {
	if (!(this instanceof Duplex)) {
		return new Duplex(options);
	}
	Readable.call(this, options);
	Writable.call(this, options);
	// TODO: Provide more than an empty class!
	this.allowHalfOpen = true;

	if (options) {
		if (options.readable === false) {
			this.readable = false;
		}
		if (options.writable === false) {
			this.writable = false;
		}

		if (options.allowHalfOpen === false) {
			this.allowHalfOpen = false;
			// this.once('end', onend);
		}
	}
}
util.inherits(Duplex, Readable);
// Copy Writable methods to Duplex (basically the odd double-inheritance)
const writableMethods = Object.keys(Writable.prototype);
for (let i = 0; i < writableMethods.length; i++) {
	const method = writableMethods;
	if (!Duplex.prototype[method]) {
		Duplex.prototype[method] = Writable.prototype[method];
	}
}

function Transform(options) {
	if (!(this instanceof Transform)) {
		return new Transform(options);
	}
	Duplex.call(this, options);
	// TODO: Provide more than an empty class!
	if (options) {
		if (typeof options.transform === 'function') {
			this._transform = options.transform;
		}
		if (typeof options.flush === 'function') {
			this._flush = options.flush;
		}
	} // When the writable side finishes, then flush out anything remaining.

	// this.on('prefinish', prefinish);
}
util.inherits(Transform, Duplex);

Stream.Stream = Stream; // legacy compat
Stream.Transform = Transform;

export default Stream;
