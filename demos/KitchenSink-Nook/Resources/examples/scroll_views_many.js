var win = Titanium.UI.currentWindow;

//
// SCROLL VIEW 1
//
var scrollView1 = Titanium.UI.createScrollView({
	contentWidth:'auto',
	contentHeight:'auto',
	top:10,
	left:10,
	width:250,
	height:150,
	borderRadius:10,
	backgroundColor:'#ff99000',
	showVerticalScrollIndicator:false,
	showHorizontalScrollIndicator:true
});


var view1 = Ti.UI.createView({
	backgroundColor:'#336699',
	borderRadius:10,
	width:1000,
	height:200,
	top:10
});

var l1 = Ti.UI.createLabel({
	text:'Bounce:true, vertbar:false',
	color:'#fff',
	width:'auto',
	height:'auto',
	font: {
		fontSize:24	
	}
});
view1.add(l1);
scrollView1.add(view1);
win.add(scrollView1);

//
// SCROLL VIEW 2
//
var scrollView2 = Titanium.UI.createScrollView({
	contentWidth:'auto',
	contentHeight:'auto',
	top:10,
	right:10,
	width:250,
	height:150,
	borderRadius:10,
	backgroundColor:'#ff99000',
	showVerticalScrollIndicator:true,
	showHorizontalScrollIndicator:false
});


var view2 = Ti.UI.createView({
	backgroundColor:'#336699',
	borderRadius:10,
	width:150,
	height:200,
	top:10
});

var l2 = Ti.UI.createLabel({
	text:'Bounce:true, horzbar:false',
	color:'#fff',
	width:'auto',
	height:'auto',
	font: {
		fontSize:24	
	}
});
view2.add(l2);
scrollView2.add(view2);
win.add(scrollView2);


