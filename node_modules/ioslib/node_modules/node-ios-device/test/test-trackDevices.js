var iosDevice = require('../ios-device');

iosDevice.trackDevices(function (err, devices) {
	console.log(devices);
});
