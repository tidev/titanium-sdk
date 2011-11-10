(function(api){
	// Properties
	var _alarmTime = null;
	Object.defineProperty(api, 'alarmTime', {
		get: function(){return _alarmTime;},
		set: function(val){return _alarmTime = val;}
	});

	var _begin = null;
	Object.defineProperty(api, 'begin', {
		get: function(){return _begin;},
		set: function(val){return _begin = val;}
	});

	var _end = null;
	Object.defineProperty(api, 'end', {
		get: function(){return _end;},
		set: function(val){return _end = val;}
	});

	var _eventId = null;
	Object.defineProperty(api, 'eventId', {
		get: function(){return _eventId;},
		set: function(val){return _eventId = val;}
	});

	var _id = null;
	Object.defineProperty(api, 'id', {
		get: function(){return _id;},
		set: function(val){return _id = val;}
	});

	var _minutes = null;
	Object.defineProperty(api, 'minutes', {
		get: function(){return _minutes;},
		set: function(val){return _minutes = val;}
	});

	var _state = null;
	Object.defineProperty(api, 'state', {
		get: function(){return _state;},
		set: function(val){return _state = val;}
	});

})(Ti._5.createClass('Titanium.Android.Calendar.Alert'));