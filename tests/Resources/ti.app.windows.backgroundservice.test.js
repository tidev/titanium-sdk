/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
'use strict';
var should = require('./utilities/assertions');

describe.windows('Titanium.App.Windows.BackgroundService', function () {

	it.windowsBroken('API', function () {
		should(Ti.App.Windows).be.an.Object();
		should(Ti.App.Windows.BackgroundService).be.an.Object();
		should(Ti.App.Windows.BackgroundService.registerTimerTask).be.a.Function();
		should(Ti.App.Windows.BackgroundService.unregisterAllTasks).be.a.Function();
	});

	it.windowsBroken('registerTimerTask', function () {
		var task = Ti.App.Windows.BackgroundService.registerTimerTask('TitaniumWindows_Ti.BackgroundServiceTask', 15, true);
		should(task).be.an.Object();
		should(task.unregister).be.a.Function();
		should(task.taskId).be.a.Number();
		task.unregister();
	});

	it.windowsBroken('registerPushNotificationTask', function (finish) {
		var task = Ti.App.Windows.BackgroundService.registerPushNotificationTask('TitaniumWindows_Ti.BackgroundServiceTask');
		should(task).be.an.Object();
		should(task.unregister).be.a.Function();
		should(task.taskId).be.a.Number();
		task.unregister();
		finish();
	});

	it.windowsBroken('unregisterTask(task)', function () {
		var task = Ti.App.Windows.BackgroundService.registerTimerTask('TitaniumWindows_Ti.BackgroundServiceTask', 15, true);
		should(task).be.an.Object();
		should(task.unregister).be.a.Function();
		should(task.taskId).be.a.Number();
		Ti.App.Windows.BackgroundService.unregisterTask(task);
	});

	it.windowsBroken('unregisterTask(task id)', function () {
		var task = Ti.App.Windows.BackgroundService.registerTimerTask('TitaniumWindows_Ti.BackgroundServiceTask', 15, true);
		should(task).be.an.Object();
		should(task.unregister).be.a.Function();
		should(task.taskId).be.a.Number();
		Ti.App.Windows.BackgroundService.unregisterTask(task.taskId);
	});

	it.windowsBroken('unregisterAllTasks', function () {
		var task = Ti.App.Windows.BackgroundService.registerTimerTask('TitaniumWindows_Ti.BackgroundServiceTask', 15, true);
		should(task).be.an.Object();
		should(task.unregister).be.a.Function();
		should(task.taskId).be.a.Number();
		Ti.App.Windows.BackgroundService.unregisterAllTasks();
	});

});
