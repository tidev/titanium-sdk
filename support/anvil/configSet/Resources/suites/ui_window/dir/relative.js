var win = Ti.UI.currentWindow;
win.title = "relativeWindow";
setTimeout(function() {
	var relative = Ti.UI.createWindow({
		url: 'dir/relative.js'
	});
	relative.addEventListener("close", function(e) {
		win.backgroundColor="blue";
		win.close();
	});
	relative.open();
}, 500);