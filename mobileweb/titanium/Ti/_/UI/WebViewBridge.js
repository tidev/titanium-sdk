var a, b,
	w = window,
	p = w.parent,
	u = w.onunload;

if(p && p.Ti){
	a = p.Ti.API;
	b = p.Ti.App;
	Ti = {
		API: {
			log: a.log,
			debug: a.debug,
			error: a.error,
			info: a.info,
			warn: a.warn
		},
		App: {
			addEventListener: b.addEventListener,
			removeEventListener: b.removeEventListener,
			fireEvent: b.fireEvent
		}
	};
}

w.onunload = function() {
	Ti.App.fireEvent("WEBVIEW_ID");
	u && u();
};