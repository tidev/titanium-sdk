(function(api){
	// Interfaces
	Ti._5.EventDriven(api);

	// Methods
	api.addEvent = function(typ, name, data){
		Ti._5.addAnalyticsEvent(typ, name, data);
	};
	api.featureEvent = function(name, data){
		Ti._5.addAnalyticsEvent('app.feature', name, data);
	};
	api.navEvent = function(from, to, name, data){
		Ti._5.addAnalyticsEvent('app.nav', name, data);
	};
	api.settingsEvent = function(name, data){
		Ti._5.addAnalyticsEvent('app.settings', name, data);
	};
	api.timedEvent = function(name, start, stop, duration, data){
		if(data == null){
			data = {};
		}
		data.start = start;
		data.stop = stop;
		data.duration = duration;

		Ti._5.addAnalyticsEvent('app.timed', name, data);
	};
	api.userEvent = function(name, data){
		Ti._5.addAnalyticsEvent('app.user', name, data);
	};
})(Ti._5.createClass('Titanium.Analytics'));
