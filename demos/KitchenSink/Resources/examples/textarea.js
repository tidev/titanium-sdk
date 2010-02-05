var win = Titanium.UI.currentWindow;

var l = Titanium.UI.createLabel({
	text:'Text area tests.',
	font:{fontSize:14},
	left:10,
	top:10,
	width:300
});
win.add(l);

var ta1 = Titanium.UI.createTextArea({
	value:'I am a textarea',
	height:100,
	width:300,
	top:40,
	autocorrect:true,
	font:{fontSize:20,fontFamily:'Marker Felt', fontWeight:'bold'},
	color:'#888',
	textAlign:'left',
	editable:true,
	enabled:false,
	passwordMask:false,
	appearance:Titanium.UI.KEYBOARD_APPEARANCE_ALERT,	
	keyboardType:Titanium.UI.KEYBOARD_NUMBERS_PUNCTUATION,
	returnKeyType:Titanium.UI.RETURNKEY_EMERGENCY_CALL,
	borderWidth:2,
	borderColor:'#bbb',
	borderRadius:5,
});
win.add(ta1);
ta1.addEventListener('change',function(e)
{
	l.text = 'change fired, value = ' + e.value;
});

ta1.addEventListener('blur',function(e)
{
	l.text = 'blur fired, value = ' + e.value;
});
ta1.addEventListener('focus',function(e)
{
	l.text = 'focus fired, value = ' + e.value;
});
ta1.addEventListener('return',function(e)
{
	l.text = 'return fired, value = ' + e.value;
});


