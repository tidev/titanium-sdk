(function(api){
	// Properties
	var _hidden = null;
	Object.defineProperty(api, 'hidden', {
		get: function(){return _hidden;},
		set: function(val){return _hidden = val;}
	});

	var _id = null;
	Object.defineProperty(api, 'id', {
		get: function(){return _id;},
		set: function(val){return _id = val;}
	});

	var _name = null;
	Object.defineProperty(api, 'name', {
		get: function(){return _name;},
		set: function(val){return _name = val;}
	});

	var _selected = null;
	Object.defineProperty(api, 'selected', {
		get: function(){return _selected;},
		set: function(val){return _selected = val;}
	});

	// Methods
	api.createEvent = function(){
		console.debug('Method "Titanium.Android.Calendar.Calendar.createEvent" is not implemented yet.');
	};
	api.getEventById = function(){
		console.debug('Method "Titanium.Android.Calendar.Calendar.getEventById" is not implemented yet.');
	};
	api.getEventsBetweenDates = function(){
		console.debug('Method "Titanium.Android.Calendar.Calendar.getEventsBetweenDates" is not implemented yet.');
	};
	api.getEventsInDate = function(){
		console.debug('Method "Titanium.Android.Calendar.Calendar.getEventsInDate" is not implemented yet.');
	};
	api.getEventsInMonth = function(){
		console.debug('Method "Titanium.Android.Calendar.Calendar.getEventsInMonth" is not implemented yet.');
	};
	api.getEventsInYear = function(){
		console.debug('Method "Titanium.Android.Calendar.Calendar.getEventsInYear" is not implemented yet.');
	};
})(Ti._5.createClass('Titanium.Android.Calendar.Calendar'));