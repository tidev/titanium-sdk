/**
 * This file contains source code from the following:
 *
 * Dojo Toolkit
 * Copyright (c) 2005-2011, The Dojo Foundation
 * New BSD License
 * <http://dojotoolkit.org>
 */

define(["./declare", "./lang"], function(declare, lang) {

	var is = require.is,
		Promise = declare("Ti._.Promise", null, {

			constructor: function(canceller) {
				this._canceller = canceller;
			},

			resolve: function(value) {
				this._complete(value, 0);
			},

			reject: function(error) {
				this._complete(error, 1);
			},

			then: function(resolvedCallback, errorCallback) {
				var listener = {
						resolved: resolvedCallback,
						error: errorCallback,
						promise: new Promise(this.cancel)
					};
				if (this._nextListener) {
					this._head = this._head.next = listener;
				} else {
					this._nextListener = this._head = listener;
				}
				this._finished && this._notify(this._fired);
				return listener.returnPromise; // this should probably be frozen
			},

			cancel: function() {
				if (!this._finished) {
					var error = this._canceller && this._canceller(this);
					if (!this._finished) {
						error instanceof Error || (error = new Error(error));
						error.log = false;
						this.reject(error);
					}
				}
			},

			_fired: -1,

			_complete: function(value, isError) {
				this._fired = isError;
				if (this._finished) {
					throw new Error("This promise has already been resolved");
				}
				this._result = value;
				this._finished = true;
				this._notify(isError);
			},

			_notify: function(isError) {
				var fn,
					listener,
					newResult;
				while (this._nextListener) {
					listener = this._nextListener;
					this._nextListener = this._nextListener.next;
					if (fn = listener[isError ? "error" : "resolved"]) {
						try {
							newResult = fn(this._result);
							if (newResult && is(newResult.then, "Function")) {
								newResult.then(lang.hitch(listener.promise, "resolve"), lang.hitch(listener.promise, "reject"));
							} else {
								listener.promise.resolve(newResult);
							}
						} catch(e) {
							listener.promise.reject(e);
						}
					} else {
						listener.promise[isError ? "reject" : "resolve"](result);
					}
				}
			}

		});

	Promise.when = function(promiseOrValue, callback, errback, progressHandler) {
		return promiseOrValue && is(promiseOrValue.then, "function")
			? promiseOrValue.then(callback, errback, progressHandler)
			: callback
				? callback(promiseOrValue)
				: promiseOrValue;
	};

	return Promise;

});