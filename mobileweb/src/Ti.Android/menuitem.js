(function(api){
	Ti._5.EventDriven(api);
	// Properties
	var _enabled = null;
	Object.defineProperty(api, 'enabled', {
		get: function(){return _enabled;},
		set: function(val){return _enabled = val;}
	});

	var _groupId = null;
	Object.defineProperty(api, 'groupId', {
		get: function(){return _groupId;},
		set: function(val){return _groupId = val;}
	});

	var _itemId = null;
	Object.defineProperty(api, 'itemId', {
		get: function(){return _itemId;},
		set: function(val){return _itemId = val;}
	});

	var _order = null;
	Object.defineProperty(api, 'order', {
		get: function(){return _order;},
		set: function(val){return _order = val;}
	});

	var _title = null;
	Object.defineProperty(api, 'title', {
		get: function(){return _title;},
		set: function(val){return _title = val;}
	});

	var _titleCondensed = null;
	Object.defineProperty(api, 'titleCondensed', {
		get: function(){return _titleCondensed;},
		set: function(val){return _titleCondensed = val;}
	});

	var _visible = null;
	Object.defineProperty(api, 'visible', {
		get: function(){return _visible;},
		set: function(val){return _visible = val;}
	});

	// Methods
	api.getCondensedTitle = function(){
		console.debug('Method "Titanium.Android.MenuItem..getCondensedTitle" is not implemented yet.');
	};
	api.getGroupId = function(){
		console.debug('Method "Titanium.Android.MenuItem..getGroupId" is not implemented yet.');
	};
	api.getItemId = function(){
		console.debug('Method "Titanium.Android.MenuItem..getItemId" is not implemented yet.');
	};
	api.getOrder = function(){
		console.debug('Method "Titanium.Android.MenuItem..getOrder" is not implemented yet.');
	};
	api.getTitle = function(){
		console.debug('Method "Titanium.Android.MenuItem..getTitle" is not implemented yet.');
	};
	api.isEnabled = function(){
		console.debug('Method "Titanium.Android.MenuItem..isEnabled" is not implemented yet.');
	};
	api.isVisible = function(){
		console.debug('Method "Titanium.Android.MenuItem..isVisible" is not implemented yet.');
	};
	api.setCondensedTitle = function(){
		console.debug('Method "Titanium.Android.MenuItem..setCondensedTitle" is not implemented yet.');
	};
	api.setEnabled = function(){
		console.debug('Method "Titanium.Android.MenuItem..setEnabled" is not implemented yet.');
	};
	api.setIcon = function(){
		console.debug('Method "Titanium.Android.MenuItem..setIcon" is not implemented yet.');
	};
	api.setTitle = function(){
		console.debug('Method "Titanium.Android.MenuItem..setTitle" is not implemented yet.');
	};
	api.setVisible = function(){
		console.debug('Method "Titanium.Android.MenuItem..setVisible" is not implemented yet.');
	};

	// Events
	api.addEventListener('click', function(){
		console.debug('Event "click" is not implemented yet.');
	});
})(Ti._5.createClass('Titanium.Android.MenuItem'));