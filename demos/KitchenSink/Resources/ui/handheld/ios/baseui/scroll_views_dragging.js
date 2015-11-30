function scroll_view_drag(_args) {
	var win = Titanium.UI.createWindow({
		title:_args.title
	});
	
	var scrollView = Ti.UI.createScrollView({
	    width: 320, 
	    height: 480,
	    contentWidth: 2000,
	    backgroundColor:'white'
	});
	scrollView.add(Ti.UI.createLabel({
	    text: 'Swipe Me',
	    width: 2000, height: 30,
	    textAlign: 'left'
	}));
	scrollView.add(Ti.UI.createLabel({
	    text: '...and dragStart and dragEnd should fire!',
	    width: 2000, height: 50,
	    textAlign: 'right'
	}));
	
	win.add(scrollView);
	
	var messageView = Ti.UI.createView({
		backgroundColor:'black',
		bottom:0,
		height:80 
	});
	
	var message1 = Ti.UI.createLabel({
		font:{fontSize:14,fontFamily:'Helvetica Neue'},
		color:'yellow',
		width:Ti.UI.SIZE,
		height:Ti.UI.SIZE,
	    top:5
	});
	var message2 = Ti.UI.createLabel({
		font:{fontSize:14,fontFamily:'Helvetica Neue'},
		color:'yellow',
		width:Ti.UI.SIZE,
		height:Ti.UI.SIZE,
	    bottom:5
	});
	messageView.add(message1);
	message1.hide();
	messageView.add(message2);
	message2.hide();
	win.add(messageView);
	
	var event1 = 'dragStart';
	var event2 = 'dragEnd';
	if (Ti.version >= '3.0.0') {
		event1 = 'dragstart';
		event2 = 'dragend';
	}

	scrollView.addEventListener(event1, function(e) {
	    Ti.API.info('Drag started');
	    message1.text = "Drag Started!";
	    message1.show();
	    setTimeout(function(){message1.hide();},1000);
	});
	scrollView.addEventListener(event2, function(e) {
	    Ti.API.info(e.type+' detected! Decelerating? ' + (e.decelerate ? 'Yes' : 'No'));
	    message2.text = e.type+" detected! Decelerating :" + (e.decelerate ? 'Yes' : 'No');
	    message2.show();
	    setTimeout(function(){message2.hide();},1000);
	    
	});

	return win;
};

module.exports = scroll_view_drag;