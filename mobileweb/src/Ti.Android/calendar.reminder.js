(function(api){
	// Properties
	var _id = null;
	Object.defineProperty(api, 'id', {
		get: function(){return _id;},
		set: function(val){return _id = val;}
	});

	var _method = null;
	Object.defineProperty(api, 'method', {
		get: function(){return _method;},
		set: function(val){return _method = val;}
	});

	var _minutes = null;
	Object.defineProperty(api, 'minutes', {
		get: function(){return _minutes;},
		set: function(val){return _minutes = val;}
	});

})(Ti._5.createClass('Titanium.Android.Calendar.Reminder'));