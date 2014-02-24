var win2 = Titanium.UI.createWindow();
exports.set_prop = function(){
	win2.addEventListener('open', function() {
		var l = Titanium.UI.createLabel({
			top : 0,
			height : 'auto',
			width : 300,
			color : '#777',
			font : {fontSize:16},
			text : 'func: ' + win2.myFunc() + '\nstring (1): ' + win2.stringProp1 + '\nstring (2): ' + win2.stringProp2 + '\nnum (1):' + win2.numProp1 + '\nnum (2):' + win2.numProp2 + '\nobj (name):' + win2.objProp1.name + '\nobj (age):' + win2.objProp1.age
		});
		win2.add(l);
	});
	return win2;
};
exports.get_prop = function(){	
	return win2;
};
