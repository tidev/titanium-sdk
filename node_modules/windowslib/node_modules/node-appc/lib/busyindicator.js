/**
 * Command line busy indicator that can be started and stopped.
 *
 * @module busyindicator
 *
 * @copyright
 * Copyright (c) 2009-2013 by Appcelerator, Inc. All Rights Reserved.
 *
 * @license
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

var mix = require('./util').mix;

module.exports = BusyIndicator;

/**
 * Creates a busy indicator.
 * @class
 * @classdesc A command line busy indicator.
 * @constructor
 * @param {Object} opts - Busy indicator options
 */
function BusyIndicator(opts) {
	mix(this, {
		margin: ' ',
		sprites: ['|', '/', '-', '\\'],
		current: 0
	}, opts);
	this._timer = null;
	this._running = false;
}

/**
 * Starts rendering the busy indicator.
 */
BusyIndicator.prototype.start = function start() {
	var render = function () {
		process.stdout.cursorTo && process.stdout.cursorTo(0);
		process.stdout.write(this.margin + this.sprites[this.current++]);
		if (this.current >= this.sprites.length) {
			this.current = 0;
		}
		this._timer = setTimeout(render, 60);
	}.bind(this);

	if (!this._running) {
		this._running = true;
		render();
	}
};

/**
 * Stops rendering the busy indicator.
 */
BusyIndicator.prototype.stop = function stop() {
	clearTimeout(this._timer);
	if (this._running) {
		this._running = false;
		process.stdout.cursorTo && process.stdout.cursorTo(0);
		process.stdout.write(new Array(this.margin.length + 2).join(' '));
		process.stdout.cursorTo && process.stdout.cursorTo(0);
	}
};

