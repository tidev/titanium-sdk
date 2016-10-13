var iosDevice = require('../ios-device');

iosDevice
	.trackDevices()
	.on('devices', console.log)
	.on('error', function (err) {
		console.error(err.toString());
	});
