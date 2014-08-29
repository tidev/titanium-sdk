iOS Utility Library
===================

This is a library of utilities for dealing programmatically with iOS applications, used namely for tools like [Hyperloop](https://github.com/appcelerator/hyperloop) and [Titanium](https://github.com/appcelerator/titanium).

## Current Status [![Build Status](https://travis-ci.org/appcelerator/ioslib.svg?branch=master)](https://travis-ci.org/appcelerator/ioslib) [![NPM version](https://badge.fury.io/js/ioslib.svg)](http://badge.fury.io/js/ioslib)

- currently in progress of porting various internal libraries into this library
- [node-ios-device](https://github.com/appcelerator/node-ios-device) is currently the main library used by Titanium at the moment.  we will merge these two projects once this one is complete.

Examples
--------

### Detect all the connected iOS devices:

```javascript
var ioslib = require('ioslib');

ioslib.device.detect(function(err,devices){
	if (!err && devices.length) {
		console.log('detected',devices);
	}
});
```

### Install and then launch an application on device

```javascript
var ioslib = require('ioslib');
var obj = {
	build_dir: '/path/to/name.app',
	callback: function(err) {
		console.log('exited');
	},
	logger: function(label, message) {
		console.log('['+label+']',message);
	}
}
ioslib.device.launch(obj);
```

### Install and then launch an application on simulator

```javascript
var ioslib = require('ioslib');
var obj = {
	build_dir: '/path/to/name.app',
	callback: function(err) {
		console.log('exited');
	},
	logger: function(label, message) {
		console.log('['+label+']',message);
	}
}
ioslib.simulator.launch(obj);
```

### Force stop an application running on simulator

```javascript
var ioslib = require('ioslib');
ioslib.simulator.stop(function(){
	console.log('simulator has exited');
});
```

### Force stop an application running on device

```javascript
var ioslib = require('ioslib');
ioslib.device.stop(function(){
	console.log('device app has exited');
});
```

### Find provisioning profiles and developer info

```javascript
var ioslib = require('ioslib');
ioslib.profile.find('com.appcelerator.test',function(err,results){
	console.log('profiles',results.profiles);
	console.log('developer_name',results.developer_name);
});
```

### Detect Xcode path

```javascript
var ioslib = require('ioslib');
ioslib.xcode.detect(function(err,path){
	console.log('xcode path',path);
});
```

### Detect Xcode settings

```javascript
var ioslib = require('ioslib');
ioslib.xcode.settings(function(err,settings){
	console.log('xcode settings',settings);
});
```

### Detect Xcode system frameworks

```javascript
var ioslib = require('ioslib');
ioslib.xcode.systemFrameworks(function(err,frameworks,frameworkDir){
	console.log('xcode frameworks',frameworks);
});
```

## Command line

There is also a simple command line:

### Print out basic information about device

```
> ioslib
```

### Print out JSON

```
> ioslib --json
```

### Print out Titanium CLI flags

```
> ioslib --ti

--platform ios --target device --device-id 123456987978978978789 --developer-name "Foo Bar (95FMZAQKCH)" --pp-uuid 78B3D052-E2B8-4268-8812-D83FB9EC3788
```


## Reporting Bugs or submitting fixes

If you run into problems, and trust us, there are likely plenty of them at this point -- please create an [Issue](https://github.com/appcelerator/ioslib/issues) or, even better, send us a pull request.

## Contributing

ioslib is an open source project.  ioslib wouldn't be where it is now without contributions by the community. Please consider forking ioslib to improve, enhance or fix issues. If you feel like the community will benefit from your fork, please open a pull request.

To protect the interests of the ioslib contributors, Appcelerator, customers and end users we require contributors to sign a Contributors License Agreement (CLA) before we pull the changes into the main repository. Our CLA is simple and straightforward - it requires that the contributions you make to any Appcelerator open source project are properly licensed and that you have the legal authority to make those changes. This helps us significantly reduce future legal risk for everyone involved. It is easy, helps everyone, takes only a few minutes, and only needs to be completed once.

[You can digitally sign the CLA](http://bit.ly/app_cla) online. Please indicate your email address in your first pull request so that we can make sure that will locate your CLA.  Once you've submitted it, you no longer need to send one for subsequent submissions.

## Contributors

The original source and design for this project was developed by [Jeff Haynie](http://github.com/jhaynie) ([@jhaynie](http://twitter.com/jhaynie)).

## Legal

Copyright (c) 2014 by [Appcelerator, Inc](http://www.appcelerator.com). All Rights Reserved.
This project is licensed under the Apache Public License, version 2.  Please see details in the LICENSE file.
