var iosDevice = require('../ios-device');

iosDevice.devices(function (err, devices) {
	if (err) {
		console.error(err.toString());
		process.exit(1);
	}

	console.log(devices);

	devices.forEach(function (device) {
		iosDevice.log(device.udid, function (msg) {
			console.log(msg);
		});
	});
});
