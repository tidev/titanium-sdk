Ti._5.createClass('Titanium.UI.iPhone.TableViewScrollPosition', function(args){
	var obj = this;
	// Interfaces
	Ti._5.DOMView(this, 'iphone.tableviewscrollposition', args, 'iPhone.TableViewScrollPosition');

	// Properties
	var _BOTTOM = null;
	Object.defineProperty(this, 'BOTTOM', {
		get: function(){return _BOTTOM;},
		set: function(val){return _BOTTOM = val;}
	});

	var _MIDDLE = null;
	Object.defineProperty(this, 'MIDDLE', {
		get: function(){return _MIDDLE;},
		set: function(val){return _MIDDLE = val;}
	});

	var _NONE = null;
	Object.defineProperty(this, 'NONE', {
		get: function(){return _NONE;},
		set: function(val){return _NONE = val;}
	});

	var _TOP = null;
	Object.defineProperty(this, 'TOP', {
		get: function(){return _TOP;},
		set: function(val){return _TOP = val;}
	});

	Ti._5.presetUserDefinedElements(this, args);
});