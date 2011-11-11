Ti._5.createClass('Titanium.UI.PickerColumn', function(args){
	var obj = this;
	// Interfaces
	Ti._5.DOMView(this, 'pickercolumn', args, 'PickerColumn');
	Ti._5.Touchable(this, args);
	Ti._5.Styleable(this, args);
	Ti._5.Positionable(this, args);

	// Properties
	var _rowCount = null;
	Object.defineProperty(this, 'rowCount', {
		get: function(){return _rowCount;},
		set: function(val){return _rowCount = val;}
	});

	var _rows = null;
	Object.defineProperty(this, 'rows', {
		get: function(){return _rows;},
		set: function(val){return _rows = val;}
	});

	// Methods
	this.addRow = function(){
		console.debug('Method "Titanium.UI.PickerColumn#.addRow" is not implemented yet.');
	};
	this.removeRow = function(){
		console.debug('Method "Titanium.UI.PickerColumn#.removeRow" is not implemented yet.');
	};

	Ti._5.presetUserDefinedElements(this, args);
});