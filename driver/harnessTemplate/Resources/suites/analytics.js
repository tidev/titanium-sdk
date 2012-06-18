module.exports = new function() {
	var finish;
	var valueOf;
	this.init = function(testUtils) {
		finish = testUtils.finish;
		valueOf = testUtils.valueOf;
	}

	this.name = "analytics";
	this.tests = [
		{name: "addEvent"},
		{name: "featureEvent"},
		{name: "navEvent"},
		{name: "settingsEvent"},
		{name: "timedEvent"},
		{name: "userEvent"}
	]

	//iOS: TIMOB-5014
	//Android: TIMOB-5020
	this.addEvent = function() {
		valueOf(function() {
			Ti.Analytics.addEvent();
		}).shouldThrowException();
		valueOf(function() {
			Ti.Analytics.addEvent('type');
		}).shouldThrowException();
		valueOf(Ti.Analytics.addEvent('adding', 'featureEvent.testButton')).shouldBeUndefined();
		valueOf(Ti.Analytics.addEvent('adding', 'featureEvent.testButton', {'events':'adding'})).shouldBeUndefined();

		finish();
	}

	this.featureEvent = function() {
		valueOf(function() {
			Ti.Analytics.featureEvent();
		}).shouldThrowException();
		valueOf(Ti.Analytics.featureEvent('featureEvent.testButton')).shouldBeUndefined();
		valueOf(Ti.Analytics.featureEvent('featureEvent.testButton', {'events':'feature'})).shouldBeUndefined();

		finish();
	}

	this.navEvent = function() {
		valueOf(function() {
			Ti.Analytics.navEvent();
		}).shouldThrowException();
		valueOf(function() {
			Ti.Analytics.navEvent('here');
		}).shouldThrowException();
		valueOf(Ti.Analytics.navEvent('here', 'there')).shouldBeUndefined();
		valueOf(Ti.Analytics.navEvent('here', 'there', 'navEvent.testButton')).shouldBeUndefined();
		valueOf(Ti.Analytics.navEvent('here', 'there', 'navEvent.testButton', {'events':'nav'})).shouldBeUndefined();

		finish();
	}

	//iOS: TIMOB-4697
	this.settingsEvent = function() {
		valueOf(function() {
			Ti.Analytics.settingsEvent();
		}).shouldThrowException();
		valueOf(Ti.Analytics.settingsEvent('settingsEvent.testButton')).shouldBeUndefined();
		valueOf(Ti.Analytics.settingsEvent('settingsEvent.testButton', {'events':'settings'})).shouldBeUndefined();

		finish();
	}

	//Android: TIMOB-4642
	this.timedEvent = function() {
		var startDate = new Date();
		var stopDate = new Date();
		var duration = stopDate - startDate;
		valueOf(function() {
			Ti.Analytics.timedEvent();
		}).shouldThrowException();
		valueOf(function() {
			Ti.Analytics.timedEvent('timedEvent.testButton');
		}).shouldThrowException();
		valueOf(function() {
			Ti.Analytics.timedEvent('timedEvent.testButton', startDate);
		}).shouldThrowException();
		valueOf(function() {
			Ti.Analytics.timedEvent('timedEvent.testButton', startDate, stopDate);
		}).shouldThrowException();
		valueOf(Ti.Analytics.timedEvent('timedEvent.testButton', startDate, stopDate, duration)).shouldBeUndefined();
		valueOf(Ti.Analytics.timedEvent('timedEvent.testButton', startDate, stopDate, duration, {'events':'timed'})).shouldBeUndefined();

		finish();
	}

	this.userEvent = function() {
		valueOf(function() {
			Ti.Analytics.userEvent();
		}).shouldThrowException();
		valueOf(Ti.Analytics.userEvent('userEvent.testButton')).shouldBeUndefined();
		valueOf(Ti.Analytics.userEvent('userEvent.testButton', {'events':'user'})).shouldBeUndefined();

		finish();
	}
}
