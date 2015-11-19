function tizen_alarm() {
	var win = Titanium.UI.createWindow(),
	    labelNotification = Titanium.UI.createLabel({
			top: 15,
			text: 'enter message'
		}),
		titleInput = Ti.UI.createTextField({
			top: 45,
			left: 10,
			width: '60%',
			height: 30,
			borderStyle: Ti.UI.INPUT_BORDERSTYLE_ROUNDED
		}),
		postButton = Ti.UI.createButton({
			top: 45,
			left: '70%',
			width: '25%',
			height: 30,
			title: 'post'
		}),
		removeButton = Ti.UI.createButton({
			left: 10,
			width: '60%',
			top: 95,
			title: 'Remove all notifications'
		}),
		Tizen = require('tizen');

	removeButton.addEventListener('click', function() {
		Tizen.Notification.removeAll();

		Ti.UI.createAlertDialog({
			title: 'Info',
			message: 'All notifications removed successfully'
		}).show();
	});

	postButton.addEventListener('click', createNotification);

	function createNotification() {
		var appControl = Tizen.Apps.createApplicationControl({
			operation: 'http://tizen.org/appcontrol/operation/create_content',
			uri: null
		}),
		// Notifications init parameters
		notificationDict = {
			content: titleInput.value,
			vibration: true, 
			appControl: appControl
		},
		// Create and post notification
		notification = Tizen.Notification.createStatusNotification({
			statusType: Tizen.Notification.STATUS_NOTIFICATION_TYPE_SIMPLE,
			title: 'Simple notification',
			notificationInitDict: notificationDict
		});

		Tizen.Notification.postNotification(notification);
		titleInput.value = '';
	}

	win.add(removeButton);
	win.add(labelNotification);
	win.add(titleInput);
	win.add(postButton);

	return win;
}

module.exports = tizen_alarm;