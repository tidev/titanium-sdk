Ti._5.createClass('Titanium.UI.iPhone.TableViewStyle', function(args){
	var obj = this;
	// Interfaces
	Ti._5.DOMView(this, 'iphone.tableviewstyle', args, 'iPhone.TableViewStyle');

	// Properties
	var _GROUPED = null;
	Object.defineProperty(this, 'GROUPED', {
		get: function(){return _GROUPED;},
		set: function(val){return _GROUPED = val;}
	});

	var _PLAIN = null;
	Object.defineProperty(this, 'PLAIN', {
		get: function(){return _PLAIN;},
		set: function(val){return _PLAIN = val;}
	});

	Ti._5.presetUserDefinedElements(this, args);
});