var win = Titanium.UI.currentWindow

//
// HORIZONTAL SCROLLING TABS
//
var scrollView = Titanium.UI.createScrollView({
	contentWidth:600,
	contentHeight:50,
	top:10,
	height:50,
	width:300,
	borderRadius:10,
	backgroundColor:'#13386c'
});

scrollView1.addEventListener('scroll', function(e)
{
	for(v in e)
	{
		Ti.API.info('v ' + v + ' e[v] ' + e[v]);
	}
});

win.add(scrollView);

var view1 = Ti.UI.createView({
	backgroundColor:'#336699',
	borderRadius:20,
	width:40,
	height:40,
	left:10
});
scrollView.add(view1);
var l1 = Ti.UI.createLabel({
	text:'1',
	font:{fontSize:13},
	color:'#fff'
});
view1.add(l1);

var view2 = Ti.UI.createView({
	backgroundColor:'#336699',
	borderRadius:20,
	width:40,
	height:40,
	left:60
});
scrollView.add(view2);
var l2 = Ti.UI.createLabel({
	text:'2',
	font:{fontSize:13},
	color:'#fff'
});
view2.add(l2);

var view3 = Ti.UI.createView({
	backgroundColor:'#336699',
	borderRadius:20,
	width:40,
	height:40,
	left:110
});
scrollView.add(view3);

var l3 = Ti.UI.createLabel({
	text:'3',
	font:{fontSize:13},
	color:'#fff'
});
view3.add(l3);

var view4 = Ti.UI.createView({
	backgroundColor:'#336699',
	borderRadius:20,
	width:40,
	height:40,
	left:160
});
scrollView.add(view4);

var l4 = Ti.UI.createLabel({
	text:'4',
	font:{fontSize:13},
	color:'#fff'
});
view4.add(l4);

var view5 = Ti.UI.createView({
	backgroundColor:'#336699',
	borderRadius:20,
	width:40,
	height:40,
	left:210
});
scrollView.add(view5);

var l5 = Ti.UI.createLabel({
	text:'5',
	font:{fontSize:13},
	color:'#fff'
});
view5.add(l5);

var view6 = Ti.UI.createView({
	backgroundColor:'#336699',
	borderRadius:20,
	width:40,
	height:40,
	left:260
});
scrollView.add(view6);

var l6 = Ti.UI.createLabel({
	text:'6',
	font:{fontSize:13},
	color:'#fff'
});
view6.add(l6);

var view7 = Ti.UI.createView({
	backgroundColor:'#336699',
	borderRadius:20,
	width:40,
	height:40,
	left:310
});
scrollView.add(view7);

var l7 = Ti.UI.createLabel({
	text:'7',
	font:{fontSize:13},
	color:'#fff'
});
view7.add(l7);

var view8 = Ti.UI.createView({
	backgroundColor:'#336699',
	borderRadius:20,
	width:40,
	height:40,
	left:360
});
scrollView.add(view8);

var l8 = Ti.UI.createLabel({
	text:'8',
	font:{fontSize:13},
	color:'#fff'
});
view8.add(l8);



//
// VERTICAL SCROLLING TABS
//
var scrollView2 = Titanium.UI.createScrollView({
	contentWidth:75,
	contentHeight:500,
	top:70,
	height:200,
	width:75,
	borderRadius:10,
	backgroundColor:'#13386c'
});
win.add(scrollView2);
scrollView2.addEventListener('scroll', function(e)
{
	for(v in e)
	{
		Ti.API.info('v ' + v + ' e[v] ' + e[v]);
	}
});

var view9 = Ti.UI.createView({
	backgroundColor:'#336699',
	borderRadius:20,
	width:40,
	height:40,
	top:10
});
scrollView2.add(view9);

var l9 = Ti.UI.createLabel({
	text:'9',
	font:{fontSize:13},
	color:'#fff'
});
view9.add(l9);

var view10 = Ti.UI.createView({
	backgroundColor:'#336699',
	borderRadius:20,
	width:40,
	height:40,
	top:60
});
scrollView2.add(view10);

var l10 = Ti.UI.createLabel({
	text:'10',
	font:{fontSize:13},
	color:'#fff'
});
view10.add(l10);

var view11 = Ti.UI.createView({
	backgroundColor:'#336699',
	borderRadius:20,
	width:40,
	height:40,
	top:110
});
scrollView2.add(view11);

var l11 = Ti.UI.createLabel({
	text:'11',
	font:{fontSize:13},
	color:'#fff'
});
view11.add(l11);

var view12 = Ti.UI.createView({
	backgroundColor:'#336699',
	borderRadius:20,
	width:40,
	height:40,
	top:160
});
scrollView2.add(view12);

var l12 = Ti.UI.createLabel({
	text:'12',
	font:{fontSize:13},
	color:'#fff'
});
view12.add(l12);

var view13 = Ti.UI.createView({
	backgroundColor:'#336699',
	borderRadius:20,
	width:40,
	height:40,
	top:210
});
scrollView2.add(view13);

var l13 = Ti.UI.createLabel({
	text:'13',
	font:{fontSize:13},
	color:'#fff'
});
view13.add(l13);

var view14 = Ti.UI.createView({
	backgroundColor:'#336699',
	borderRadius:20,
	width:40,
	height:40,
	top:260
});
scrollView2.add(view14);

var l14 = Ti.UI.createLabel({
	text:'14',
	font:{fontSize:13},
	color:'#fff'
});
view14.add(l14);

var view15 = Ti.UI.createView({
	backgroundColor:'#336699',
	borderRadius:20,
	width:40,
	height:40,
	top:310
});
scrollView2.add(view15);

var l15 = Ti.UI.createLabel({
	text:'15',
	font:{fontSize:13},
	color:'#fff'
});
view15.add(l15);

var view16 = Ti.UI.createView({
	backgroundColor:'#336699',
	borderRadius:20,
	width:40,
	height:40,
	top:360
});
scrollView2.add(view16);

var l16 = Ti.UI.createLabel({
	text:'16',
	font:{fontSize:13},
	color:'#fff'
});
view16.add(l16);


win.add(scrollView);
