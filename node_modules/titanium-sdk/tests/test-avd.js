function MockConfig() {
	this.get = function (s, d) {
		if (s == 'genymotion.enabled') {
			return true;
		}
		return d;
	};
}

var config = new MockConfig,
	emulator = new (require('../lib/emulator'))(config);

/*
 * uncomment a function below to test
 */

//testDetectAny();
//testDetectAvd();
//testDetectGenymotion();
//testDetectGenymotion2();

//testIsRunning('titanium_10_HVGA_armeabi-v7a');
//testIsRunning('titanium_10_HVGA_x86');
//testIsRunning('Nexus 7 - 4.2.2 - with Google Apps - API 17 - 1280x800');
//testIsRunning('Nexus S - 4.2.2 - with Google Apps - API 17 - 480x800');
//testIsRunning('foo');

//testIsEmulator('emulator-5554');
//testIsEmulator('192.168.56.101:5555');
//testIsEmulator('foo');

//testStart('titanium_10_HVGA_x86');
//testStart('titanium_1_HVGA_armeabi');
//testStart('titanium_10_HVGA_armeabi-v7a');
//testStart('Nexus 7 - 4.2.2 - with Google Apps - API 17 - 1280x800');
//testStart('Nexus S - 4.2.2 - with Google Apps - API 17 - 480x800');
//testStart('foo');

//testStop('titanium_10_HVGA_armeabi-v7a');
//testStop('Nexus 7 - 4.2.2 - with Google Apps - API 17 - 1280x800');
//testStop('Nexus S - 4.2.2 - with Google Apps - API 17 - 480x800');
//testStop('foo');

function testDetectAny() {
	emulator.detect(function (err, avds) {
		console.log(avds);
	});
}

function testDetectAvd() {
	emulator.detect({ type: 'avd' }, function (err, avds) {
		console.log(avds);
	});
}

function testDetectGenymotion() {
	emulator.detect({ type: 'genymotion' }, function (err, avds) {
		console.log(avds);
	});
}

function testDetectGenymotion2() {
	require('../lib/emulators/genymotion').detect(config, {}, function (err, results) {
		if (err) {
			console.error('ERROR! ' + err);
		} else {
			console.log(results);
		}
	});
}

function testIsRunning(name) {
	emulator.isRunning(name, function (err, emu) {
		if (err) {
			console.error('ERROR! ' + err + '\n');
		} else {
			if (emu) {
				console.log('Emulator "' + name + '" is running!\n');
				console.log(emu);
			} else {
				console.log('Emulator "' + name + '" is not running');
			}
			console.log();
		}
	});
}

function testIsEmulator(name) {
	emulator.isEmulator(name, function (err, emu) {
		if (err) {
			console.error('ERROR! ' + err + '\n');
		} else {
			console.log(name, !!emu);
			console.log(emu);
			console.log();
		}
	});
}

function testStart(name) {
	emulator.start(name, function (err, emulator) {
		if (err) {
			console.error(err + '\n');
		} else {
			console.log('emulator booting\n');

			emulator.on('booted', function (device) {
				console.log('booted!\n');
				console.log(device);
				console.log('\n');
			});

			emulator.on('ready', function (device) {
				console.log('ready!\n');
				console.log(device);
				console.log('\n');
			});

			emulator.on('timeout', function () {
				console.log('timeout!\n');
			});

			console.log(emulator);
			console.log();
		}
	});
}

function testStop(name) {
	emulator.stop(name, function (err) {
		if (err) {
			console.error(err + '\n');
		} else {
			console.log('emulator stopping\n');
		}
	});
}
