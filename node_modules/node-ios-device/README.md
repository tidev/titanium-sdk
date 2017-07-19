# node-ios-device [![Build Status](https://travis-ci.org/appcelerator/node-ios-device.svg?branch=master)](https://travis-ci.org/appcelerator/node-ios-device)

Queries connected iOS devices, installs apps, and relays log output.

## Prerequisites

node-ios-device is currently compatible with the following versions:

 * Node.js
   * 0.10.x (module API v11)
   * 4.x (module API v46)
   * 5.x (module API v47)
   * 6.x (module API v48)
   * 7.x (module API v51)
   * 8.x (module API v57)
 * io.js
   * 3.x (module API v45)

Only Mac OS X (darwin) is supported. You should make this module an optional
dependency of your application and it will only be downloaded on OS X.

> Note: node-ios-device@2.0.0 will only support Node.js 4 and newer.

> Note: Support for Node.js 0.12 and io.js <3.x has been dropped because they fail to compile with
> Xcode 8.3 due to an issue with V8. Interestingly, older versions of clang didn't have a problem.
> Apple claims they cannot reproduce the issue and that the version of clang that ships with Xcode
> 8.3 is working as expected. If you still need to support Node.js 0.12 and io.js <3.x, then
> best to stick with node-ios-device@1.2.x.

## Installation

From NPM:

	npm install node-ios-device --save-optional

## Example

```javascript
var iosDevice = require('node-ios-device');

// get all connected iOS devices
iosDevice.devices(function (err, devices) {
	if (err) {
		console.error('Error!', err);
	} else {
		console.log('Connected devices:');
		console.log(devices);
	}
});

// continuously watch for devices to be connected or disconnected
iosDevice
	.trackDevices()
	.on('devices', function (devices) {
		console.log('Connected devices:');
		console.log(devices);
	})
	.on('error', function (err) {
		console.error('Error!', err);
	});

// install an iOS app
iosDevice.installApp('<device udid>', '/path/to/my.app', function (err) {
	if (err) {
		console.error('Error!', err);
	} else {
		console.log('Success!');
	}
});

// relay the syslog output to the console
iosDevice
	.log('<device udid>')
	.on('log', function (msg) {
		console.log(msg);
	})
	.on('error', function (err) {
		console.error('Error!', err);
	});

// relay output from a TCP port created by an iOS app
iosDevice
	.log('<device udid>', 1337)
	.on('log', function (msg) {
		console.log(msg);
	})
	.on('error', function (err) {
		console.error('Error!', err);
	});
```

## API

### devices(callback)

Retrieves an array of all connected iOS devices.

* `{function} callback(err, devices)` - A function to call with the connected devices
	* `{null|Error} err` - An `Error` if there was a problem, otherwise `null`
	* `{Array<Object>} devices` - An array of Device objects

Note that only devices connected via a USB cable will be returned. Devices
connected via Wi-Fi will not be returned. The main reason we do this is because
you can only relay the syslog from USB connected devices. This restriction be
lifted in the future.

Device objects contain the following information:

* `udid` - The device's unique device id (e.g. "a4cbe14c0441a2bf87f397602653a4ac71eb0336")
* `name` - The name of the device (e.g. "My iPhone")
* `buildVersion` - The build version (e.g. "10B350")
* `cpuArchitecture` - The CPU architecture (e.g. "armv7s")
* `deviceClass` - The type of device (e.g. "iPhone", "iPad")
* `deviceColor` - The color of the device (e.g. "black", "white")
* `hardwareModel` - The device module (e.g. "[N41AP](http://theiphonewiki.com/wiki/N41ap)")
* `modelNumber` - The model number (e.g. "MD636")
* `productType` - The product type or model id (e.g. "iPhone5,1")
* `productVersion` - The iOS version (e.g. "6.1.4")
* `serialNumber` - The device serial number (e.g. "XXXXXXXXXXXX")

There is more data that could have been retrieved from the device, but the
properties above seemed the most reasonable.

### trackDevices()

Continuously retrieves an array of all connected iOS devices. Whenever a device
is connected or disconnected, the `devices` event is emitted.

Returns a `Handle` instance that contains a `stop()` method to discontinue
tracking devices.

#### Event: 'devices'

Emitted when a device is connected or disconnected.

- `{Array<Object>} devices` - An array of devices

#### Event: 'error'

Emitted if there was an error such as platform is unsupported, failed to load or
compile a compatible `node-ios-device` binary, or failed to detect devices.

- `{Error} err` - The error

#### Example:

