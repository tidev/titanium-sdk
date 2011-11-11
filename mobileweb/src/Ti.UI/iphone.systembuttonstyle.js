Ti._5.createClass('Titanium.UI.iPhone.SystemButtonStyle', function(args){
	var obj = this;
	// Interfaces
	Ti._5.DOMView(this, 'iphone.systembuttonstyle', args, 'iPhone.SystemButtonStyle');

	// Properties
	var _BAR = null;
	Object.defineProperty(this, 'BAR', {
		get: function(){return _BAR;},
		set: function(val){return _BAR = val;}
	});

	var _BORDERED = null;
	Object.defineProperty(this, 'BORDERED', {
		get: function(){return _BORDERED;},
		set: function(val){return _BORDERED = val;}
	});

	var _DONE = null;
	Object.defineProperty(this, 'DONE', {
		get: function(){return _DONE;},
		set: function(val){return _DONE = val;}
	});

	var _PLAIN = null;
	Object.defineProperty(this, 'PLAIN', {
		get: function(){return _PLAIN;},
		set: function(val){return _PLAIN = val;}
	});

	Ti._5.presetUserDefinedElements(this, args);
});