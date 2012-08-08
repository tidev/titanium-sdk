var win = Titanium.UI.currentWindow;

var scrollView = Ti.UI.createScrollView({
    width: 320, 
    height: 480,
    contentWidth: 2000,
    backgroundColor:'white',
    
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
	width:'auto',
	height:'auto',
    top:5
});
var message2 = Ti.UI.createLabel({
	font:{fontSize:14,fontFamily:'Helvetica Neue'},
	color:'yellow',
	width:'auto',
	height:'auto',
    bottom:5
});
messageView.add(message1);
message1.hide();
messageView.add(message2);
message2.hide();
win.add(messageView);

scrollView.addEventListener('dragStart', function(e) {
    Ti.API.info('Drag started');
    message1.text = "Drag Started!";
    message1.show();
    setTimeout(function(){message1.hide();},1000);
});
scrollView.addEventListener('dragEnd', function(e) {
    Ti.API.info('Drag End detected! Decelerating? ' + (e.decelerate ? 'Yes' : 'No'));
    message2.text = "Drag End detected! Decelerating :" + (e.decelerate ? 'Yes' : 'No');
    message2.show();
    setTimeout(function(){message2.hide();},1000);
    
});

