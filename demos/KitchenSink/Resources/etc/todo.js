function todo() {
	var win=Titanium.UI.createWindow();
	
	var label = Titanium.UI.createLabel({
		text:'Test has not been implemented yet',
		font:{fontFamily:'Helvetica Neue',fontSize:24,fontWeight:'bold'},
		textAlign:'center',
		width:'auto',
		height:'auto'
	});
	win.add(label);
	return win;
};

module.exports = todo;