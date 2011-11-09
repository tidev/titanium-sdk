(function(api){
	// Properties
	var _alerts = null;
	Object.defineProperty(api, 'alerts', {
		get: function(){return _alerts;},
		set: function(val){return _alerts = val;}
	});

	var _allDay = null;
	Object.defineProperty(api, 'allDay', {
		get: function(){return _allDay;},
		set: function(val){return _allDay = val;}
	});

	var _begin = null;
	Object.defineProperty(api, 'begin', {
		get: function(){return _begin;},
		set: function(val){return _begin = val;}
	});

	var _description = null;
	Object.defineProperty(api, 'description', {
		get: function(){return _description;},
		set: function(val){return _description = val;}
	});

	var _end = null;
	Object.defineProperty(api, 'end', {
		get: function(){return _end;},
		set: function(val){return _end = val;}
	});

	var _extendedProperties = null;
	Object.defineProperty(api, 'extendedProperties', {
		get: function(){return _extendedProperties;},
		set: function(val){return _extendedProperties = val;}
	});

	var _hasAlarm = null;
	Object.defineProperty(api, 'hasAlarm', {
		get: function(){return _hasAlarm;},
		set: function(val){return _hasAlarm = val;}
	});

	var _hasExtendedProperties = null;
	Object.defineProperty(api, 'hasExtendedProperties', {
		get: function(){return _hasExtendedProperties;},
		set: function(val){return _hasExtendedProperties = val;}
	});

	var _id = null;
	Object.defineProperty(api, 'id', {
		get: function(){return _id;},
		set: function(val){return _id = val;}
	});

	var _location = null;
	Object.defineProperty(api, 'location', {
		get: function(){return _location;},
		set: function(val){return _location = val;}
	});

	var _reminders = null;
	Object.defineProperty(api, 'reminders', {
		get: function(){return _reminders;},
		set: function(val){return _reminders = val;}
	});

	var _status = null;
	Object.defineProperty(api, 'status', {
		get: function(){return _status;},
		set: function(val){return _status = val;}
	});

	var _title = null;
	Object.defineProperty(api, 'title', {
		get: function(){return _title;},
		set: function(val){return _title = val;}
	});

	var _visibility = null;
	Object.defineProperty(api, 'visibility', {
		get: function(){return _visibility;},
		set: function(val){return _visibility = val;}
	});

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