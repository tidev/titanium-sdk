function checkForJSCode() {
	var code = TiApp.getJSCode();
	if ( code != undefined) {
		eval(code);
	} else {
		clearInterval(refreshIntervalId);
	}
}

var refreshIntervalId = setInterval(checkForJSCode, 250);