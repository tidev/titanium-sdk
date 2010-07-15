var win = Ti.UI.currentWindow;

var scrollView = Ti.UI.createScrollView({
	contentHeight:'auto',
	contentWidth:'auto'
});

win.add(scrollView);

var ta1 = Titanium.UI.createTextArea({
	value:'I am a textarea',
	height:100,
	width:300,
	top:10,
	font:{fontSize:20,fontFamily:'Marker Felt', fontWeight:'bold'},
	color:'#888',
	textAlign:'left',
	borderWidth:2,
	borderColor:'#bbb',
	borderRadius:5
});
scrollView.add(ta1);

var ta2 = Titanium.UI.createTextArea({
	value:'I am a textarea',
	height:100,
	width:300,
	top:120,
	font:{fontSize:20,fontFamily:'Marker Felt', fontWeight:'bold'},
	color:'#888',
	textAlign:'left',
	borderWidth:2,
	borderColor:'#555',
	borderRadius:5
});
scrollView.add(ta2);

var ta2 = Titanium.UI.createTextArea({
	value:'I am a textarea',
	height:100,
	width:300,
	top:230,
	font:{fontSize:20,fontFamily:'Marker Felt', fontWeight:'bold'},
	color:'#888',
	textAlign:'left',
	borderWidth:2,
	borderColor:'#555',
	borderRadius:5
});
scrollView.add(ta2);