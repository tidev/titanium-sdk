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

	this.name = 'alarm';
	this.tests = [
		{name: 'alarmAdd'},
		{name: 'alarmGet'},
		{name: 'alarmRemove'},
		{name: 'alarmRelative'},
		{name: 'alarmAbsolute'}
	]

	this.alarmAdd = function(testRun) {
		var alarm,
			tizenArr,
			date = new Date(2012, 12, 21, 8, 0);

		Tizen.Alarm.removeAll();

		// Alarm in 10 seconds (relative)
		alarm = Tizen.Alarm.createAlarmRelative({
			delay: 10
		});

		Ti.API.info(alarm);

		valueOf(testRun, alarm.toString()).shouldBe('[object TizenAlarmAlarmRelative]');

		Tizen.Alarm.add(alarm, 'http://tizen.org/alarm-clock');

		// Set an alarm on December 21st 2012 08:00
		alarm = Tizen.Alarm.createAlarmAbsolute({ 
			date: date
		});

		valueOf(testRun, alarm.toString()).shouldBe('[object TizenAlarmAlarmAbsolute]');

		Tizen.Alarm.add(alarm, 'http://tizen.org/alarm-clock');

		tizenArr = Tizen.Alarm.getAll();

		valueOf(testRun, (tizenArr[0].toString() === '[object TizenAlarmAlarmAbsolute]' || tizenArr[0].toString() === '[object TizenAlarmAlarmRelative]')).shouldBeTrue();

		valueOf(testRun, tizenArr.length).shouldBe(2);

		finish(testRun);
	}
	
	this.alarmGet = function(testRun) {	
		var alarm,
			alarm1,
			alarm2, 
			alarm3,
			relative_id,
			absolute_id,
			date = new Date(2012, 12, 21, 8, 0);

		Tizen.Alarm.removeAll();

		// Alarm in 10 seconds (relative)
		alarm = Tizen.Alarm.createAlarmRelative({
			delay: 10
		});

		// Set an alarm on December 21st 2012 08:00
		alarm1 = Tizen.Alarm.createAlarmAbsolute({ 
			date: date
		});
		
		Tizen.Alarm.add(alarm, 'http://tizen.org/alarm-clock');
		Tizen.Alarm.add(alarm1, 'http://tizen.org/alarm-clock');

		relative_id = alarm.id;
		absolute_id = alarm1.id;

		valueOf(testRun, function() {
			alarm2 = Tizen.Alarm.getAlarm(relative_id);
			alarm3 = Tizen.Alarm.getAlarm(absolute_id);
		}).shouldNotThrowException();

		valueOf(testRun, alarm2.toString()).shouldBe('[object TizenAlarmAlarmRelative]');
		valueOf(testRun, alarm3.toString()).shouldBe('[object TizenAlarmAlarmAbsolute]');

		Tizen.Alarm.removeAll();

		valueOf(testRun, function() {
			var alarmTmp = Tizen.Alarm.getAlarm(absolute_id);
			valueOf(testRun, alarm.toString()).shouldBe('[object TizenAlarmAlarmAbsolute]');
			
			alarmTmp = Tizen.Alarm.getAlarm(relative_id);
		}).shouldThrowException();

		finish(testRun);
	}
	
	this.alarmRemove = function(testRun) {
		var alarm,
			alarm1,
			relative_id,
			alarmArr,
			absolute_id,
			date = new Date(2012, 12, 21, 8, 0);
		
		Tizen.Alarm.removeAll();
		alarmArr = Tizen.Alarm.getAll();
		valueOf(testRun, alarmArr.length).shouldBe(0);

		//Alarm in 10 seconds (relative)
		alarm = Tizen.Alarm.createAlarmRelative({
			delay: 10
		});
		alarm1 = Tizen.Alarm.createAlarmAbsolute({ 
			date: date
		});
		Tizen.Alarm.add(alarm, 'http://tizen.org/alarm-clock');
		Tizen.Alarm.add(alarm1, 'http://tizen.org/alarm-clock');
		relative_id = alarm.id;
		absolute_id = alarm1.id;

		valueOf(testRun, function() {
			Tizen.Alarm.remove(absolute_id);
		}).shouldNotThrowException();

		valueOf(testRun, function() {
			Tizen.Alarm.remove(absolute_id);
		}).shouldThrowException();

		finish(testRun);
	}

	this.alarmRelative = function(testRun) {
		var alarm,
			alarmId,
			delay = 2 * Tizen.Alarm.PERIOD_MINUTE,
			period = Tizen.Alarm.PERIOD_HOUR;

		Tizen.Alarm.removeAll();
		alarm = Tizen.Alarm.createAlarmRelative({
			delay: delay,
			period: period
		});
		Tizen.Alarm.add(alarm, 'http://tizen.org/alarm-clock');
		alarmId = alarm.id;

		valueOf(testRun, function() {
			var remaining = alarm.getRemainingSeconds();
		}).shouldNotThrowException();
		valueOf(testRun, alarm.delay).shouldBe(delay);

		alarm = Tizen.Alarm.getAlarm(alarmId);

		valueOf(testRun, function() {
			var fromReaming = alarm.getRemainingSeconds();
		});
		valueOf(testRun, alarm.delay).shouldBe(delay);

		finish(testRun);
	}

	this.alarmAbsolute = function(testRun) {
		Tizen.Alarm.removeAll();

		var alarm,
			alarmId,
			remaining,
			alarmFrom,
			fromReaming,
			date = new Date(),
			time = date.getTime() + 60000,
			period = Tizen.Alarm.PERIOD_HOUR;

		date.setTime(time);
		alarm = Tizen.Alarm.createAlarmAbsolute({
			date: date, period: period
		});
		Tizen.Alarm.add(alarm, 'http://tizen.org/alarm-clock');
		alarmId = alarm.id;
		remaining = alarm.getNextScheduledDate();

		valueOf(testRun, remaining.toDateString()).shouldBe(alarm.date.toDateString());

		alarmFrom = Tizen.Alarm.getAlarm(alarmId),
		fromReaming = alarmFrom.getNextScheduledDate();

		valueOf(testRun, fromReaming.toDateString()).shouldBe(date.toDateString());

		Tizen.Alarm.removeAll();
		finish(testRun);
	}
}