function picker_custom2(_args) {
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

	function addRow(x)
	{
		var row = Ti.UI.createPickerRow();
		var img = Ti.UI.createImageView({image:'/images/imageview/'+x+'.jpg',width:40,height:40});
		row.add(img);
		picker.add(row);
	}
	
	for(var c=0;c<=10;c++)
	{
		addRow(c);
	}
	
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

module.exports = picker_custom2;