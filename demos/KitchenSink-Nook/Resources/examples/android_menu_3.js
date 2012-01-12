var activity = Ti.Android.currentActivity;
var win = Ti.UI.currentWindow;

win.backgroundColor = 'white';

var b1 = Ti.UI.createButton({
	title : 'Open Window',
	height : 'auto',
	width : 'auto'
});

// Here is an example of creating the menu handlers after window creation but before open.
b1.addEventListener('click', function(e) {
	var w = Ti.UI.createWindow({
		backgroundColor : 'blue',
		navBarHidden : false
	});

	w.activity.onCreateOptionsMenu = function(e) {
		var menu = e.menu;
		
		var m1 = menu.add({ title : 'Close Window' });
		m1.addEventListener('click', function(e) {
			w.close();
		});
	};
	
	w.activity.onPrepareOptionsMenu = function(e) {
		var menu = e.menu;
		
		var mi = menu.findItem(2);
		if (mi == null) {
			mi = menu.add({
				itemId : 2,
				order : 1,
				title : 'Toast'
			});
			mi.addEventListener('click', function(e) {
				Ti.UI.createNotification({ message : "To you and yours." }).show();
			});
		}
	};
	
	var l = Ti.UI.createLabel({
		backgroundColor : 'white', color : 'black',
		width : 'auto', height : 'auto',
		text : 'Press the menu button, then select Close Window'
	});
	w.add(l);
	
	w.open({ animated : true});
});

win.add(b1);
