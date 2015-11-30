function listeners() {
	var win = Ti.UI.createWindow({
			title: 'Call history listeners'
		}),
		addListenerBtn = Ti.UI.createButton({
			title: 'Add listeners',
			top: 20,
			left: 5
		}),
		removeListenerBtn = Ti.UI.createButton({
			title: 'Remove listeners',
			top: 60,
			left: 5
		}),
		tableView = Ti.UI.createTableView({
			headerTitle: 'Call list (make a call)',
			backgroundColor: 'transparent',
			rowBackgroundColor: 'white',
			rowHeight: 20,
			top: 110
		}),
		Tizen = require('tizen');

	function onItemsAdded (e) {
		var i = 0,
			items = e.items,
			itemsCount = items.length;
		Ti.API.info('New Items have been added.');
		for (; i < itemsCount; i++) {
			Ti.API.info(items[i].remoteParties[0].remoteParty + ': ' + items[i].startTime);

			tableView.appendRow({ title: items[i].remoteParties[0].remoteParty + ': ' + items[i].startTime });
		}
	}

	function onItemsChanged (e) {
		var i = 0,
			items = e.items,
			itemsCount = items.length;

		Ti.API.info('Items changed');

		for (; i < itemsCount; i++) {
			Ti.API.info(items[i].remoteParties[0].remoteParty + ': ' + items[i].direction);

			tableView.appendRow({ title: items[i].remoteParties[0].remoteParty + ': ' + items[i].direction });
		}
	}

		addListenerBtn.addEventListener('click', function () {
			var alertDialog = Ti.UI.createAlertDialog({
					ok: 'Ok'
				});

			try {
				// Register a call history callback
				Tizen.CallHistory.addEventListener('itemsadded', onItemsAdded);
				Tizen.CallHistory.addEventListener('itemschanged', onItemsChanged);

				addListenerBtn.enabled = false;

				alertDialog.message = 'Listener added';
				alertDialog.show();

				removeListenerBtn.addEventListener('click', function () {
					try {
						// Unregister a previously registered listener
						Tizen.CallHistory.removeEventListener('itemsadded', onItemsAdded);
						Tizen.CallHistory.removeEventListener('itemschanged', onItemsChanged);
						win.remove(removeListenerBtn);

						alertDialog.message = 'Listener removed';
						alertDialog.show();
					} catch (removeExc) {
						alertDialog.title = 'The following error occurred: ';
						alertDialog.message = 'Exception - code: ' + removeExc.name + ' message: ' + removeExc.message;
						alertDialog.show();
					}
					addListenerBtn.enabled = true;
					removeListenerBtn.removeEventListener('click');
				});

				win.add(tableView);
				win.add(removeListenerBtn);
			} catch (error) {
				alertDialog.title = 'The following error occurred: ';
				alertDialog.message = 'Exception - code: ' + error.name + ' message: ' + error.message;
				alertDialog.show();

				Ti.API.info('Exception - code: ' + error.name + ' message: ' + error.message);
			}
		});

	win.add(addListenerBtn);

	return win;
}

module.exports = listeners;