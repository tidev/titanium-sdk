Ti._5.createClass('Titanium.UI.DashboardView', function(args){
	var obj = this;
	// Interfaces
	Ti._5.DOMView(this, 'dashboardview', args, 'DashboardView');
	Ti._5.Touchable(this, args);
	Ti._5.Styleable(this, args);
	Ti._5.Positionable(this, args);

	// Properties
	var _data = null;
	Object.defineProperty(this, 'data', {
		get: function(){return _data;},
		set: function(val){return _data = val;}
	});

	var _wobble = null;
	Object.defineProperty(this, 'wobble', {
		get: function(){return _wobble;},
		set: function(val){return _wobble = val;}
	});

	// Methods
	this.startEditing = function(){
		console.debug('Method "Titanium.UI.DashboardView#.startEditing" is not implemented yet.');
	};
	this.stopEditing = function(){
		console.debug('Method "Titanium.UI.DashboardView#.stopEditing" is not implemented yet.');
	};

	// Events
	this.addEventListener('commit', function(){
		console.debug('Event "commit" is not implemented yet.');
	});
	this.addEventListener('delete', function(){
		console.debug('Event "delete" is not implemented yet.');
	});
	this.addEventListener('edit', function(){
		console.debug('Event "edit" is not implemented yet.');
	});
	this.addEventListener('move', function(){
		console.debug('Event "move" is not implemented yet.');
	});

	Ti._5.presetUserDefinedElements(this, args);
});