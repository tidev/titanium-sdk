var win = Titanium.UI.currentWindow

var scrollView = Titanium.UI.createScrollView({
	contentWidth:'auto',
	contentHeight:'auto',
	top:0,
	showVerticalScrollIndicator:true,
	showHorizontalScrollIndicator:true
});


var view = Ti.UI.createView({
	backgroundColor:'#336699',
	borderRadius:10,
	width:300,
	height:2000,
	top:10
});

scrollView.add(view);

win.add(scrollView);


