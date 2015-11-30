function view_autoheight(_args) {
	var win = Ti.UI.createWindow({
		title:_args.title
	});
	win.backgroundColor = '#336699';
	
	var commentTextWrap = Ti.UI.createView({ 
		backgroundColor: '#fff', 
		borderRadius: 12, 
		height: Ti.UI.SIZE, 
		width: 300, 
		top: 10 
	});
	
	var commentText = Ti.UI.createLabel({ 
		text: "My containing view should only be as large as I am ", 
		font: {fontSize: 12}, 
		width: 280, 
		height:Ti.UI.SIZE
	});
	
	commentTextWrap.add(commentText); 
	win.add(commentTextWrap);
	return win;
};

module.exports = view_autoheight;