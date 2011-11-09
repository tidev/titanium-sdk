(function(api){
	// Properties
	var _flags = null;
	Object.defineProperty(api, 'flags', {
		get: function(){return _flags;},
		set: function(val){return _flags = val;}
	});

	var _intent = null;
	Object.defineProperty(api, 'intent', {
		get: function(){return _intent;},
		set: function(val){return _intent = val;}
	});

})(Ti._5.createClass('Titanium.Android.PendingIntent'));