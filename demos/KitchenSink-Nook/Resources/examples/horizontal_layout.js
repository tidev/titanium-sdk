var win = Ti.UI.currentWindow;

var view = Ti.UI.createView({
	layout:'horizontal'
});
win.add(view);

for (var i = 0; i < 100; i++) {
	view.add(Ti.UI.createView({
		height: 20,
		width: 20,
		borderWidth: 1,
		borderColor: '#000',
		borderRadius: 4,
		backgroundColor: '#336699',
		left: (i == 0) ? 0 : 10	
	}));	
}

// var l1 = Ti.UI.createLabel({
	// text:'I am the first label',
	// left:5,
	// width:'auto',
	// height:20,
	// font: {
		// fontSize:24	
	// }
// });
// 
// view.add(l1);
// 
// var l2 = Ti.UI.createLabel({
	// text:'I am the second label',
	// left:2,
	// width:'auto',
	// height:20,
	// font: {
		// fontSize:24	
	// }
// });
// 
// view.add(l2);
// 
// var l3 = Ti.UI.createLabel({
	// text:'I am the third label',
	// left:2,
	// width:'auto',
	// height:20,
	// font: {
		// fontSize:24	
	// }
// });
// 
// view.add(l3);