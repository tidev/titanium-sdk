var win= Titanium.UI.currentWindow;

var countdown = 5;

var l = Titanium.UI.createLabel({
	text:'Android Notification test in ',
	width:'auto',
	height:'auto',
	font: {
		fontSize:32	
	}
});

win.add(l);

// Create a notification
var n = Ti.UI.createNotification({
	message:"Howdy folks",
	font: {
		fontSize:32	
	}
});
// Set the duration to either Ti.UI.NOTIFICATION_DURATION_LONG or NOTIFICATION_DURATION_SHORT
n.duration = Ti.UI.NOTIFICATION_DURATION_LONG;

// Make it a little bit interesting
var countdownSeconds = setInterval(function() {
	l.visible = false;
	if (countdown > 0) {
		var numLabel = Ti.UI.createLabel({
			text: countdown + '',
			width:'auto',
			height:'auto',
			font: {
				fontSize:256,
				fontWeight:'bold'	
			},
			opacity:1
		});
		win.add(numLabel);
		numLabel.animate({opacity:0, duration:1000});
	}
	countdown--;
	if (countdown < 0) {
		clearInterval(countdownSeconds);
		n.show();
	}
},1000);