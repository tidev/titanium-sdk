var win = Ti.UI.currentWindow;
win.backgroundColor = '#336699';

var commentTextWrap = Ti.UI.createView({ 
	backgroundColor: '#fff', 
	borderRadius: 12, 
	height: 'auto', 
	width: 300, 
	top: 10 
});

var commentText = Ti.UI.createLabel({ 
	text: "My containing view should only be as large as I am ", 
	font: {fontSize: 12}, 
	width: 280, 
	height:'auto', 
	top: 10 
});

commentTextWrap.add(commentText); 
win.add(commentTextWrap);
