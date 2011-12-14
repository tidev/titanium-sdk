(function(api){
	// Properties
	Ti._5.prop(api, 'alerts');

	Ti._5.prop(api, 'allDay');

	Ti._5.prop(api, 'begin');

	Ti._5.prop(api, 'description');

	Ti._5.prop(api, 'end');

	Ti._5.prop(api, 'extendedProperties');

	Ti._5.prop(api, 'hasAlarm');

	Ti._5.prop(api, 'hasExtendedProperties');

	Ti._5.prop(api, 'id');

	Ti._5.prop(api, 'location');

	Ti._5.prop(api, 'reminders');

	Ti._5.prop(api, 'status');

	Ti._5.prop(api, 'title');

	Ti._5.prop(api, 'visibility');

	// Methods
	api.createAlert = function(){
		console.debug('Method "Titanium.Android.Calendar.Event.createAlert" is not implemented yet.');
	};
	api.createReminder = function(){
		console.debug('Method "Titanium.Android.Calendar.Event.createReminder" is not implemented yet.');
	};
	api.getExtendedProperty = function(){
		console.debug('Method "Titanium.Android.Calendar.Event.getExtendedProperty" is not implemented yet.');
	};
	api.setExtendedProperty = function(){
		console.debug('Method "Titanium.Android.Calendar.Event.setExtendedProperty" is not implemented yet.');
	};
})(Ti._5.createClass('Titanium.Android.Calendar.Event'));