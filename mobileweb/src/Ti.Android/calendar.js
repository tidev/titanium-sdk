(function(api){
	// Interfaces
	Ti._5.EventDriven(api);

	// Properties
	var _METHOD_ALERT = null;
	Object.defineProperty(api, 'METHOD_ALERT', {
		get: function(){return _METHOD_ALERT;},
		set: function(val){return _METHOD_ALERT = val;}
	});

	var _METHOD_DEFAULT = null;
	Object.defineProperty(api, 'METHOD_DEFAULT', {
		get: function(){return _METHOD_DEFAULT;},
		set: function(val){return _METHOD_DEFAULT = val;}
	});

	var _METHOD_EMAIL = null;
	Object.defineProperty(api, 'METHOD_EMAIL', {
		get: function(){return _METHOD_EMAIL;},
		set: function(val){return _METHOD_EMAIL = val;}
	});

	var _METHOD_SMS = null;
	Object.defineProperty(api, 'METHOD_SMS', {
		get: function(){return _METHOD_SMS;},
		set: function(val){return _METHOD_SMS = val;}
	});

	var _STATE_DISMISSED = null;
	Object.defineProperty(api, 'STATE_DISMISSED', {
		get: function(){return _STATE_DISMISSED;},
		set: function(val){return _STATE_DISMISSED = val;}
	});

	var _STATE_FIRED = null;
	Object.defineProperty(api, 'STATE_FIRED', {
		get: function(){return _STATE_FIRED;},
		set: function(val){return _STATE_FIRED = val;}
	});

	var _STATE_SCHEDULED = null;
	Object.defineProperty(api, 'STATE_SCHEDULED', {
		get: function(){return _STATE_SCHEDULED;},
		set: function(val){return _STATE_SCHEDULED = val;}
	});

	var _STATUS_CANCELED = null;
	Object.defineProperty(api, 'STATUS_CANCELED', {
		get: function(){return _STATUS_CANCELED;},
		set: function(val){return _STATUS_CANCELED = val;}
	});

	var _STATUS_CONFIRMED = null;
	Object.defineProperty(api, 'STATUS_CONFIRMED', {
		get: function(){return _STATUS_CONFIRMED;},
		set: function(val){return _STATUS_CONFIRMED = val;}
	});

	var _STATUS_TENTATIVE = null;
	Object.defineProperty(api, 'STATUS_TENTATIVE', {
		get: function(){return _STATUS_TENTATIVE;},
		set: function(val){return _STATUS_TENTATIVE = val;}
	});

	var _VISIBILITY_CONFIDENTIAL = null;
	Object.defineProperty(api, 'VISIBILITY_CONFIDENTIAL', {
		get: function(){return _VISIBILITY_CONFIDENTIAL;},
		set: function(val){return _VISIBILITY_CONFIDENTIAL = val;}
	});

	var _VISIBILITY_DEFAULT = null;
	Object.defineProperty(api, 'VISIBILITY_DEFAULT', {
		get: function(){return _VISIBILITY_DEFAULT;},
		set: function(val){return _VISIBILITY_DEFAULT = val;}
	});

	var _VISIBILITY_PRIVATE = null;
	Object.defineProperty(api, 'VISIBILITY_PRIVATE', {
		get: function(){return _VISIBILITY_PRIVATE;},
		set: function(val){return _VISIBILITY_PRIVATE = val;}
	});

	var _VISIBILITY_PUBLIC = null;
	Object.defineProperty(api, 'VISIBILITY_PUBLIC', {
		get: function(){return _VISIBILITY_PUBLIC;},
		set: function(val){return _VISIBILITY_PUBLIC = val;}
	});

	var _allAlerts = null;
	Object.defineProperty(api, 'allAlerts', {
		get: function(){return _allAlerts;},
		set: function(val){return _allAlerts = val;}
	});

	var _allCalendars = null;
	Object.defineProperty(api, 'allCalendars', {
		get: function(){return _allCalendars;},
		set: function(val){return _allCalendars = val;}
	});

	var _selectableCalendars = null;
	Object.defineProperty(api, 'selectableCalendars', {
		get: function(){return _selectableCalendars;},
		set: function(val){return _selectableCalendars = val;}
	});

	// Methods
	api.createAlert = function(){
		console.debug('Method "Titanium.Android.Calendar..createAlert" is not implemented yet.');
	};
	api.createCalendar = function(){
		console.debug('Method "Titanium.Android.Calendar..createCalendar" is not implemented yet.');
	};
	api.createEvent = function(){
		console.debug('Method "Titanium.Android.Calendar..createEvent" is not implemented yet.');
	};
	api.createReminder = function(){
		console.debug('Method "Titanium.Android.Calendar..createReminder" is not implemented yet.');
	};
	api.getCalendarById = function(){
		console.debug('Method "Titanium.Android.Calendar..getCalendarById" is not implemented yet.');
	};
})(Ti._5.createClass('Titanium.Android.Calendar'));