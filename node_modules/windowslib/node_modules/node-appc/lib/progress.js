/**
 * Command line progress bar. It is derived from TJ Holowaychuk's node-progress
 * module. Noteable changes are support for a new ':paddedPercent' label and
 * some bug fixes such as the width of the progress bar changes when 100%
 * complete.
 *
 * @module progress
 *
 * @copyright
 * Copyright (c) 2009-2013 by Appcelerator, Inc. All Rights Reserved.
 *
 * Copyright(c) 2011 TJ Holowaychuk <tj@vision-media.ca>
 * {@link https://github.com/visionmedia/node-progress}
 *
 * @license
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

var string = require('./string');

module.exports = ProgressBar;

/**
 * Creates a progress bar.
 * @class
 * @classdesc A command line progress bar.
 * @constructor
 * @param {String} fmt - The format of the progress bar including tokens
 * @param {Object} options - Progress bar options
 * @param {Number} options.total - The total number for which progress is being tracked
 */
function ProgressBar(fmt, options) {
	options = options || {};
	if ('string' != typeof fmt) throw new Error('format required');
	if ('number' != typeof options.total) throw new Error('total required');
	this.fmt = fmt;
	this.curr = 0;
	this.total = options.total;
	this.width = options.width || this.total;

	this.chars = {
		complete: options.complete || '=',
		incomplete: options.incomplete || '-'
	};
}

/**
 * Increments the progress and redraws the progress bar.
 * @param {Number} [len=1] - The amount to add to the progress
 * @param {Object} [tokens] - An object to substitute tokens in the progress bar
 * @example
 * var bar = new progress('  :paddedPercent [:bar] :etas', {
 *     complete: '='.cyan,
 *     incomplete: '.'.grey,
 *     width: 40,
 *     total: 10
 * });
 * var timer = setInterval(function(){
 *     bar.tick();
 *     if (bar.complete) {
 *         console.log('\ncomplete\n');
 *         clearInterval(timer);
 *     }
 * }, 100);
 */
ProgressBar.prototype.tick = function tick(len, tokens) {
	if (len !== 0) {
		len = len || 1;
	}

	// swap tokens
	if ('object' == typeof len) {
		tokens = len;
		len = 1;
	}

	// start time for eta
	if (0 == this.curr) {
		this.start = new Date;
	}

	// progress complete
	if ((this.curr += len) > this.total) {
		this.complete = true;
		return;
	}

	var percent = this.curr / this.total * 100,
		complete = Math.round(this.width * (this.curr / this.total)),
		incomplete = this.width - complete,
		elapsed = new Date - this.start,
		eta = elapsed * (this.total / this.curr - 1),
		rl;

	complete = Array(complete + 1).join(this.chars.complete);
	incomplete = Array(incomplete + 1).join(this.chars.incomplete);

	// The extra space at the end prevents shrinking progress bars from ghosting
	var str = this.fmt
		.replace(':bar', complete + incomplete)
		.replace(':current', this.curr)
		.replace(':total', this.total)
		.replace(':elapsed', (elapsed / 1000).toFixed(1))
		.replace(':eta', (eta / 1000).toFixed(1))
		.replace(':percent', percent.toFixed(0) + '%')
		.replace(':paddedPercent', string.lpad(percent.toFixed(0) + '%', 4)) + ' ';

	if (tokens) {
		for (var key in tokens) {
			str = str.replace(':' + key, tokens[key]);
		}
	}

	if (str != this.str) {
		this.str = str;
		if (!this.writePending) {
			this.writePending = true;
			setTimeout(function () {
				this.writePending = false;
				process.stdout.cursorTo && process.stdout.cursorTo(0);
				process.stdout.write(this.str);
			}.bind(this), 30);
		}
	}
};
