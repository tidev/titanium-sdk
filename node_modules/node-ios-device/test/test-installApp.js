var iosDevice = require('../ios-device');

iosDevice.devices(function (err, devices) {
	if (err) {
		console.error(err.toString());
		process.exit(1);
	}

	console.log(devices);

	if (devices.length) {
		//console.log("Waiting 25 seconds to install the app to device " + devices[0].udid);

		var off = iosDevice.log(devices[0].udid, function (msg) {
			console.log(msg);
		});

		//setTimeout(function () {
			console.log('=====================================================');
			console.log('Installing app');
			console.log('=====================================================');
			iosDevice.installApp(devices[0].udid, process.argv.length > 2 ? process.argv[2] : __dirname + '/TestApp.app', function (err) {
				if (err) {
					console.error('ERROR!!!');
					console.error(err);
					off();
					process.exit(1);
				} else {
					console.log('=====================================================');
					console.log('App installed successfully');
					console.log('=====================================================');
				}
			});
		//}, 25000);
	}
});
