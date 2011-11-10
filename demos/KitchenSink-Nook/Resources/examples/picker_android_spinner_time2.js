var win = Titanium.UI.currentWindow;
win.backgroundColor = 'black';

var value = new Date();
value.setMinutes(10);
value.setHours(13);
value.setSeconds(48);
		
var picker = Ti.UI.createPicker({
	useSpinner:true,
	type:Ti.UI.PICKER_TYPE_TIME,
	value:value,
	minuteInterval: 15
});
picker.minuteInterval = 15;

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
	label.text = e.value;
});

win.add(Ti.UI.createLabel({
	text: 'This example shows setting "minuteInterval: 15".',
	backgroundColor: 'blue',
	color: 'yellow',
	bottom: 5,
	font: {
		fontSize:24	
	}
}));
