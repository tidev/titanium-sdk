// Tests for Tizen's bluetooth functionality:
// - enable/disable adapter;
// - set broadcast adapter name;
// - enumerate nearby devices;
// - bond with a device.

function tizenBluetooth(title) {
	var btAdapter = require('tizen').Bluetooth.getDefaultAdapter(),

	// creating UI elements 
		win = Ti.UI.createWindow({
			backgroundColor: '#fff'
		}),
		self = Ti.UI.createView({}),
		infoLabel = Ti.UI.createLabel({
			backgroundColor: 'gray',
			width: Ti.UI.FILL,
			height: 50,
			top: 0
		}),
		adapterInfoLabel = Ti.UI.createLabel({
			width: Ti.UI.FILL,
			top: 290,
			text: formatAdapterInfoLabelText()
		}),
		btSwitch = Ti.UI.createSwitch({
			top: 70,
			titleOn: 'Bluetooth enabled',
			titleOff: 'Bluetooth disabled',
			value: btAdapter.powered
		}),
		setNameButton = Ti.UI.createButton({
			top: 120,
			enabled: btAdapter.powered,
			title: 'Set new name for Bluetooth adapter'
		}),
		getKnownDevicesButton = Ti.UI.createButton({
			top: 170,
			enabled: btAdapter.powered,
			title: 'Show known bluetooth devices devices'
		}),
		searchButton = Ti.UI.createButton({
			top: 220,
			enabled: btAdapter.powered,
			title: 'Search for nearby bluetooth devices'
		});

	// Enable/disable BT adapter.
	btSwitch.addEventListener('change', function(e) {
		if (btAdapter.powered != btSwitch.value) {
			// initiate power switching
			btAdapter.setPowered(btSwitch.value, function(response) {
				if (response.success) {
					//enable buttons only when adapter is powered
					btSwitch.enabled = true;
					searchButton.enabled = btAdapter.powered;
					setNameButton.enabled = btAdapter.powered;
					getKnownDevicesButton.enabled = btAdapter.powered;
					adapterInfoLabel.text = formatAdapterInfoLabelText();

					setInfoLabelText('Bluetooth powered ' + (btSwitch.value ? 'on' : 'off') + ' success.');
				} else {
					btSwitch.enabled = true;
					setInfoLabelText('Failed to power on Bluetooth: ' + e.message + '(' + e.name + ')');
				}
			});
		}
		btSwitch.enabled = false;
	});

	// Asks user (via input box) for a new name for the Bluetooth adapter.
	setNameButton.addEventListener('click', function(e) {
		var newAdapterNameText = Ti.UI.createTextField({
				width: Ti.UI.FILL
			}),
			dialog = Ti.UI.createOptionDialog({
				cancel: 0,
				destructive: 1,
				title: 'Enter new adapter name',
				tizenView: newAdapterNameText,
				options: ['Cancel', 'Set new name']
			});

		// set focus to editBox to show keyboard.
		newAdapterNameText.addEventListener('postlayout', function() {
			newAdapterNameText.focus()
		});

		dialog.addEventListener('click', function(e) {
			if ((e.index == 1) && (btAdapter.name != newAdapterNameText.value)) {
				// initiate change name
				btAdapter.setName(newAdapterNameText.value,
					function(response) {
						if (response.success) {
							setInfoLabelText('Adapter name changed to ' + btAdapter.name);
							adapterInfoLabel.text = formatAdapterInfoLabelText();
						} else {
							setInfoLabelText('Failed to change name: ' + response.error);
							adapterInfoLabel.text = formatAdapterInfoLabelText();
						}
					});
			}
			// blurring the text box helps to hide the onscreen keyboard  
			newAdapterNameText.blur();
		});
		dialog.show();
	});

	// UI helper
	function formatAdapterInfoLabelText() {
		return 'adapter name: ' + btAdapter.name + '\ndevice address: ' + btAdapter.address + '\n' + (btAdapter.visible ? 'Device is visible to other devices' : 'Device is invisible. Please check device options.');
	}

	// Format bluetooth device information for TableView row.
	function formatTableViewItemTitle(deviceInfo) {
		return '<b>Name: ' + deviceInfo.name + '</b>\n Address: ' + deviceInfo.address + (deviceInfo.isBonded ? ' (bonded)' : ' (not bonded)');
	}

	// Set text to infoLabel for 7.5 seconds.
	function setInfoLabelText(textMessage) {
		Ti.API.info(textMessage);
		infoLabel.text = textMessage;

		// we are cleaning up label in 7.5sec
		if (infoLabel.cleanupTimeoutId) {
			clearTimeout(infoLabel.cleanupTimeoutId);
		}
		infoLabel.cleanupTimeoutId = setTimeout(function() {
			infoLabel.text = ''
		}, 7500);
	}

	// Formats BlueTooth device information for TableView row.
	function deviceInfoToTableViewItem(deviceInfo) {
		// we are not assigning deviceInfo object directly to row data, 
		// as deviceInfo's properties are readonly. This will limit functionality.  
		return {
			title: formatTableViewItemTitle(deviceInfo),
			deviceInfo: {
				address: deviceInfo.address,
				isBonded: deviceInfo.isBonded,
				name: deviceInfo.name
			}
		}
	};

	// Changes the "isBonded" status of the clicked item.
	// If device was bonded, try to undbond it.
	function onTableViewItemClick(e) {
		// Each item in tableView has "rowData.deviceInfo" with information about corrsponding bluetooth device 
		var dInfo = e.rowData.deviceInfo;

		if (dInfo && dInfo.address) {
			if (dInfo.isBonded) {
				btAdapter.destroyBonding(dInfo.address);
				// we need manually update "isBonded" flag, as destroyBonding() has no any callbacks to check result  
				dInfo.isBonded = false;
				e.row.title = formatTableViewItemTitle(dInfo);
			} else {
				function onBondingSuccessCallback(device) {
					setInfoLabelText('A bonding is created ? name: ' + device.name);
					di = deviceInfoToTableViewItem(device);
					e.rowData.deviceInfo = di.deviceInfo;
					e.row.title = di.title;
				}

				function onBondingErrorCallback(e) {
					setInfoLabelText('Cannot create a bonding, reason: ' + e);
				}

				btAdapter.createBonding(dInfo.address, function(response) {
						if (response.success) {
							onBondingSuccessCallback(response.device);
						} else {
							onBondingErrorCallback(response.error)
						}
					});
			}
		}
	};

	// Show in a tableView all "known" BlueTooth devices (all bonded devices).
	getKnownDevicesButton.addEventListener('click', function(e) {
		btAdapter.getKnownDevices(function(response) {
			if (response.success) {
				var data = [];
				for (var i = 0; i < response.devices.length; i++) {
					data.push(deviceInfoToTableViewItem(response.devices[i]));
				}

				// we are using OptionDialog with custom "tizenView" as modal popup window.
				var knownAdapterlist = Titanium.UI.createTableView({
						height: 350,
						data: data
					}),
					dialog = Ti.UI.createOptionDialog({
						cancel: 0,
						title: 'List of known devices \n click on adapter to unbond',
						tizenView: knownAdapterlist,
						options: ['OK']
					});
				knownAdapterlist.addEventListener('click', onTableViewItemClick);

				dialog.show();
			} else {
				setInfoLabelText('Failed to get known devices: ' + e.message + '(' + e.name + ')');
			}
		});
	});

	// Functionality of the event handler allows to search devices.
	// Results are shown in tableView.
	searchButton.addEventListener('click', function(e) {
		var itemsList = {},
			tizenView = Titanium.UI.createView({
				width: Ti.UI.FILL,
				height: 400
			}),
			visibleDevices = Titanium.UI.createTableView({
				width: Ti.UI.FILL,
				height: 350,
				top: 50,
				data: []
			}),
			stopSearchButton = Titanium.UI.createButton({
				height: 50,
				top: 0,
				title: 'Stop searhing BT devices.'
			});

		tizenView.add(stopSearchButton);
		tizenView.add(visibleDevices);

		// we are using OptionDialog with custom "tizenView" as modal popup window.
		var dialog = Ti.UI.createOptionDialog({
			cancel: 1,
			title: 'List of visible devices',
			tizenView: tizenView,
			options: ['Close']
		});

		// we adding click handler to table view when device searching process is finished.
		function setTableViewClickHandler() {
			dialog.title = 'List of visible devices \n click on adapter to bond it';
			// now we can hide button as device searching is finished. 
			stopSearchButton.hide();
			visibleDevices.top = 0;
			visibleDevices.addEventListener('click', onTableViewItemClick);
		}

		stopSearchButton.addEventListener('click', function(e) {
			stopSearchButton.enabled = false;

			btAdapter.stopDiscovery(function(response) {
				if (response.success) {
					setInfoLabelText('Stop discovery success.');
					setTableViewClickHandler();
				} else {
					setInfoLabelText('Error while stopDiscovery:' + response.error);
					setTableViewClickHandler();
				}
			});
		});

		// recreates all items in tableView from itemsList as a source
		function updateList() {
			var newData = [];
			for (deviceName in itemsList) {
				newData.push(deviceInfoToTableViewItem(itemsList[deviceName]));
			};
			visibleDevices.setData(newData);
		};

		dialog.show();

		// object with callbacks for startDiscovery() method
		btAdapter.removeEventListener('discoverystarted');
		btAdapter.addEventListener('discoverystarted', function() {
			Ti.API.info('discoverystarted');
			setInfoLabelText('Device discovery started...');
		});

		btAdapter.removeEventListener('devicefound');
		btAdapter.addEventListener('devicefound', function(event) {
			Ti.API.info('devicefound');
			setInfoLabelText('Found device: ' + event.device.name);
			itemsList[event.device.address] = {
				name: event.device.name,
				address: event.device.address,
				isBonded: event.device.isBonded
			}
			updateList();
		});

		btAdapter.removeEventListener('devicedisappeared');
		btAdapter.addEventListener('devicedisappeared', function(event) {
			Ti.API.info('devicedisappeared');
			setInfoLabelText('Device disappeared: ' + event.address);
			itemsList[event.address] = undefined;
			updateList();
		});

		btAdapter.removeEventListener('discoveryfinished');
		btAdapter.addEventListener('discoveryfinished', function(event) {
			Ti.API.info('discoveryfinished');
			setTableViewClickHandler();
			setInfoLabelText('Found ' + event.devices.length + ' device' + (event.devices.length == 1 ? '' : 's'));
			itemsList = {};
			for (var i = 0; i < event.devices.length; i++) {
				itemsList[event.devices[i].address] = {
					name: event.devices[i].name,
					address: event.devices[i].address,
					isBonded: event.devices[i].isBonded
				}
			}
			updateList();
		});

		btAdapter.removeEventListener('discoveryerror');
		btAdapter.addEventListener('discoveryerror', function(event) {
			Ti.API.info('discoveryerror');
			setInfoLabelText('Failed to search devices: ' + event.error);
		});
	});

	win.add(self);
	self.add(infoLabel);
	self.add(adapterInfoLabel);
	self.add(btSwitch);
	self.add(getKnownDevicesButton);
	self.add(setNameButton);
	self.add(searchButton);

	return win;
};

module.exports = tizenBluetooth;