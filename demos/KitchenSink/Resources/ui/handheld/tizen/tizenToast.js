//"helper" object. Just to show toast-like messages on tizen
function initToast() {
	var currentCloseTimeout = null,
		toastWin = Titanium.UI.createWindow({
			height: 30,
			width: 250,
			bottom: 40,
			borderRadius: 10,
			touchEnabled: false,
			orientationModes: [
				Titanium.UI.PORTRAIT,
				Titanium.UI.UPSIDE_PORTRAIT,
				Titanium.UI.LANDSCAPE_LEFT,
				Titanium.UI.LANDSCAPE_RIGHT
			]
		}),
		toastView = Titanium.UI.createView({
			height: 30,
			width: 250,
			borderRadius: 10,
			backgroundColor: '#000',
			opacity: 0.7,
			touchEnabled: false
		}),
		toastLabel = Titanium.UI.createLabel({
			text: '',
			color: '#fff',
			width: 250,
			height: 'auto',
			font:{
				fontFamily: 'Helvetica Neue',
				fontSize: 13
			},
			textAlign: 'center'
		});

	toastWin.add(toastView);
	toastWin.add(toastLabel);

	return function(textMessage, closeTimeOut) {
		if (currentCloseTimeout) {
			clearTimeout(currentCloseTimeout);
		} else {
			toastWin.open();
		}

		toastLabel.text = textMessage

		currentCloseTimeout = setTimeout(function() {
			toastWin.close({ opacity: 0, duration: 500 });
			currentCloseTimeout = null;
		}, closeTimeOut || 0);
	}
};

module.exports = {
	showToast: initToast()
};