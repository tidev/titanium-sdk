(function(api){
	// Properties
	var _class = null;
	Object.defineProperty(api, 'class', {
		get: function(){return _class;},
		set: function(val){return _class = val;}
	});

})(Ti._5.createClass('Titanium.App.Android.R'));