```javascript
const handle = iosDevice
	.trackDevices()
	.on('devices', console.log);

setTimeout(function () {
	// turn off tracking after 1 minute
	handle.stop();
}, 60000);
```

### installApp(udid, appPath, callback)

Installs an iOS app on the specified device.

* `{String} udid` - The device udid
* `{String} appPath` - The path to the iOS .app
* `{Function} callback(err)` - A function to call when the install finishes
	* `{null|Error} err` - An `Error` if there was a problem, otherwise `null`

Currently, an `appPath` that begins with `~` is not supported.

The `appPath` must resolve to an iOS .app, not the .ipa file.

### log(udid [, port])

Relays a log from the iOS device. There are two modes. If you do not specify a
port, it will relay the device's syslog and you'll need to parse out any app
specific output yourself. If you specify a port, then it will connect to that
port and relay all messages.

Starting with iOS 10, relaying the syslog is virtually useless. iOS 10 has a new
logging system that skips the syslog. You can get log output using the `log`
command introduced in macOS Sierra, but it's not available for OS X El Capitan
users. Because of this, `node-ios-device` added the ability to specify a port,
but then your iOS app must contain a TCP server that accepts connects and
outputs log messages to the `node-ios-device` log.

* `{String} udid` - The device udid
* `{String} port` (optional) - The TCP port listening in the iOS app to connect to

Returns a `Handle` instance that contains a `stop()` method to discontinue
emitting messages.

#### Event: 'log'

Emitted for each line of output. Empty lines are omitted.

- `{String} message` - The log message.

#### Event: 'app-started'

Emitted when `node-ios-device` is able to successfully connect to the specified
port on the device. This is only supported when specifying a port.

#### Event: 'app-quit'

Emitted when the app is quit. This is only supported when specifying a port.

#### Event: 'disconnect'

Emitted when the device is physically disconnected. Note that this does not stop
the log relaying. You must manually call `handle.stop()`.

#### Event: 'error'

Emitted if there was an error such as if the device is not initially connected,
platform is unsupported, failed to load or compile a compatible
`node-ios-device` binary, or failed to detect devices.

- `{Error} err` - The error

#### Example:

```javascript
const handle = iosDevice
	.log('<device udid>')
	.on('log', console.log);
});

setTimeout(function () {
	// turn off logging after 1 minute
	handle.stop();
}, 60000);
```

When calling `log()` without a port to relay the syslog, it will print out
several older messages. If you are only interested in new messages, then you'll
have to debounce the messages using something like `_.debounce()` or use a timer
and a ready flag like this:

```javascript
let ready = false;
let timer = null;

iosDevice
	.log('<device udid>')
	.on('log', function (msg) {
		if (ready) {
			console.log(msg);
		} else {
			clearTimeout(timer);
			timer = setTimeout(function () {
				ready = true;
			}, 500);
		}
	});
```

## Maintainer Info

### Development

To manually build `node-ios-device`, simply run:

    npm run rebuild

To build it for all versions of Node.js, run:

    bin/build-all.sh

To debug `node-ios-device`,

 - Run `npm run xcode` to generate the Xcode project
 - Open the Xcode project from the `build` directory
 - Edit the scheme
 - From the "Run (debug)" menu, select the "Info" tab on the right
 - Click on the "Executable" dropdown and select "Other..."
 - Locate the Node.js executable (probably `/usr/local/bin/node`)
 - Change to the "Arguments" tab
 - Set the "Arguments Passed On Launch" to the JS file you want to run
   - This will likely be one of the test cases
   - Use an absolute path since all paths are relative to the Node executable
 - Add the environment variable `DEBUG=*`
 - Close out the schemes and click "Run"

### Publishing

This section is intended for Appcelerator release managers.

To publish a new release to NPM, run `npm publish`. This will build
`node-ios-device` for all Node.js module API versions and then upload each
binary to an Appcelerator Amazon S3 bucket. You must make sure you have a
`~/.node_pre_gyprc` containing `{ "accessKeyId": "", "secretAccessKey": "" }`.

## License

This project is open source and provided under the Apache Public License
(version 2). Please make sure you see the `LICENSE` file included in this
distribution for more details on the license.  Also, please take notice of the
privacy notice at the end of the file.

This project contains `mobiledevice.h` from
[https://bitbucket.org/tristero/mobiledeviceaccess](https://bitbucket.org/tristero/mobiledeviceaccess)
and is available under public domain.

#### (C) Copyright 2012-2017, [Appcelerator](http://www.appcelerator.com/) Inc. All Rights Reserved.
