// Create the CheckBox
var cb1 = Titanium.UI.Android.createCheckBox({
	title:'I am a CheckBox',
	height:40,
	width:200,
	top:10
});

// Create a label to display CheckBox state
var lbl = Titanium.UI.createLabel({
	height:20,
	top:50
});
cb1.addEventListener('click', function() {
	lbl.text = 'CheckBox is ' + (cb1.checked ? '' : 'un') + 'checked';
});
cb1.fireEvent('click'); // Make sure label is initially filled in

// Create a button used to toggle the CheckBox remotely
var tglBtn = Titanium.UI.createButton({
	title: 'Click to toggle CheckBox',
	height:40,
	width:200,
	top:80
});
tglBtn.addEventListener('click', function() {
	cb1.toggle();
	cb1.fireEvent('click');
});

// Create a button used to check the CheckBox
var chkBtn = Titanium.UI.createButton({
	title: 'Click to check the CheckBox',
	height:40,
	width:200,
	top:120
});
chkBtn.addEventListener('click', function() {
	cb1.checked = true;
	cb1.fireEvent('click');
});

Titanium.UI.currentWindow.add(cb1);
Titanium.UI.currentWindow.add(lbl);
Titanium.UI.currentWindow.add(tglBtn);
Titanium.UI.currentWindow.add(chkBtn);

