Ti._5.createClass('Titanium.UI.iPad.SplitWindow', function(args){
	var obj = this;
	// Interfaces
	Ti._5.DOMView(this, 'ipad.splitwindow', args, 'iPad.SplitWindow');
	Ti._5.Touchable(this);
	Ti._5.Styleable(this, args);
	Ti._5.Positionable(this, args);

	// Properties
	var _detailView = null;
	Object.defineProperty(this, 'detailView', {
		get: function(){return _detailView;},
		set: function(val){return _detailView = val;}
	});

	var _masterView = null;
	Object.defineProperty(this, 'masterView', {
		get: function(){return _masterView;},
		set: function(val){return _masterView = val;}
	});


	// Events
	this.addEventListener('visible', function(){
		console.debug('Event "visible" is not implemented yet.');
	});

	Ti._5.presetUserDefinedElements(this, args);
});