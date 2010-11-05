var win = Ti.UI.currentWindow;
var scrollView = Ti.UI.createScrollView({height:200,top:0});
win.add(scrollView);

var view1 = Ti.UI.createView({
	backgroundColor:'pink',
	zIndex:10,
	width:200,
	height:30,
	top:10,
	left:10
});

var view2 = Ti.UI.createView({
	backgroundColor:'blue',
	zIndex:11,
	width:200,
	height:30,
	top:15,
	left:15
});

var view3 = Ti.UI.createView({
	backgroundColor:'red',
	zIndex:12,
	width:200,
	height:30,
	top:20,
	left:20
});

scrollView.add(view3);
scrollView.add(view2);
scrollView.add(view1);

var l = Ti.UI.createLabel({
	text:'scroll view: red on top, blue in the middle, pink below',
	color:'#777',
	width:300,
	height:20,
	top:50,
	left:10,
	font:{fontSize:12}
});
scrollView.add(l);


var view4 = Ti.UI.createView({
	backgroundColor:'green',
	zIndex:10,
	width:200,
	height:30,
	top:210,
	left:10
});

var view5 = Ti.UI.createView({
	backgroundColor:'orange',
	zIndex:11,
	width:200,
	height:30,
	top:215,
	left:15
});

var view6 = Ti.UI.createView({
	backgroundColor:'yellow',
	zIndex:12,
	width:200,
	height:30,
	top:220,
	left:20
});

win.add(view6);
win.add(view5);
win.add(view4);

var l2 = Ti.UI.createLabel({
	text:'win: yellow on top, orange in the middle, green below',
	color:'#777',
	width:300,
	top:240,
	font:{fontSize:12}
});

win.add(l2);