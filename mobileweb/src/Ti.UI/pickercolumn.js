Ti._5.createClass('Ti.UI.PickerColumn', function(args){
	var obj = this;

	// Interfaces
	Ti._5.DOMView(obj, 'pickercolumn', args, 'PickerColumn');
	Ti._5.Touchable(obj, args);
	Ti._5.Styleable(obj, args);
	Ti._5.Positionable(obj, args);

	// Properties
	Ti._5.prop(obj, {
		rowCount: 0,
		rows: 0
	});

	// Methods
	obj.addRow = function(){
		console.debug('Method "Titanium.UI.PickerColumn#.addRow" is not implemented yet.');
	};
	obj.removeRow = function(){
		console.debug('Method "Titanium.UI.PickerColumn#.removeRow" is not implemented yet.');
	};

	require.mix(obj, args);
});