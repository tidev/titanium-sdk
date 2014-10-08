var iosDevice = require('../ios-device');

iosDevice.devices(function (err, devices) {
	console.log(devices);

	if (devices.length) {
		console.log("Waiting 25 seconds to install the app to device " + devices[0].udid);

		iosDevice.log(devices[0].udid, function (msg) {
			console.log(msg);
		});

		setTimeout(function () {
			console.log('=====================================================');
			console.log('Installing app');
			console.log('=====================================================');
			iosDevice.installApp(devices[0].udid, process.argv.length > 2 ? process.argv[2] : '/Users/chris/appc/workspace/testapp/build/iphone/build/Debug-iphoneos/testapp.app', function (err) {
				if (err) {
					console.error('ERROR!!!');
					console.error(err);
				} else {
					console.log('=====================================================');
					console.log('App installed successfully');
					console.log('=====================================================');
				}
			});
		}, 25000);
	}
});
