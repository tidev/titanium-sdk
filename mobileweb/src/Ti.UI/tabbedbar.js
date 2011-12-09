Ti._5.createClass('Titanium.UI.TabbedBar', function(args){

	// deprecated since 1.8.0

	var obj = this;
	// Interfaces
	Ti._5.DOMView(this, 'tabbedbar', args, 'TabbedBar');
	Ti._5.Touchable(this, args);
	Ti._5.Styleable(this, args);
	Ti._5.Positionable(this, args);

	// Properties
	var _index = null;
	Object.defineProperty(this, 'index', {
		get: function(){return _index;},
		set: function(val){return _index = val;}
	});

	var _labels = null;
	Object.defineProperty(this, 'labels', {
		get: function(){return _labels;},
		set: function(val){return _labels = val;}
	});

	var _style = null;
	Object.defineProperty(this, 'style', {
		get: function(){return _style;},
		set: function(val){return _style = val;}
	});

	Ti._5.presetUserDefinedElements(this, args);
});