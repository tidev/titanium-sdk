(function(api){
	// Properties
	Ti._5.member(api, 'alerts');

	Ti._5.member(api, 'allDay');

	Ti._5.member(api, 'begin');

	Ti._5.member(api, 'description');

	Ti._5.member(api, 'end');

	Ti._5.member(api, 'extendedProperties');

	Ti._5.member(api, 'hasAlarm');

	Ti._5.member(api, 'hasExtendedProperties');

	Ti._5.member(api, 'id');

	Ti._5.member(api, 'location');

	Ti._5.member(api, 'reminders');

	Ti._5.member(api, 'status');

	Ti._5.member(api, 'title');

	Ti._5.member(api, 'visibility');

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