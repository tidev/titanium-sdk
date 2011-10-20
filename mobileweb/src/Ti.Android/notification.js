(function(api){
	// Properties
	var _audioStreamType = null;
	Object.defineProperty(api, 'audioStreamType', {
		get: function(){return _audioStreamType;},
		set: function(val){return _audioStreamType = val;}
	});

	var _contentIntent = null;
	Object.defineProperty(api, 'contentIntent', {
		get: function(){return _contentIntent;},
		set: function(val){return _contentIntent = val;}
	});

	var _contentText = null;
	Object.defineProperty(api, 'contentText', {
		get: function(){return _contentText;},
		set: function(val){return _contentText = val;}
	});

	var _contentTitle = null;
	Object.defineProperty(api, 'contentTitle', {
		get: function(){return _contentTitle;},
		set: function(val){return _contentTitle = val;}
	});

	var _defaults = null;
	Object.defineProperty(api, 'defaults', {
		get: function(){return _defaults;},
		set: function(val){return _defaults = val;}
	});

	var _deleteIntent = null;
	Object.defineProperty(api, 'deleteIntent', {
		get: function(){return _deleteIntent;},
		set: function(val){return _deleteIntent = val;}
	});

	var _flags = null;
	Object.defineProperty(api, 'flags', {
		get: function(){return _flags;},
		set: function(val){return _flags = val;}
	});

	var _icon = null;
	Object.defineProperty(api, 'icon', {
		get: function(){return _icon;},
		set: function(val){return _icon = val;}
	});

	var _ledARGB = null;
	Object.defineProperty(api, 'ledARGB', {
		get: function(){return _ledARGB;},
		set: function(val){return _ledARGB = val;}
	});

	var _ledOffMS = null;
	Object.defineProperty(api, 'ledOffMS', {
		get: function(){return _ledOffMS;},
		set: function(val){return _ledOffMS = val;}
	});

	var _ledOnMS = null;
	Object.defineProperty(api, 'ledOnMS', {
		get: function(){return _ledOnMS;},
		set: function(val){return _ledOnMS = val;}
	});

	var _number = null;
	Object.defineProperty(api, 'number', {
		get: function(){return _number;},
		set: function(val){return _number = val;}
	});

	var _sound = null;
	Object.defineProperty(api, 'sound', {
		get: function(){return _sound;},
		set: function(val){return _sound = val;}
	});

	var _tickerText = null;
	Object.defineProperty(api, 'tickerText', {
		get: function(){return _tickerText;},
		set: function(val){return _tickerText = val;}
	});

	var _when = null;
	Object.defineProperty(api, 'when', {
		get: function(){return _when;},
		set: function(val){return _when = val;}
	});

	// Methods
	api.setLatestEventInfo = function(){
		console.debug('Method "Titanium.Android.Notification..setLatestEventInfo" is not implemented yet.');
	};
})(Ti._5.createClass('Titanium.Android.Notification'));