(function (w) {
	var a, b,
		p = w.parent,
		u = w.onunload;

	if (p && typeof Ti == 'undefined' && typeof p.Ti == 'object') {
		a = p.Ti.API;
		b = p.Ti.App;
		w.Ti = w.Titanium = {
			API: {
				log: a.log,
				debug: a.debug,
				error: a.error,
				info: a.info,
				warn: a.warn
			},
			App: {
				addEventListener: b.addEventListener.bind(b),
				removeEventListener: b.removeEventListener.bind(b),
				fireEvent: b.fireEvent.bind(b)
			}
		};
	}

	w.onunload = function () {
		Ti.App.fireEvent("WEBVIEW_ID");
		u && u();
	};
}(window));