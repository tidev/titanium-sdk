/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

module.exports = new function() {
	var finish,
		valueOf,
		Tizen;

	this.init = function(testUtils) {
		finish = testUtils.finish;
		valueOf = testUtils.valueOf;
		Tizen = require('tizen');
	}

	// Most of the tests fail due to the Tizen bug:
	// https://bugs.tizen.org/jira/browse/TDIST-148
	this.name = 'notification';
	this.tests = [
		{name: 'notificationPost'},
		{name: 'notificationGet'},
		{name: 'notificationUpdate'},
		{name: 'notificationRemove'}
	];

	this.notificationPost = function(testRun) {
		// Clear notification tray
		Tizen.Notification.removeAll();

		// Create app service for notification
		var notificationArr,
			appControl = Tizen.Apps.createApplicationControl({
				operation: 'http://tizen.org/appcontrol/operation/create_content',
				uri: null,
				mime: 'image/jpg',
				category: null
			}),
			// Create dictionary with parameters for status notification
			notificationDict = {
				content: 'This is a simple notificaiton.',
				iconPath: 'images/image1.jpg', 
				vibration: true, 
				appControl: appControl
			},
			notification = Tizen.Notification.createStatusNotification({
				statusType: Tizen.Notification.STATUS_NOTIFICATION_TYPE_SIMPLE,
				title: 'Simple notification',
				notificationInitDict: notificationDict
			});

		// Post created notification to tray               
		valueOf(testRun, function() {
			Tizen.Notification.postNotification(notification);
		}).shouldNotThrowException();

		notificationArr = Tizen.Notification.getAll();
		// Get notification from tray and check is it instance of status notification
		valueOf(testRun, notificationArr[0].toString()).shouldBe('[object TizenNotificationStatusNotification]');
		Tizen.Notification.removeAll();

		finish(testRun);
	}
	
	// Fails https://bugs.tizen.org/jira/browse/TDIST-148
	this.notificationGet = function(testRun) {
		// Clear notification tray
		Tizen.Notification.removeAll();

		// Create notification and add it to tray
		var notId,
			notificationFrom,
			appControl = Tizen.Apps.createApplicationControl({
				operation: 'http://tizen.org/appcontrol/operation/create_content',
				uri: null,
				mime: 'image/jpg',
				category: null
			}),
			notificationDict = {
				content: 'This is a simple notificaiton.',
				iconPath: 'images/image1.jpg',
				soundPath: undefined, 
				vibration: true, 
				appControl: appControl
			},
			notification = Tizen.Notification.createStatusNotification({
				statusType: Tizen.Notification.STATUS_NOTIFICATION_TYPE_SIMPLE,
				title: 'Simple notification',
				notificationInitDict: notificationDict
			});
			

		valueOf(testRun, function() {
			Tizen.Notification.postNotification(notification);
		}).shouldNotThrowException();

		// Memorize notification id for use later
		notId = notification.id;
		Ti.API.info(notId);
		// Try to get notification by id
		valueOf(testRun, function() {      
			notificationFrom = Tizen.Notification.getNotification(notId);
		}).shouldNotThrowException();
		valueOf(testRun, notificationFrom.toString()).shouldBe('[object TizenNotificationStatusNotification]');
		// Compare property of gotten notification with coresponding property of posted notification
		valueOf(testRun, notificationFrom.content).shouldBe(notificationDict.content);
		valueOf(testRun, notificationFrom.statusType).shouldBe(notification.statusType);
		valueOf(testRun, notificationFrom.title).shouldBe(notification.title);

		Tizen.Notification.removeAll();

		finish(testRun);
	}

	// Fails https://bugs.tizen.org/jira/browse/TDIST-148
	this.notificationUpdate = function(testRun) {
		// Clear notification tray
		Tizen.Notification.removeAll();

		// Create notification and add it to tray
		var notId,
			notificationFrom,
			appControl = Tizen.Apps.createApplicationControl({
				operation: 'http://tizen.org/appcontrol/operation/create_content',
				uri: null,
				mime: 'image/jpg',
				category: null
			}),
			notificationDict = {
					content: 'This is a simple notificaiton.',
					iconPath: 'images/image1.jpg', 
					vibration: true, 
					appControl: appControl},
			notification = Tizen.Notification.createStatusNotification({
				statusType: Tizen.Notification.STATUS_NOTIFICATION_TYPE_SIMPLE,
				title: 'Simple notification',
				notificationInitDict: notificationDict
			});

		valueOf(testRun, function() {
			Tizen.Notification.postNotification(notification);
		}).shouldNotThrowException();

		// Memorize notification id for use later
		notId = notification.id;

		// Change notification content and try to update this notification
		notification.content = 'New Content';

		valueOf(testRun, function() {      
			Tizen.Notification.update(notification);
		}).shouldNotThrowException();

		// Get notification by id and compare it content attribute
		valueOf(testRun, function() {      
			notificationFrom = Tizen.Notification.getNotification(notId);
		}).shouldNotThrowException();
		valueOf(testRun, notificationFrom.content).shouldBe(notification.content);

		Tizen.Notification.removeAll();

		finish(testRun);
	}
	
	// Fails https://bugs.tizen.org/jira/browse/TDIST-148
	this.notificationRemove = function(testRun) {
		// Clear notification tray
		Tizen.Notification.removeAll();

		// Create first notification and add it to tray
		var notId,
			notificationFrom,
			notId1,
			notificationFrom1,
			appControl = Tizen.Apps.createApplicationControl({
				operation: 'http://tizen.org/appcontrol/operation/create_content',
				uri: null,
				mime: 'image/jpg',
				category: null
			}),
			notificationDict = {
				content: 'This is a simple notificaiton 1.',
				iconPath: 'images/image1.jpg', 
				vibration: true, 
				appControl: appControl
			},
			notification = Tizen.Notification.createStatusNotification({
				statusType: Tizen.Notification.STATUS_NOTIFICATION_TYPE_SIMPLE,
				title: 'Simple notification 1',
				notificationInitDict: notificationDict
			}),
			appControl1 = Tizen.Apps.createApplicationControl({
				operation: 'http://tizen.org/appcontrol/operation/create_content',
				uri: null,
				mime: 'image/jpg',
				category: null
			}),
			notificationDict1 = {
				content: 'This is a simple notificaiton 2.',
				iconPath: 'images/image1.jpg',
				vibration: true, 
				appControl: appControl1
			},
			notification1 = Tizen.Notification.createStatusNotification({
				statusType: Tizen.Notification.STATUS_NOTIFICATION_TYPE_SIMPLE,
				title: 'Simple notification 2',
				notificationInitDict: notificationDict
			});


		valueOf(testRun, function() {
			Tizen.Notification.postNotification(notification);
		}).shouldNotThrowException();

		// Memorize id for use later
		notId = notification.id;

		valueOf(testRun, function() {      
			Tizen.Notification.postNotification(notification1);
		}).shouldNotThrowException();

		// Memorize second id 
		notId1 = notification1.id;

		// Try to remove notification by id
		valueOf(testRun, function() {      
			Tizen.Notification.remove(notId);
		}).shouldNotThrowException();

		// Try to get removed notification: it should cause exception
		valueOf(testRun, function() {      
			notificationFrom = Tizen.Notification.getNotification(notId);
		}).shouldThrowException();

		// Try to remove all notification in tray
		valueOf(testRun, function() {      
			Tizen.Notification.removeAll();
		}).shouldNotThrowException();

		//try to get second notification and it should be removed
		valueOf(testRun, function() {      
			notificationFrom1 = Tizen.Notification.getNotification(notId1);
		}).shouldThrowException();

		Tizen.Notification.removeAll();

		finish(testRun);
	}
}
