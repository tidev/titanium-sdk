var win = Titanium.UI.currentWindow;
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
	width:'auto',
	height:'auto',
	textAlign:'center',
	color:'white',
	font: {
		fontSize:24	
	}
});
win.add(label);

picker.addEventListener('change',function(e)
{
	label.text = e.value.toLocaleString();
});
