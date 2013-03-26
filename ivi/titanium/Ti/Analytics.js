define(["Ti/_/analytics", "Ti/_/Evented", "Ti/_/lang"], function(analytics, Evented, lang) {

	return lang.setObject("Ti.Analytics", Evented, {

		addEvent: function(type, name, data) {
			analytics.add(type, name, data);
		},

		featureEvent: function(name, data) {
			analytics.add("app.feature", name, data);
		},

		navEvent: function(from, to, name, data) {
			analytics.add("app.nav", name, data);
		},

		settingsEvent: function(name, data) {
			analytics.add("app.settings", name, data);
		},

		timedEvent: function(name, start, stop, duration, data) {
			analytics.add("app.timed", name, require.mix({}, data, {
				start: start,
				stop: stop,
				duration: duration
			}));
		},

		userEvent: function(name, data) {
			analytics.add("app.user", name, data);
		}

	});

});