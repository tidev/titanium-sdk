function picker_noselection(_args) {
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
	
	var data = [];
	data[0]=Ti.UI.createPickerRow({title:'Bananas',custom_item:'b'});
	data[1]=Ti.UI.createPickerRow({title:'Strawberries',custom_item:'s'});
	data[2]=Ti.UI.createPickerRow({title:'Mangos',custom_item:'m'});
	data[3]=Ti.UI.createPickerRow({title:'Grapes',custom_item:'g'});
	
	picker.add(data);
	
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

module.exports = picker_noselection;