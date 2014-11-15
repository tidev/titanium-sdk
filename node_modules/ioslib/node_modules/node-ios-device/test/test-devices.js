var iosDevice = require('../ios-device');

iosDevice.devices(function (err, devices) {
	console.log(devices);
});
