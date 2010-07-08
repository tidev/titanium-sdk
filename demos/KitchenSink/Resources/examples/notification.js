var win= Titanium.UI.currentWindow;

var countdown = 5;

var l = Titanium.UI.createLabel({
	text:'Android Notification test in ',
	width:'auto',
	height:'auto'
});

win.add(l);

// Create a notification
var n = Ti.UI.createNotification({message:"Howdy folks"});
// Set the duration to either Ti.UI.NOTIFICATION_DURATION_LONG or NOTIFICATION_DURATION_SHORT
n.duration = Ti.UI.NOTIFICATION_DURATION_LONG;

// Setup the X & Y Offsets
n.offsetX = 100;
n.offsetY = 75;

// Make it a little bit interesting
var countdownSeconds = setInterval(function() {
	l.text = l.text + countdown+"..";
	countdown = countdown -1;
	if (countdown <0) {
		clearInterval(countdownSeconds);
		n.show();
	}
},1000);