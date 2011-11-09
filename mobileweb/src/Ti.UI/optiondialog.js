Ti._5.createClass('Titanium.UI.OptionDialog', function(args){
	var obj = this;
	// Interfaces
	Ti._5.DOMView(this, 'optiondialog', args, 'OptionDialog');

	// Properties
	var _androidView = null;
	Object.defineProperty(this, 'androidView', {
		get: function(){return _androidView;},
		set: function(val){return _androidView = val;}
	});

	var _cancel = null;
	Object.defineProperty(this, 'cancel', {
		get: function(){return _cancel;},
		set: function(val){return _cancel = val;}
	});

	var _destructive = null;
	Object.defineProperty(this, 'destructive', {
		get: function(){return _destructive;},
		set: function(val){return _destructive = val;}
	});

	var _options = null;
	Object.defineProperty(this, 'options', {
		get: function(){return _options;},
		set: function(val){return _options = val;}
	});

	var _selectedIndex = null;
	Object.defineProperty(this, 'selectedIndex', {
		get: function(){return _selectedIndex;},
		set: function(val){return _selectedIndex = val;}
	});

	var _title = null;
	Object.defineProperty(this, 'title', {
		get: function(){return _title;},
		set: function(val){return _title = val;}
	});

	var _titleid = null;
	Object.defineProperty(this, 'titleid', {
		get: function(){return _titleid;},
		set: function(val){return _titleid = val;}
	});

	// Methods
	this.show = function(){
		console.debug('Method "Titanium.UI.OptionDialog#.show" is not implemented yet.');
	};

	// Events
	this.addEventListener('click', function(){
		console.debug('Event "click" is not implemented yet.');
	});

	Ti._5.presetUserDefinedElements(this, args);
});