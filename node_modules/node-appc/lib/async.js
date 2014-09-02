/**
 * Adds context support to the 'async' library.
 *
 * @module async
 *
 * @copyright
 * Copyright (c) 2009-2013 by Appcelerator, Inc. All Rights Reserved.
 *
 * @license
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

var async = require('async');

/**
 * Runs multiple tasks in parallel. Each task can either be a function or a string
 * containing the name of a task function in the specified context.
 *
 * If the task function has no length (i.e. no expected arguments), then it will
 * treat the function as synchronous.
 *
 * @param {Object} ctx - A context to bind the tasks to
 * @param {Object|Array<Function>} tasks - The object of task_name=>task_function
 * or array of tasks
 * @param {Function} cb - A callback to call when the tasks complete
 */
exports.parallel = function parallel(ctx, tasks, cb) {
	if (tasks && typeof tasks == 'object') {
		Object.keys(tasks).forEach(function (name) {
			if (tasks[name]) {
				var fn = typeof tasks[name] === 'function' ? tasks[name].bind(ctx) : ctx[tasks[name]].bind(ctx);
				tasks[name] = fn.length ? fn : function (next) { fn(), next(); };
			}
		});
	} else {
		tasks = tasks.map(function (task) {
			if (task) {
				var fn = typeof task === 'function' ? task.bind(ctx) : ctx[task].bind(ctx);
				return fn.length ? fn : function (next) { fn(), next(); };
			}
		});
	}

	async.parallel(tasks, function () {
		cb.apply(ctx, arguments);
	});
};

/**
 * Runs multiple tasks in series. Each task can either be a function or a string
 * containing the name of a task function in the specified context.
 *
 * If the task function has no length (i.e. no expected arguments), then it will
 * treat the function as synchronous.
 *
 * @param {Object} ctx - A context to bind the tasks to
 * @param {Array<Function>} tasks - The array of tasks
 * @param {Function} cb - A callback to call when the tasks complete
 */
exports.series = function series(ctx, tasks, cb) {
	async.series(tasks.map(function (task) {
		var fn = typeof task === 'function' ? task.bind(ctx) : ctx[task].bind(ctx);
		return fn.length ? fn : function (next) { fn(), next(); };
	}), function () {
		cb.apply(ctx, arguments);
	});
};