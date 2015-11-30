function scroll_view_textarea(_args) {
	var win = Ti.UI.createWindow({
		title:_args.title
	});
	
	var scrollView = Ti.UI.createScrollView({
		contentHeight:Ti.UI.FILL,
		contentWidth:Ti.UI.FILL
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
	return win;
};

module.exports = scroll_view_textarea;