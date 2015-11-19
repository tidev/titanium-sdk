// Test of the Tizen messaging (email) functionality (email viewing).
//
// Tizen only.

function showMessage(args) {
	var win = Ti.UI.createWindow({
			title: 'Email detail'
		}),

		// Message data UI
		subjectLbl = Ti.UI.createLabel({
			text: 'Subject:',
			top: 10,
			left: 5,
			width: 85
		}),
		subjectValueLbl = Ti.UI.createLabel({
			top: 10,
			left: 90
		}),
		fromLbl = Ti.UI.createLabel({
			text: 'From:',
			top: 40,
			left: 5,
			width: 85
		}),
		fromValueLbl = Ti.UI.createLabel({
			top: 40,
			left: 90
		}),
		bodyLbl = Ti.UI.createLabel({
			text: 'Plain body:',
			top: 70,
			left: 5,
			width: 85
		}),
		bodyValueLbl = Ti.UI.createLabel({
			top: 70,
			left: 90,
			width: 200
		}),

		emailService = args.emailService,
		message = args.message,
		folderName = args.folderName;

	// Show message details
	function setMessageDetail(message) {
		Ti.API.info('Start init message detail');

		subjectValueLbl.text = message.subject;
		bodyValueLbl.text = message.body.plainBody;

		if (folderName === 'Sent Mail') {
			fromLbl.text = 'To';
			fromValueLbl.text = message.to[0];
		} else {
			fromValueLbl.text = message.from;
		}
	}

	// Load message body if it's not loaded yet
	if (!message.body.loaded) {
		Ti.API.info('Start to load message body.');

		try {
			emailService.loadMessageBody(message, function (response) {
				if (response.success) {
					setMessageDetail(response.message);
				} else {
					var error = response.error;
					Ti.API.error('Cannot load message body: ' + error);
					Ti.UI.createAlertDialog({
						message: error,
						title: 'Cannot load message body',
						ok: 'Ok'
					}).show();
				}
			});
		} catch (exc) {
			Ti.API.info('Exception has been thrown.');
			Ti.API.info('Cannot load message body: ' + exc.message);
			Ti.UI.createAlertDialog({
				message: exc.message,
				title: 'Cannot load message body: ',
				ok: 'Ok'
			}).show();
		}
	} else {
		setMessageDetail(message);
	}

	win.add(subjectLbl);
	win.add(subjectValueLbl);
	win.add(fromLbl);
	win.add(fromValueLbl);
	win.add(bodyLbl);
	win.add(bodyValueLbl);

	return win;
}

module.exports = showMessage;