// Test of the Tizen messaging (SMS) functionality (SMS history enumeration, entry viewing,
// and entry removal).
//
// Tizen only.

function smsHistory() {
	var win = Ti.UI.createWindow({
			title: 'sms history'
		}),
		Tizen = require('tizen'),
		serviceType = 'messaging.sms';

	function serviceListCB(response) {
		if (response.success) {
			var services = response.services;
			Ti.API.info(services.length + ' service(s) found.');

			// SuccessCallback funciton for findMessages
			function messagesListCB(response) {
				if (response.success) {
					var INBOX = 1;

					// Table view that will show the message history summary.
					var tableView = Ti.UI.createTableView({
							headerTitle: 'Click to delete.',
							rowHeight: 25
						}),
						i = 0,
						messagesList = response.messages,
						messageCount = messagesList.length,
						emptyHistoryLbl = Ti.UI.createLabel({
							text: 'History is empty. Add some messages first.',
							top: 25,
							left: 5
						});

					Ti.API.info(messageCount + ' message(s) found.');

					function removeMessage(item) {
						Ti.API.info('Start to remove sms.');

						// Success callback function for removeMessages
						function messagesRemovedCB(response) {
							if (response.success) {
								Ti.API.info('Message successfully removed.');

								// delete message from tableview (from list)
								tableView.deleteRow(item.index);
								messagesList.splice(item.index, 1);

								if (messageCount === 0) {
									win.remove(tableView);
									win.add(emptyHistoryLbl);
								}
							} else {
								errorCB({
									message: response.error
								});
							}
						}

						if (item.rowData.title) {
							// Remove array of messages
							try {
								smsService.messageStorage.removeMessages([messagesList[item.index]], messagesRemovedCB);
							} catch (exc) {
								Ti.API.info('Exception has been thrown.');
								errorCB(exc);
							}
						}
					}

					// Populate the table view with message history data.
					if (messageCount > 0) {
						var box = ['INBOX', 'OUTBOX', 'DRAFTS', 'SENTBOX'];

						win.add(tableView);
						tableView.addEventListener('click', removeMessage);

						for (; i < messageCount; i++) {
							var row = Ti.UI.createTableViewRow(),
								inFolder = 'In ' + box[messagesList[i].folderId - 1];

							if (messagesList[i].folderId === INBOX) {
								row.title = messagesList[i].from + '  (' + inFolder + ')';
							} else {
								row.title = messagesList[i].to[0] + '  (' + inFolder + ')';
							}

							// Add message to tableview 
							tableView.appendRow(row);
						}
					} else {
						win.add(emptyHistoryLbl);
					}
				} else {
					errorCB({
						message: response.error
					});
				}
			}

			// Initiate message history population (start message search).
			if (services.length > 0) {
				var smsService = services[0],
					attributeFilter = Tizen.createAttributeFilter({
						attributeName: 'type',
						matchFlag: 'EXACTLY',
						matchValue: serviceType
					});

				// Search for messages by filter
				smsService.messageStorage.findMessages(attributeFilter, messagesListCB);
			} else {
				Ti.API.info('Exception has been thrown.');

				errorCB({message: 'Services list is empty.'});
			}
		} else {
			errorCB({
				message: response.error
			});
		}
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

	Tizen.Messaging.getMessageServices(serviceType, serviceListCB);

	return win;
}

module.exports = smsHistory;