Ti._5.createClass('Titanium.UI.iPhone.ProgressBarStyle', function(args){
	var obj = this;
	// Interfaces
	Ti._5.DOMView(this, 'iphone.progressbarstyle', args, 'iPhone.ProgressBarStyle');

	// Properties
	var _BAR = null;
	Object.defineProperty(this, 'BAR', {
		get: function(){return _BAR;},
		set: function(val){return _BAR = val;}
	});

	var _DEFAULT = null;
	Object.defineProperty(this, 'DEFAULT', {
		get: function(){return _DEFAULT;},
		set: function(val){return _DEFAULT = val;}
	});

	var _PLAIN = null;
	Object.defineProperty(this, 'PLAIN', {
		get: function(){return _PLAIN;},
		set: function(val){return _PLAIN = val;}
	});


	Ti._5.presetUserDefinedElements(this, args);
});