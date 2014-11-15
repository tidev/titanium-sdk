var iosDevice = require('../ios-device');

iosDevice.devices(function (err, devices) {
	console.log(devices);

	devices.forEach(function (device) {
		iosDevice.log(device.udid, function (msg) {
			console.log(msg);
		});
	});
});
