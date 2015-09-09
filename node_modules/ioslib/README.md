# iOS Utility Library

> This is a library of utilities for dealing programmatically with iOS applications,
used namely for tools like [Hyperloop](https://github.com/appcelerator/hyperloop)
and [Titanium](https://github.com/appcelerator/titanium).

ioslib supports Xcode 6 and newer.

[![Build Status](https://travis-ci.org/appcelerator/ioslib.svg?branch=master)](https://travis-ci.org/appcelerator/ioslib)
[![Dependency Status](https://david-dm.org/appcelerator/ioslib.svg)](https://david-dm.org/appcelerator/ioslib)
[![devDependency Status](https://david-dm.org/appcelerator/ioslib/dev-status.svg)](https://david-dm.org/appcelerator/ioslib#info=devDependencies)
[![NPM version](https://badge.fury.io/js/ioslib.svg)](http://badge.fury.io/js/ioslib)

[![NPM](https://nodei.co/npm-dl/ioslib.png)](https://nodei.co/npm/ioslib/)

## Prerequisites

This library current depends on [node-ios-device](https://github.com/appcelerator/node-ios-device)
and thus is currently compatible with Node.js version 0.8.0 through 0.12.0, io.js 1.0 through 3.3,
and Node.js 4.0.

## Installation

From NPM:

	npm install ioslib

From GitHub:

	npm install git://github.com/appcelerator/ioslib.git

## Examples

### Detect all the connected iOS devices:

```javascript
var ioslib = require('ioslib');

ioslib.device.detect(function (err, devices) {
	if (err) {
		console.error(err);
	} else {
		console.log(devices);
	}
});
```

### Install an application on device

```javascript
var deviceUDID = null; // string or null to pick first device

ioslib.device.install(deviceUDID, '/path/to/name.app', 'com.company.appname')
	.on('installed', function () {
		console.log('App successfully installed on device');
	})
	.on('appStarted', function () {
		console.log('App has started');
	})
	.on('log', function (msg) {
		console.log('[LOG] ' + msg);
	})
	.on('appQuit', function () {
		console.log('App has quit');
	})
	.on('error', function (err) {
		console.error(err);
	});
```

### Launch the iOS Simulator

```javascript
ioslib.simulator.launch(null, function (err, simHandle) {
	console.log('Simulator launched');
	ioslib.simulator.stop(simHandle, function () {
		console.log('Simulator stopped');
	});
});
```

### Launch, install, and run an application on simulator

```javascript
var simUDID = null; // string or null to pick a simulator

ioslib.simulator.launch(simUDID, {
		appPath: '/path/to/name.app'
	})
	.on('launched', function (msg) {
		console.log('Simulator has launched');
	})
	.on('appStarted', function (msg) {
		console.log('App has started');
	})
	.on('log', function (msg) {
		console.log('[LOG] ' + msg);
	})
	.on('error', function (err) {
		console.error(err);
	});
```

### Force stop an application running on simulator

```javascript
ioslib.simulator.launch(simUDID, {
		appPath: '/path/to/name.app'
	})
	.on('launched', function (simHandle) {
		console.log('Simulator launched');
		ioslib.simulator.stop(simHandle).on('stopped', function () {
			console.log('Simulator stopped');
		});
	});
```

### Find a valid device/cert/provisioning profile combination

```javascript
ioslib.findValidDeviceCertProfileCombos({
	appId: 'com.company.appname'
}, function (err, results) {
	if (err) {
		console.error(err);
	} else {
		console.log(results);
	}
});
```

### Detect everything

```javascript
ioslib.detect(function (err, info) {
	if (err) {
		console.error(err);
	} else {
		console.log(info);
	}
});
```

### Detect iOS certificates

```javascript
ioslib.certs.detect(function (err, certs) {
	if (err) {
		console.error(err);
	} else {
		console.log(certs);
	}
});
```

### Detect provisioning profiles

```javascript
ioslib.provisioning.detect(function (err, profiles) {
	if (err) {
		console.error(err);
	} else {
		console.log(profiles);
	}
});
```

### Detect Xcode installations

```javascript
ioslib.xcode.detect(function (err, xcodeInfo) {
	if (err) {
		console.error(err);
	} else {
		console.log(xcodeInfo);
	}
});
```

## Running Tests

For best results, connect an iOS device.

To run all tests:

```
npm test
```

To see debug logging, set the `DEBUG` environment variable:

```
DEBUG=1 npm test
```

To run a specific test suite:

```
npm run-script test-certs

npm run-script test-device

npm run-script test-env

npm run-script test-ioslib

npm run-script test-provisioning

npm run-script test-simulator

npm run-script test-xcode
```

## Known Issues

Simulator tests fail due to issue with NSLog() calls not properly being logged
and thus we don't know when tests are done. The result is the tests timeout.

## Reporting Bugs or Submitting Fixes

If you run into problems, and trust us, there are likely plenty of them at this
point -- please create an [Issue](https://github.com/appcelerator/ioslib/issues)
or, even better, send us a pull request.

## Contributing

ioslib is an open source project. ioslib wouldn't be where it is now without
contributions by the community. Please consider forking ioslib to improve,
enhance or fix issues. If you feel like the community will benefit from your
fork, please open a pull request.

To protect the interests of the ioslib contributors, Appcelerator, customers
and end users we require contributors to sign a Contributors License Agreement
(CLA) before we pull the changes into the main repository. Our CLA is simple and
straightforward - it requires that the contributions you make to any
Appcelerator open source project are properly licensed and that you have the
legal authority to make those changes. This helps us significantly reduce future
legal risk for everyone involved. It is easy, helps everyone, takes only a few
minutes, and only needs to be completed once.

[You can digitally sign the CLA](http://bit.ly/app_cla) online. Please indicate
your email address in your first pull request so that we can make sure that will
locate your CLA.  Once you've submitted it, you no longer need to send one for
subsequent submissions.

## Contributors

The original source and design for this project was developed by
[Jeff Haynie](http://github.com/jhaynie) ([@jhaynie](http://twitter.com/jhaynie)).

## Legal

Copyright (c) 2014 by [Appcelerator, Inc](http://www.appcelerator.com). All Rights Reserved.
This project is licensed under the Apache Public License, version 2.  Please see details in the LICENSE file.
