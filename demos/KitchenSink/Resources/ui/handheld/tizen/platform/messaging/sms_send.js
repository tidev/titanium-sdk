// Test of the Tizen messaging (SMS) functionality (SMS sending).
//
// Tizen only.

function smsSend() {
	var win = Ti.UI.createWindow({
			title: 'Send new sms'
		}),

		// SMS sending UI
		numberLabel = Ti.UI.createLabel({
			text: 'Phone number',
			left: 5,
			top: 10
		}),
		textField = Ti.UI.createTextField({
			borderStyle: Ti.UI.INPUT_BORDERSTYLE_ROUNDED,
			keyboardType: Ti.UI.KEYBOARD_NUMBER_PAD,
			top: 10,
			left: 150,
			width: 150,
			height: 25
		}),
		textLabel = Ti.UI.createLabel({
			text: 'Message body',
			left: 5,
			top: 50
		}),
		textArea = Ti.UI.createTextArea({
			top: 50,
			left: 150,
			borderWidth: 1,
			borderColor: '#000000',
			borderRadius: 5,
			color: '#888',
			font: {
				fontSize: 20,
				fontWeight: 'bold'
			},
			keyboardType: Ti.UI.KEYBOARD_NUMBERS_PUNCTUATION,
			returnKeyType: Ti.UI.RETURNKEY_GO,
			textAlign: 'left',
			width: 150,
			height : 70
		}),
		sendSMSBtn = Titanium.UI.createButton({
			title: 'Send',
			top: 130,
			left: 5
		}),
		addDraftSMSBtn = Titanium.UI.createButton({
			title: 'Add draft',
			top: 130,
			left: 70
		}),
		serviceType = 'messaging.sms',
		Tizen = require('tizen'),
		smsService;

	// Initialize smsservice (the Tizen object that offers access to messaging functionality)
	function initSmsService(callBack) {
		function servicesListCB(response) {
			if (response.success) {
				var services = response.services,
					servicesCount = services.length;

				Ti.API.info(servicesCount + ' service(s) found.');

				if (servicesCount === 0) {
					Ti.API.info('The following error occurred: services list is empty.');
					Ti.UI.createAlertDialog({
						message: 'Services not found!',
						title: 'The following error occurred: ',
						ok: 'Ok'
					}).show();
					return;
				}

				services[0] && (smsService = services[0]);
				callBack && callBack();
			} else {
				errorCB({
					message: response.error
				});
			}
		}

		Tizen.Messaging.getMessageServices(serviceType, servicesListCB);
	}

	// Check message data. Tizen function doesn't check it yet .
	function checkMessageData() {
		if (textField.value === '') {
			Ti.API.info('The following error occurred: Recipients list is empty.');
			Ti.UI.createAlertDialog({
				message: 'Recipients list is empty',
				title: 'The following error occurred: ',
				ok: 'Ok'
			}).show();
			return;
		} else if (textArea.value === '') {
			Ti.API.info('The following error occurred: Message body is empty.');
			Ti.UI.createAlertDialog({
				message: 'Message body is empty',
				title: 'The following error occurred: ',
				ok: 'Ok'
			}).show();
			return;
		}

		return true;
	}

	// Callback function for errors
	function errorCB(error) {
		Ti.API.info('The following error occurred: ' + error.message);
		Ti.UI.createAlertDialog({
			message: error.message,
			title: 'The following error occurred: ',
			ok: 'Ok'
		}).show();
	}

	// Add draft SMS for testing/demo purposes
	addDraftSMSBtn.addEventListener('click', function() {
		function addDraftMessage() {
			function draftMessageAdded(response) {
				if (response.success) {
					Ti.API.info('Draft message saved successfully');
					Ti.UI.createAlertDialog({
						title: 'Draft message saved successfully',
						ok: 'Ok'
					}).show();

					textField.value = textArea.value = '';
				} else {
					errorCB({
						message: response.error
					});
				}
			}

			try {
				Ti.API.info('Start to add draft message.');

				var msg = Tizen.Messaging.createMessage({
					type: serviceType,
					messageInitDict: {
						plainBody: textArea.value,
						to: [textField.value]
					}
				});

				checkMessageData() && smsService.messageStorage.addDraftMessage(msg, draftMessageAdded);
			} catch (exc){
				Ti.API.info('Exception has been thrown when try to add draft message');
				errorCB(exc);
			}
		}

		initSmsService(addDraftMessage);
	});

	// Send SMS
	sendSMSBtn.addEventListener('click', function() {
		function sendNewMessage() {
			function messageSentCB (response) {
				if (response.success) {
					var recipients = response.recipients,
						recipientsCount = recipients.length;

					Ti.API.info('Message sent successfully to ' + recipientsCount + ' recipient(s).');
					Ti.UI.createAlertDialog({
						title: 'Info',
						message: 'Message sent successfully to ' + recipientsCount + ' recipients.',
						ok: 'Ok'
					}).show();

					textField.value = textArea.value = '';
				} else {
					errorCB({
						message: response.error
					});
				}
			}

			try {
				Ti.API.info('Start to send message.');

				var msg = Tizen.Messaging.createMessage({
					type: serviceType,
					messageInitDict: {
						plainBody: textArea.value,
						to: [textField.value]
					}
				});

				// Send new SMS
				smsService.sendMessage(msg, messageSentCB);
			} catch (exc){
				Ti.API.info('Exception has been thrown when try to send message');

				errorCB(exc);
			}
		}

		initSmsService(sendNewMessage);
	});

	win.add(numberLabel);
	win.add(textLabel);
	win.add(textField);
	win.add(textArea);
	win.add(sendSMSBtn);
	win.add(addDraftSMSBtn);

	return win;
}

module.exports = smsSend;