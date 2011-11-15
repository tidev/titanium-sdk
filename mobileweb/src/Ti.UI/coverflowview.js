Ti._5.createClass('Titanium.UI.CoverFlowView', function(args){
	var obj = this;
	// Interfaces
	Ti._5.DOMView(this, 'coverflowview', args, 'CoverFlowView');
	Ti._5.Touchable(this, args);
	Ti._5.Styleable(this, args);
	Ti._5.Positionable(this, args);

	// Properties
	var _images = null;
	Object.defineProperty(this, 'images', {
		get: function(){return _images;},
		set: function(val){return _images = val;}
	});

	var _selected = null;
	Object.defineProperty(this, 'selected', {
		get: function(){return _selected;},
		set: function(val){return _selected = val;}
	});

	// Methods
	this.setImage = function(){
		console.debug('Method "Titanium.UI.CoverFlowView#.setImage" is not implemented yet.');
	};

	// Events
	this.addEventListener('change', function(){
		console.debug('Event "change" is not implemented yet.');
	});

	Ti._5.presetUserDefinedElements(this, args);
});