var activity = Ti.Android.currentActivity;
var win = Ti.UI.currentWindow;

win.backgroundColor = 'white';

var b1 = Ti.UI.createButton({
	title : 'Open Window',
	height : 'auto',
	width : 'auto'
});

// Here is an example of creating the menu handlers in the window creation options.
b1.addEventListener('click', function(e) {
	var w = Ti.UI.createWindow({
		backgroundColor : 'blue',
		navBarHidden : false,
		activity : {
			onCreateOptionsMenu : function(e) {
				var menu = e.menu;
				
				var m1 = menu.add({ title : 'Close Window' });
				m1.setIcon(Titanium.Android.R.drawable.ic_menu_close_clear_cancel);
				m1.addEventListener('click', function(e) {
					w.close();
				});
			}
		}
	});
	
	var l = Ti.UI.createLabel({
		backgroundColor : 'white', color : 'black',
		width : 'auto', height : 'auto',
		text : 'Press the menu button, then select Close Window. You should see a graphic w/ the menu text.'
	});
	w.add(l);
	
	w.open({ animated : true});
});

win.add(b1);
