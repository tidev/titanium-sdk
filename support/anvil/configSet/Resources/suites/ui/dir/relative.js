var win = Ti.UI.currentWindow;

setTimeout(function() {
	var absolute = Ti.UI.createWindow({
		url: '/suites/ui/absolute.js'
	});
	absolute.addEventListener("close", function(e) {
		win.close();
	});
	absolute.open();
}, 500);