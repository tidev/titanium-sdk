var win = Ti.UI.currentWindow;

// in this test, the label has a minimum was is larger than the actual
// auto height - this means the label should be larger (200px)

var view = Ti.UI.createLabel({ 
	text: "Line 1\nLine 2", 
	font: {fontSize: 12},
	width: 280, 
	height:'auto', 
	minHeight:200,
	borderWidth:1,
	borderColor:'red',
	top: 30 
});


var label = Ti.UI.createLabel({
	text:"the red box above should be 200px (larger than text)",
	textAlign:"center",
	width:280,
	height:"auto",
	bottom:50
});

win.add(view);
win.add(label);
