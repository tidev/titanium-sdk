function checkForJSCode() {
	var code = TiApp.getJSCode();
	if ( code != undefined) {
		// Force this to be a string, since this does not evaluate in the 2.2 emulator correctly.
		eval(code + "");
	} else {
		clearInterval(refreshIntervalId);
	}
}

var refreshIntervalId = setInterval(checkForJSCode, 250);