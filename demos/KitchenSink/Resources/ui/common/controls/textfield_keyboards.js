function textfield_keyboard(_args) {
	var win = Ti.UI.createWindow({
		title:_args.title
	});
	
	var tf1 = Titanium.UI.createTextField({
		color:'#336699',
		height:35,
		top:10,
		left:10,
		width:250,
		keyboardType:Titanium.UI.KEYBOARD_DEFAULT,
		returnKeyType:Titanium.UI.RETURNKEY_DEFAULT,
		borderStyle:Titanium.UI.INPUT_BORDERSTYLE_ROUNDED
	
	});
	tf1.addEventListener('return', function()
	{
		tf1.blur();
	});
	
	win.add(tf1);
	
	var b1 = Titanium.UI.createButton({
		title:'ASCII',
		height:40,
		width:145,
		left:10,
		top:55
	});
	b1.addEventListener('click', function()
	{
		tf1.blur();
		tf1.keyboardType = Titanium.UI.KEYBOARD_ASCII;
		tf1.appearance = Titanium.UI.KEYBOARD_APPEARANCE_ALERT;
		tf1.enableReturnKey = false;
		tf1.returnKeyType = Titanium.UI.RETURNKEY_GO;
		tf1.focus();
	});
	win.add(b1);
	
	var b2 = Titanium.UI.createButton({
		title:'Numbers/Punc',
		height:40,
		width:145,
		right:10,
		top:55
	});
	b2.addEventListener('click', function()
	{
		tf1.blur();
		tf1.keyboardType = Titanium.UI.KEYBOARD_NUMBERS_PUNCTUATION;
		tf1.enableReturnKey = true;
		tf1.returnKeyType = Titanium.UI.RETURNKEY_DONE;
		tf1.focus();
	});
	win.add(b2);
	
	var b3 = Titanium.UI.createButton({
		title:'URL',
		height:40,
		width:145,
		left:10,
		top:105
	});
	b3.addEventListener('click', function()
	{
		tf1.blur();
		tf1.keyboardType = Titanium.UI.KEYBOARD_URL;
		tf1.keyboardAppearance = Titanium.UI.KEYBOARD_APPEARANCE_DEFAULT;
		tf1.returnKeyType = Titanium.UI.RETURNKEY_SEARCH;
		tf1.focus();
	});
	win.add(b3);
	
	var b4 = Titanium.UI.createButton({
		title:'Numbers Pad',
		height:40,
		width:145,
		right:10,
		top:105
	});
	b4.addEventListener('click', function()
	{
		tf1.blur();
		tf1.keyboardType = Titanium.UI.KEYBOARD_NUMBER_PAD;
		tf1.focus();
	});
	win.add(b4);
	
	var b5 = Titanium.UI.createButton({
		title:'Phone Pad',
		height:40,
		width:145,
		left:10,
		top:155
	});
	b5.addEventListener('click', function()
	{
		tf1.blur();
		tf1.keyboardType = Titanium.UI.KEYBOARD_PHONE_PAD;
		tf1.focus();
	});
	win.add(b5);
	
	var b6 = Titanium.UI.createButton({
		title:'Name/Phone',
		height:40,
		width:145,
		right:10,
		top:155
	});
	b6.addEventListener('click', function()
	{
		tf1.blur();
		tf1.keyboardType = Titanium.UI.KEYBOARD_NAMEPHONE_PAD;
		tf1.returnKeyType = Titanium.UI.RETURNKEY_EMERGENCY_CALL;
		tf1.focus();
		
	});
	win.add(b6);
	
	var b7 = Titanium.UI.createButton({
		title:'Email',
		height:40,
		width:145,
		left:10,
		top:205
	});
	b7.addEventListener('click', function()
	{
		tf1.blur();
		tf1.keyboardType = Titanium.UI.KEYBOARD_EMAIL;
		tf1.returnKeyType = Titanium.UI.RETURNKEY_ROUTE;	
		tf1.focus();
	});
	win.add(b7);
	
	if (Titanium.Platform.name == 'iPhone OS')
	{
		var b8 = Titanium.UI.createButton({
			title:'Decimal Pad',
			height:40,
			width:145,
			right:10,
			top:205
		});
		b8.addEventListener('click', function()
		{
			tf1.blur();
			tf1.keyboardType = Titanium.UI.KEYBOARD_DECIMAL_PAD;
			tf1.focus();
		});
		win.add(b8);
	}

	return win;
}

module.exports = textfield_keyboard;