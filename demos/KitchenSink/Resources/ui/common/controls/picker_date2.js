function picker_date2(_args) {
	var win = Ti.UI.createWindow({
		title:_args.title
	});
	win.backgroundColor = 'black';
	
	var value = new Date();
	value.setMinutes(10);
	value.setHours(13);
	value.setSeconds(48);
			
	var picker = Ti.UI.createPicker({
		type:Ti.UI.PICKER_TYPE_TIME,
		value:value
	});
	
	// turn on the selection indicator (off by default)
	picker.selectionIndicator = true;
	
	win.add(picker);
	
	var label = Ti.UI.createLabel({
		text:'Choose a time',
		top:6,
		width:Ti.UI.SIZE,
		height:Ti.UI.SIZE,
		textAlign:'center',
		color:'white'
	});
	win.add(label);
	
	picker.addEventListener('change',function(e)
	{
		label.text = e.value.toLocaleString();
	});

	return win;
}

module.exports = picker_date2;