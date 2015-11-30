// Test of the Tizen messaging (email) functionality (email sending).
//
// Tizen only.

function emailSend() {
	var win = Ti.UI.createWindow({
			title: 'Send email'
		}),

		// Email composition UI
		emailLabel = Ti.UI.createLabel({
			text: 'Email:',
			left: 5,
			top: 10
		}),
		emailField = Ti.UI.createTextField({
			borderStyle: Ti.UI.INPUT_BORDERSTYLE_ROUNDED,
			keyboardType: Ti.UI.KEYBOARD_EMAIL,
			top: 10,
			left: 150,
			width: 150,
			height: 25
		}),
		subjectLabel = Ti.UI.createLabel({
			text: 'Subject:',
			left: 5,
			top: 50
		}),
		subjectField = Ti.UI.createTextField({
			borderStyle: Ti.UI.INPUT_BORDERSTYLE_ROUNDED,
			keyboardType: Ti.UI.KEYBOARD_DEFAULT,
			top: 50,
			left: 150,
			width: 150,
			height: 25
		}),
		textLabel = Ti.UI.createLabel({
			text: 'Plain body:',
			left: 5,
			top: 90
		}),
		textArea = Ti.UI.createTextArea({
			top: 90,
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
		sendEmailBtn = Titanium.UI.createButton({
			title: 'Send',
			top: 170,
			left: 5
		}),
		addDraftEmailBtn = Titanium.UI.createButton({
			title: 'Add draft',
			top: 170,
			left: 70
		}),
		serviceType = 'messaging.email',
		Tizen = require('tizen'),
		emailService;

	// Initialize email service
	function initEmailService(callBack) {
		Ti.API.info('Start search email service.');

		Tizen.Messaging.getMessageServices(serviceType, function (response) {
			if (response.success) {
				var services = response.services;
				Ti.API.info(services.length + ' service(s) found.');

				if (services.length === 0) {
					Ti.API.info('The following error occurred: Services list is empty.');
					Ti.UI.createAlertDialog({
						message: 'Services not found!',
						title: 'The following error occurred: ',
						ok: 'Ok'
					}).show();
					return;
				}

				services[0] && (emailService = services[0]);
				callBack && callBack();
			} else {
				errorCB({
					message: response.error
				});
			}
		});
	}

	// Verify if email message data entered by user is valid.
	function checkMessageData() {
		if (emailField.value === '') {
			Ti.API.info('The following error occurred: Recipients list is empty.');
			Ti.UI.createAlertDialog({
				message: 'Recipients list is empty',
				title: 'The following error occurred: ',
				ok: 'Ok'
			}).show();
			return false;
		} else if (textArea.value === '') {
			Ti.API.info('The following error occurred: Message body is empty.');
			Ti.UI.createAlertDialog({
				message: 'Message body is empty',
				title: 'The following error occurred: ',
				ok: 'Ok'
			}).show();
			return false;
		}
		return true;
	}

	// Message sending error callback.
	function errorCB(error) {
		Ti.API.info('The following error occurred: ' + error.message);
		Ti.UI.createAlertDialog({
			message: error.message,
			title: 'The following error occurred: ',
			ok: 'Ok'
		}).show();
	}

	// Create a draft email message for test/demo purposes.
	addDraftEmailBtn.addEventListener('click', function() {
		function addDraftMessage() {
			function draftMessageAdded(response) {
				if (response.success) {
					Ti.API.info('Draft message saved successfully');
					Ti.UI.createAlertDialog({
						title: 'Info',
						message: 'Draft message saved successfully',
						ok: 'Ok'
					}).show();

					// Clear message data
					emailField.value = textArea.value = subjectField.value = '';
				} else {
					errorCB({
						message: response.error
					});
				}
			}

			try {
				Ti.API.info('Start addding draft email message.');

				var msg = Tizen.Messaging.createMessage({
					type: serviceType,
					messageInitDict: {
						subject: subjectField.value,
						plainBody: textArea.value,
						to: [emailField.value]
					}
				});

				// Add new draft email message
				checkMessageData() && emailService.messageStorage.addDraftMessage(msg, draftMessageAdded);
			} catch (exc){
				Ti.API.info('Exception has been thrown when called addDraftMessage.');

				errorCB(exc);
			}
		}

		initEmailService(addDraftMessage);
	});

	// Send the email entered in the UI fields.
	sendEmailBtn.addEventListener('click', function() {
		function sendNewEmail() {
			function emailSentCB(response) {
				if (response.success) {
					var recipients = response.recipients,
						recipientsCount = recipients.length;

					Ti.API.info('Email sent successfully to ' + recipientsCount + ' recipient(s).');
					Ti.UI.createAlertDialog({
						title: 'Info',
						message: 'Email sent successfully to ' + recipientsCount + ' recipients.',
						ok: 'Ok'
					}).show();

					// Clear message data
					emailField.value = subjectField.value = textArea.value = '';
				} else {
					errorCB({
						'message': response.error
					});
				}
			}

			try {
				Ti.API.info('Start to add new email message.');

				var msg = Tizen.Messaging.createMessage({
					type: serviceType,
					messageInitDict: {
						subject: subjectField.value,
						plainBody: textArea.value,
						to: [emailField.value]
					}
				});

				// Add new email message
				checkMessageData() && emailService.sendMessage(msg, emailSentCB);
			} catch (exc){
				Ti.API.info('Exception has been thrown when called sendMessage.');

				errorCB(exc);
			}
		}

		initEmailService(sendNewEmail);
	});

	win.add(emailLabel);
	win.add(textLabel);
	win.add(subjectLabel);
	win.add(subjectField);
	win.add(emailField);
	win.add(textArea);
	win.add(sendEmailBtn);
	win.add(addDraftEmailBtn);

	return win;
}

module.exports = emailSend;