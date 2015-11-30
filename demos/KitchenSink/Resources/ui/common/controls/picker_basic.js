function picker_basic(_args) {
	var win = Ti.UI.createWindow({
		title:_args.title
	});
	win.backgroundColor = 'black';
	
	var picker = Ti.UI.createPicker();
	
	if (Ti.Platform.osname === 'tizen') {
		// On Mobile Web/Tizen, by default, the picker fills the entire view it is contained,
		// unless the size is provided.
		picker.width = '100';
		picker.height = '110';
		picker.color = '#fc0';
	}
	
	var data = [];
	data[0]=Ti.UI.createPickerRow({title:'Bananas',custom_item:'b'});
	data[1]=Ti.UI.createPickerRow({title:'Strawberries',custom_item:'s'});
	data[2]=Ti.UI.createPickerRow({title:'Mangos',custom_item:'m'});
	data[3]=Ti.UI.createPickerRow({title:'Grapes',custom_item:'g'});
	
	// turn on the selection indicator (off by default)
	picker.selectionIndicator = true;
	
	picker.add(data);
	
	win.add(picker);
	
	picker.setSelectedRow(0,1,true);
	
	var label = Ti.UI.createLabel({
		text:'Make a move',
		top:6,
		width:Ti.UI.SIZE,
		height:Ti.UI.SIZE,
		textAlign:'center',
		color:'white'
	});
	win.add(label);
	
	var button = Ti.UI.createButton({
		title:'Set to Grapes',
		top:34,
		width:120,
		height:30
	});
	win.add(button);
	
	button.addEventListener('click',function()
	{
		// column, row, animated (optional)
		picker.setSelectedRow(0,3,true);
	});
	
	picker.addEventListener('change',function(e)
	{
		Ti.API.info("You selected row: "+e.row+", column: "+e.column+", custom_item: "+e.row.custom_item);
		label.text = "row index: "+e.rowIndex+", column index: "+e.columnIndex;
	});
	
	picker.setSelectedRow(0,1,false);

	return win;
}

module.exports = picker_basic;