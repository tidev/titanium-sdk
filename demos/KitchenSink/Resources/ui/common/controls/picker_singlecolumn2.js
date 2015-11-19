function picker_single2(_args) {
	var win = Ti.UI.createWindow({
		title:_args.title
	});
	win.backgroundColor = 'black';
	
	var picker = Ti.UI.createPicker();

	if (Ti.Platform.osname === 'tizen') {
		// On Mobile Web/Tizen, by default, the picker fills the entire view it is contained,
		// unless the size is provided.
		picker.width = 100;
		picker.height = 110;
		picker.color = '#fc0';
	}

	var column = Ti.UI.createPickerColumn();
	column.addRow(Ti.UI.createPickerRow({title:'Bananas',custom_item:'b'}));
	column.addRow(Ti.UI.createPickerRow({title:'Strawberries',custom_item:'s'}));
	column.addRow(Ti.UI.createPickerRow({title:'Mangos',custom_item:'m'}));
	column.addRow(Ti.UI.createPickerRow({title:'Grapes',custom_item:'g'}));
	
	picker.add([column]);
	
	// turn on the selection indicator (off by default)
	picker.selectionIndicator = true;
	
	win.add(picker);
	
	var label = Ti.UI.createLabel({
		text:'Make a move',
		top:10,
		width:Ti.UI.SIZE,
		height:Ti.UI.SIZE,
		textAlign:'center',
		color:'white'
	});
	win.add(label);
	
	
	picker.addEventListener('change',function(e)
	{
		Ti.API.info("You selected row: "+e.row+", column: "+e.column+", custom_item: "+e.row.custom_item);
		label.text = "row index: "+e.rowIndex+", column index: "+e.columnIndex;
	});

	return win;
}

module.exports = picker_single2;