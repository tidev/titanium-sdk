var iosDevice = require('../ios-device');

iosDevice.trackDevices(function (err, devices) {
	if (err) {
		console.error(err.toString());
		process.exit(1);
	}
	console.log(devices);
});
