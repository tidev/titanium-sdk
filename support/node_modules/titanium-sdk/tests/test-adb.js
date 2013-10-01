function MockConfig() {
	this.get = function (s, d) {
		return d;
	};
}

var config = new MockConfig,
	ADB = require('../lib/adb'),
	adb = new ADB(config);

//testVersion();
//testDevices();
//testTrackDevices();
//testShell();
//testStartApp();
//testStopApp();
//testStopApp2();
//testInstallApp();
//testGetPid();
//testForward();
//testPull();
//testPush();

function testVersion() {
	adb.version(function (err, ver) {
		if (err) {
			console.error('ERROR! ' + err + '\n');
		} else {
			console.log('Version = ' + ver + '\n');
		}
	});
}

function testDevices() {
	adb.devices(function (err, devices) {
		if (err) {
			console.error('ERROR! ' + err + '\n');
		} else {
			console.log('Devices:');
			console.log(devices);
			console.log();
		}
	});
}

function testTrackDevices() {
	adb.trackDevices(function (err, devices) {
		if (err) {
			console.error('ERROR! ' + err + '\n');
		} else {
			console.log('Devices:');
			console.log(devices);
			console.log();
		}
	});
}

function testShell() {
	adb.shell('192.168.56.101:5555', 'cat /system/build.prop', function (err, data) {
		if (err) {
			console.error('ERROR! ' + err + '\n');
		} else {
			console.log('shell cat /system/build.prop\n-----------------------------------------------------------------');
			console.log(data);
			console.log('<EOF>');
			data && console.log(data.length + ' bytes');
		}
	});
}

function testStartApp() {
	adb.startApp('015d21d4ff181a17', 'com.appcelerator.testapp2', 'Testapp2Activity', function (err, data) {
		if (err) {
			console.error('ERROR! ' + err + '\n');
		} else {
			console.log('-----------------------------------------------------------------');
			console.log(data);
			console.log('<EOF>');
		}
	});
}

function testStopApp() {
	adb.stopApp('emulator-5554', 'com.android.browser', function (err, data) {
		if (err) {
			console.error('ERROR! ' + err + '\n');
		} else {
			console.log('-----------------------------------------------------------------');
			console.log(data);
			console.log('<EOF>');
		}
	});
}

function testStopApp2() {
	adb.stopApp('015d21d4ff181a17', 'com.appcelerator.testapp2', function (err, data) {
		if (err) {
			console.error('ERROR! ' + err + '\n');
		} else {
			console.log('-----------------------------------------------------------------');
			console.log(data);
			console.log('<EOF>');
		}
	});
}

function testInstallApp() {
	adb.installApp('emulator-5554', '~/appc/workspace/testapp2/build/android/bin/app.apk', function (err, data) {
		if (err) {
			console.error('ERROR! ' + err + '\n');
		} else {
			console.log('-----------------------------------------------------------------');
			console.log(data);
			console.log('<EOF>');
		}
	});
}

function testGetPid() {
	adb.getPid('015d21d4ff181a17', 'com.appcelerator.testapp2', function (err, pid) {
		if (err) {
			console.error('ERROR! ' + err + '\n');
		} else {
			console.log('PID = ' + pid + '\n');
		}
	});
}

function testForward() {
	adb.forward('015d21d4ff181a17', 'tcp:5000', 'tcp:6000', function (err, data) {
		if (err) {
			console.error('ERROR! ' + err + '\n');
		} else {
			console.log('result = ' + data + '\n');
		}
	});
}

function testPull() {
	adb.pull('015d21d4ff181a17', '/system/build.prop', '~/Desktop/build.prop', function (err, data) {
		if (err) {
			console.error('ERROR! ' + err + '\n');
		} else {
			console.log('result = ' + data + '\n');
		}
	});
}

function testPush() {
	adb.push('015d21d4ff181a17', __filename, '/mnt/sdcard/tmp/test-adb.js', function (err, data) {
		if (err) {
			console.error('ERROR! ' + err + '\n');
		} else {
			console.log('result = ' + data + '\n');
		}
	});
}
