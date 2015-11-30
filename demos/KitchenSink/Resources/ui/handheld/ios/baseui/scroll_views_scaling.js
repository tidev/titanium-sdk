function scroll_view_scale(_args) {
	var win = Titanium.UI.createWindow({
		title:_args.title
	});
	
	var scrollView = Titanium.UI.createScrollView({
		contentWidth:Ti.UI.FILL,
		contentHeight:Ti.UI.FILL,
	
		top:0,
		bottom:50,
	
		backgroundColor:'red',
	
		showVerticalScrollIndicator:true,
		showHorizontalScrollIndicator:true,
	
		maxZoomScale:100,
		minZoomScale:0.1
	});
	
	
	var view = Ti.UI.createView({
		backgroundColor:'#336699',
		borderRadius:10,
		width:300,
		height:500,
		top:10
	});
	
	var label = Ti.UI.createLabel({
		font:{fontSize:18,fontWeight:'bold',fontFamily:'Helvetica Neue'},
		text:'Pinch or Zoom',
		width:Ti.UI.SIZE,
		height:Ti.UI.SIZE
	});
	
	view.add(label);
	
	scrollView.add(view);
	
	var messageView = Ti.UI.createView({
		backgroundColor:'black',
		bottom:0,
		height:50
	});
	
	var message = Ti.UI.createLabel({
		font:{fontSize:14,fontFamily:'Helvetica Neue'},
		color:'yellow',
		width:Ti.UI.SIZE,
		height:Ti.UI.SIZE
	});
	
	messageView.add(message);
	
	win.add(scrollView);
	win.add(messageView);
	
	scrollView.addEventListener('scale',function(e)
	{
		message.text = "Zoomed to scale: "+e.scale;
	});
	
	scrollView.addEventListener('scroll',function(e)
	{
		message.text = "Scrolling to x:"+Math.round(e.x)+", y:"+Math.round(e.y);
	});
	
	var bb = Titanium.UI.createButtonBar({
		labels:['+', '-'],
		backgroundColor:'#336699',
		top:50,
		height:25,
		width:100
	});
	
	win.setRightNavButton(bb);
	
	bb.addEventListener('click',function(e)
	{
		if (e.index === 0)
		{
			scrollView.zoomScale = scrollView.zoomScale+0.1;
		}
		else
		{
			scrollView.zoomScale = scrollView.zoomScale-0.1;
		}
		label.text = "Scale: "+scrollView.zoomScale;
	});
	return win;
};

module.exports = scroll_view_scale;
