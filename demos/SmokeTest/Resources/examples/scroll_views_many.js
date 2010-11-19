var win = Titanium.UI.currentWindow;

//
// SCROLL VIEW 1
//
var scrollView1 = Titanium.UI.createScrollView({
	contentWidth:'auto',
	contentHeight:'auto',
	top:10,
	left:10,
	width:100,
	height:150,
	borderRadius:10,
	backgroundColor:'#ff99000',
	showVerticalScrollIndicator:false,
	showHorizontalScrollIndicator:true
});


var view1 = Ti.UI.createView({
	backgroundColor:'#336699',
	borderRadius:10,
	width:150,
	height:200,
	top:10
});

var l1 = Ti.UI.createLabel({
	text:'Bounce:true, vertbar:false',
	color:'#fff',
	width:'auto',
	height:'auto'
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
	width:100,
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
	height:'auto'
});
view2.add(l2);
scrollView2.add(view2);
win.add(scrollView2);

//
//  THESE ARE IPHONE-SPECIFIC
//
if (Titanium.Platform.name == 'iPhone OS')
{
	//
	// SCROLL VIEW 3
	//
	var scrollView3 = Titanium.UI.createScrollView({
		contentWidth:'auto',
		contentHeight:'auto',
		top:170,
		left:10,
		width:100,
		height:150,
		borderRadius:10,
		backgroundColor:'#ff99000',
		showVerticalScrollIndicator:true,
		showHorizontalScrollIndicator:true,
		horizontalBounce:true,
		verticalBounce:true
	});


	var view3 = Ti.UI.createView({
		backgroundColor:'#336699',
		borderRadius:10,
		width:80,
		height:120,
		top:10
	});

	var l3 = Ti.UI.createLabel({
		text:'bounce',
		color:'#fff',
		width:'auto',
		height:'auto'
	});
	view3.add(l3);
	scrollView3.add(view3);
	win.add(scrollView3);


	//
	// SCROLL VIEW 4
	//
	var scrollView4 = Titanium.UI.createScrollView({
		contentWidth:'auto',
		contentHeight:'auto',
		top:170,
		right:10,
		width:100,
		height:150,
		borderRadius:10,
		backgroundColor:'#ff99000',
		disableBounce:true
	});


	var view4 = Ti.UI.createView({
		backgroundColor:'#336699',
		borderRadius:150,
		width:150,
		height:200,
		top:10
	});

	var l4 = Ti.UI.createLabel({
		text:'bounce:false',
		color:'#fff',
		width:'auto',
		height:'auto'
	});
	view4.add(l4);
	scrollView4.add(view4);
	win.add(scrollView4);
}


