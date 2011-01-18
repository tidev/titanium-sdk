var win = Ti.UI.currentWindow;

setTimeout(function() {
	var absolute = Ti.UI.createWindow({
		url: '/absolute.js'
	});
	absolute.addEventListener("close", function(e) {
		win.close();
	});
	absolute.open();
}, 500);