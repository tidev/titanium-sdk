function custom_props2() {
	var win = Titanium.UI.createWindow();
	
	//This can't happen until the window is opened. Otherwise properties attached to the window wont exist yet. -AD
	win.addEventListener('open', function() {
		// pull properties off of current window object an display
		var l = Titanium.UI.createLabel({
			top:0,
			height:Ti.UI.SIZE,
			width:300,
			color:'#777',
			font:{fontSize:16},
			text:'func: ' + win.myFunc() + '\nstring (1): ' + win.stringProp1 + '\nstring (2): ' + win.stringProp2 + '\nnum (1):' + win.numProp1 + '\nnum (2):' + win.numProp2 + '\nobj (name):' + win.objProp1.name + '\nobj (age):' + win.objProp1.age
		});
		win.add(l);
	});
	
	
	return win;
};

module.exports = custom_props2;

