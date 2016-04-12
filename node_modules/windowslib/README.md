# Windows Phone Utility Library [![Build Status](https://travis-ci.org/appcelerator/windowslib.svg?branch=master)](https://travis-ci.org/appcelerator/windowslib)

This is a library of utilities for dealing programmatically with Windows Phone applications,
used namely for tools like [Titanium](https://github.com/appcelerator/titanium).

windowslib supports Visual Studio 2012, 2013, and 2015.

[![NPM](https://nodei.co/npm/windowslib.png?downloads=true&stars=true)](https://nodei.co/npm/windowslib/)

## Installation

From NPM:

	npm install windowslib

From GitHub:

	npm install git://github.com/appcelerator/windowslib.git

## Caveats

- Some of the emulator detection functionality requires the use of PowerShell
  scripts. For the library to be able to execute these scripts, the user must
  change their ExecutionPolicy by running the following in a PowerShell
  terminal as the Administrator:
```
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

- If attempting to connect to a device, you need to ensure the connected device
  is not asleep/locked or connecting will fail. There's no way to
  programmatically unlock the device.

## Examples

### Detect all the connected Windows Phone devices:

Note: Microsoft's tooling always reports a single device present regardless if
there are no devices connected or several. The device will have an ID of `0`
(zero).

In the event Microsoft's next mobile platform has improved tooling that supports
multiple devices, this detection code should be good to go.

```javascript
var windowslib = require('windowslib');

windowslib.device.detect(function (err, devices) {
	if (err) {
		console.error(err);
	} else {
		console.log(devices);
	}
});
```

### Install an Application on Device

```javascript
var deviceUDID = null; // string or null to pick first device

windowslib.device.install(deviceUDID, 'C:\\path\\to\\appfile.appx')
	.on('installed', function () {
		console.log('App successfully installed on device');
	})
	.on('error', function (err) {
		console.error(err);
	});
```

### Launch the Windows Phone Emulator

Passing in null for the `udid` will auto-select a emulator and launch it.

```javascript
windowslib.emulator.launch(null, function (err, handle) {
	console.log('Emulator launched');
	windowslib.emulator.stop(handle, function () {
		console.log('Emulator stopped');
	});
});
```

### Launch, install, and Run an Application on the Emulator

```javascript
var udid = null; // string or null to pick an emulator

windowslib.emulator.install(udid, 'C:\\path\\to\\appfile.appx')
	.on('launched', function (msg) {
		console.log('Emulator has launched');
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

### Force Stop an Application Running on the Emulator

```javascript
windowslib.emulator.launch(udid)
	.on('launched', function (handle) {
		console.log('Emulator launched');
		windowslib.emulator.stop(handle).on('stopped', function () {
			console.log('Emulator stopped');
		});
	});
```

### Detect Everything

```javascript
windowslib.detect(function (err, info) {
	if (err) {
		console.error(err);
	} else {
		console.log(info);
	}
});
```

## Running Tests

For best results, connect a Windows phone device.

To run all tests:

```
npm test
```

To run a specific test suite:

```
npm run-script test-assemblies

npm run-script test-device

npm run-script test-emulator

npm run-script test-env

npm run-script test-logrelay

npm run-script test-process

npm run-script test-visualstudio

npm run-script test-windowsphone

npm run-script test-wptool
```

## Reporting Bugs or Submitting Fixes

If you run into problems, and trust us, there are likely plenty of them at this
point -- please create an [Issue](https://github.com/appcelerator/windowslib/issues)
or, even better, send us a pull request.

## Contributing

windowslib is an open source project. windowslib wouldn't be where it is now without
contributions by the community. Please consider forking windowslib to improve,
enhance or fix issues. If you feel like the community will benefit from your
fork, please open a pull request.

To protect the interests of the windowslib contributors, Appcelerator, customers
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

## Legal

Copyright (c) 2014-2015 by [Appcelerator, Inc](http://www.appcelerator.com). All
Rights Reserved. This project is licensed under the Apache Public License,
version 2. Please see details in the LICENSE file.
