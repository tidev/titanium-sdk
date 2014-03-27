(function (global) {
	/**
	 * alert shim
	 */
	var alertShowing = 0;
	global.alert = function (msg) {
		if (alertShowing) {
			console.warn('Cannot show more than one alert at a time');
			console.info(msg);
		} else {
			alertShowing = 1;
			new Windows.UI.Popups.MessageDialog(msg).showAsync().done(function () {
				alertShowing = 0;
			});
		}
	};
}(window));
