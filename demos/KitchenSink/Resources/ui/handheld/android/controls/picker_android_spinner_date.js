function picker_spinner_date(_args) {
	var win = Ti.UI.createWindow({
		title:_args.title
	});
	win.backgroundColor = 'black';
	
	var minDate = new Date();
	minDate.setFullYear(2009);
	minDate.setMonth(0);
	minDate.setDate(1);
	
	var maxDate = new Date();
	maxDate.setFullYear(2009);
	maxDate.setMonth(11);
	maxDate.setDate(31);
	
	var value = new Date();
	value.setFullYear(2009);
	value.setMonth(0);
	value.setDate(1);
	
	var picker = Ti.UI.createPicker({
		useSpinner: true,
		type:Ti.UI.PICKER_TYPE_DATE,
		minDate:minDate,
		maxDate:maxDate,
		value:value
	});
	
	// turn on the selection indicator (off by default)
	picker.selectionIndicator = true;
	
	win.add(picker);
	
	var label = Ti.UI.createLabel({
		text:'Choose a date',
		top:6,
		width:'auto',
		height:'auto',
		textAlign:'center',
		color:'white'
	});
	win.add(label);
	
	picker.addEventListener('change',function(e)
	{
		label.text = e.value;
	});
	
	var locale = false;
	var localebutton = Ti.UI.createButton({
		title:'Change locale',
		bottom:20,
		width:200,
		height:40
	});
	localebutton.addEventListener('click', function() {
		if (!locale) {
			picker.setLocale('ru');
			locale = true;
		}
		else {
			locale = false;
			picker.setLocale(Titanium.Platform.locale);
		}
	});
	win.add(localebutton);

	return win;
}

module.exports = picker_spinner_date;