(function(api){
	// Interfaces
	Ti._5.EventDriven(api);

	// Properties
	Ti._5.prop(api, 'METHOD_ALERT');

	Ti._5.prop(api, 'METHOD_DEFAULT');

	Ti._5.prop(api, 'METHOD_EMAIL');

	Ti._5.prop(api, 'METHOD_SMS');

	Ti._5.prop(api, 'STATE_DISMISSED');

	Ti._5.prop(api, 'STATE_FIRED');

	Ti._5.prop(api, 'STATE_SCHEDULED');

	Ti._5.prop(api, 'STATUS_CANCELED');

	Ti._5.prop(api, 'STATUS_CONFIRMED');

	Ti._5.prop(api, 'STATUS_TENTATIVE');

	Ti._5.prop(api, 'VISIBILITY_CONFIDENTIAL');

	Ti._5.prop(api, 'VISIBILITY_DEFAULT');

	Ti._5.prop(api, 'VISIBILITY_PRIVATE');

	Ti._5.prop(api, 'VISIBILITY_PUBLIC');

	Ti._5.prop(api, 'allAlerts');

	Ti._5.prop(api, 'allCalendars');

	Ti._5.prop(api, 'selectableCalendars');

	// Methods
	api.createAlert = function(){
		console.debug('Method "Titanium.Android.Calendar.createAlert" is not implemented yet.');
	};
	api.createCalendar = function(){
		console.debug('Method "Titanium.Android.Calendar.createCalendar" is not implemented yet.');
	};
	api.createEvent = function(){
		console.debug('Method "Titanium.Android.Calendar.createEvent" is not implemented yet.');
	};
	api.createReminder = function(){
		console.debug('Method "Titanium.Android.Calendar.createReminder" is not implemented yet.');
	};
	api.getCalendarById = function(){
		console.debug('Method "Titanium.Android.Calendar.getCalendarById" is not implemented yet.');
	};
})(Ti._5.createClass('Titanium.Android.Calendar'));