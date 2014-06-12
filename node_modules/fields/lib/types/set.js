var common = require('../common'),
	events = require('events'),
	util = require('util');

module.exports = Set;

function Set(fields, opts) {
	if (!(this instanceof Set)) return new Set(fields, opts);
	this.fields = fields;
	this.stopOnError = true;
	common.mix(this, this._defaults, opts);
}

util.inherits(Set, events.EventEmitter);

function next(results, key, callback) {
	var obj = function (err) {
		var args = Array.prototype.slice.call(arguments, 1);
		if (args.length <= 1) {
			args = args[0]; // either the 2nd arg or undefined
		}
		args !== undefined && (results[key] = args);
		callback.call(obj, err);
	};
	obj.goto = function (i) {
		obj._goto = i;
		return this;
	};
	return obj;
}

function seriesArray(tasks, done) {
	var results = [],
		idx = 0,
		fs = this.fieldSeparator,
		go = function (key, field, err) {
			var then = function (go2) {
					if (go2) {
						idx = go2;
						if (idx < 0 || idx >= tasks.length) {
							return done(new Error('Invalid goto index: ' + idx), results);
						}
					} else if (go2 === false) {
						idx = tasks.length;
					} else {
						idx += 1;
					}
					if (idx === tasks.length) {
						done(null, results);
					} else {
						iterate();
					}
				}.bind(this),
				go2 = field && field.next ? field.next.call(field, err, results[key], then) : NaN;

			go2 !== void 0 && then(go2);
		}.bind(this),
		iterate = function () {
			var field = tasks[idx];
			this.emit('pre-prompt', field);
			field.prompt(next(results, idx, function (err) {
				fs && process.stdout.write(fs);
				this.emit('post-prompt', field, err, results[idx]);
				if (err && (this.stopOnError || (err instanceof Error && err.message == 'cancelled'))) {
					done(err, results);
				} else {
					go(idx, field, err);
				}
			}.bind(this)));
		}.bind(this);

	if (!tasks.length) {
		return done(null, results);
	}

	iterate();
}

function seriesObject(obj, done) {
	var results = {},
		idx = 0,
		keys = Object.keys(obj),
		fs = this.fieldSeparator,
		go = function (key, field, err) {
			var then = function (go2) {
					if (go2) {
						idx = keys.indexOf(go2);
						if (idx == -1) {
							return done(new Error('Invalid goto key: ' + go2), results);
						}
					} else if (go2 === false) {
						idx = keys.length;
					} else {
						idx += 1;
					}
					if (idx === keys.length) {
						done(null, results);
					} else {
						iterate();
					}
				}.bind(this),
				go2 = field && field.next ? field.next.call(field, err, results[key], then) : NaN;
			go2 !== void 0 && then(go2);
		}.bind(this),
		iterate = function () {
			var key = keys[idx],
				field = obj[key];

			if (field) {
				this.emit('pre-prompt', field);
				field.prompt(next(results, key, function (err) {
					fs && process.stdout.write(fs);
					this.emit('post-prompt', field, err, results[key]);
					if (err && (this.stopOnError || (err instanceof Error && err.message == 'cancelled'))) {
						done(err, results);
					} else {
						go(key, field, err);
					}
				}.bind(this)));
			} else {
				go(key, field);
			}
		}.bind(this);

	if (!keys.length) {
		return done(null, results);
	}

	iterate();
}

Set.prototype.prompt = function prompt(callback) {
	this.fields && (Array.isArray(this.fields) ? seriesArray : seriesObject).call(this, this.fields, callback);
};
