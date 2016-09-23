var iosDevice = require('../ios-device');

iosDevice.devices(function (err, devices) {
	if (err) {
		console.error(err.toString());
		process.exit(1);
	}

	console.log(devices);
	console.log('=====================================================');

	devices.forEach(function (device) {
		iosDevice.log(device.udid, function (msg) {
			console.log('[' + device.udid + ']  ' + msg);
		});
	});
});
