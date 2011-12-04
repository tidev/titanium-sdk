Ti._5.createClass('Titanium.UI.PickerColumn', function(args){
	var obj = this;
	// Interfaces
	Ti._5.DOMView(this, 'pickercolumn', args, 'PickerColumn');
	Ti._5.Touchable(this, args);
	Ti._5.Styleable(this, args);
	Ti._5.Positionable(this, args);

	// Properties
	Ti._5.member(this, 'rowCount');

	Ti._5.member(this, 'rows');

	// Methods
	this.addRow = function(){
		console.debug('Method "Titanium.UI.PickerColumn#.addRow" is not implemented yet.');
	};
	this.removeRow = function(){
		console.debug('Method "Titanium.UI.PickerColumn#.removeRow" is not implemented yet.');
	};

	require.mix(this, args);
});