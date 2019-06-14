/**
 * @overview
 * Hook that performa Android specific functions when creating an Android module.
 *
 * @copyright
 * Copyright (c) 2014 by Appcelerator, Inc. All Rights Reserved.
 *
 * @license
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
'use strict';

var fs = require('fs-extra'),
	path = require('path');

exports.cliVersion = '>=3.2';

exports.init = function (logger, config, cli, appc) {
	var __ = appc.i18n(__dirname).__;

	cli.on('create.copyFiles.platform.android', {
		pre: function (data, callback) {
			// create the build/.apt_generated directory
			var aptgenDir = path.join(this.projectDir, 'android', 'build', '.apt_generated');
			fs.ensureDirSync(aptgenDir);

			// determine the minimum supported Android SDK version
			var packageJsonFile = (function scan(dir) {
					var file = path.join(dir, 'package.json');
					if (fs.existsSync(file)) {
						return file;
					}
					dir = path.dirname(dir);
					return dir !== '/' && scan(dir);
				}(__dirname)),
				packageJson = require(packageJsonFile),
				minAndroidAPILevel = parseInt(appc.version.parseMin(packageJson.vendorDependencies['android sdk']));

			var android = require('node-titanium-sdk/lib/android');
			logger.debug(__('Detecting Android environment...'));
			android.detect(this.config, null, function (results) {
				// find all targets that satisify the minimum supported Android SDK, prefer versions with Google APIs
				var apis = {};
				Object.keys(results.targets).forEach(function (idx) {
					var target = results.targets[idx],
						apiLevel = target['based-on'] && target['based-on']['api-level'] ? ~~target['based-on']['api-level'] : ~~target['api-level'],
						gapi = target.type === 'add-on' && /google/i.test(target.name);

					if (apiLevel >= minAndroidAPILevel && (target.type === 'platform' || gapi)) {
						apis[apiLevel] || (apis[apiLevel] = {});
						if (typeof apis[apiLevel].idx === 'undefined' || gapi) {
							apis[apiLevel].idx = idx;
						}

						if (gapi) {
							apis[apiLevel].googleAPIPath = target.path;
						} else {
							apis[apiLevel].platformPath = target.path;
						}
					}
				});

				var libs = [],
					targetAPILevel = Object.keys(apis).sort().shift(),
					api = targetAPILevel && apis[targetAPILevel],
					target = api && results.targets[api.idx];

				// add the android.jar
				if (target && target.androidJar) {
					libs.push(target.androidJar);
				}

				// add the maps.jar if we have Google APIs
				if (target && target.libraries && target.libraries['com.google.android.maps']) {
					target.path && libs.push(path.join(target.path, 'libs', target.libraries['com.google.android.maps'].jar));
				}

				// add the Titanium specific jars
				libs.push(
					path.join(this.sdk.path, 'android', 'titanium.jar'),
					path.join(this.sdk.path, 'android', 'kroll-common.jar'),
					path.join(this.sdk.path, 'android', 'kroll-apt.jar')
				);

				// update the variables
				var variables = data.args[0];

				// build the classpath
				variables.classpath = libs.map(function (lib) {
					return '<classpathentry kind="lib" path="' + lib + '"/>';
				}).join('\n\t');

				// set the Android platform path
				variables.androidPlatformPath = api && api.platformPath ? api.platformPath.replace(/\\/g, '\\\\') : '';

				// set the Google APIs path
				variables.googleAPIPath = api && api.googleAPIPath ? api.googleAPIPath.replace(/\\/g, '\\\\') : '';

				// set the Titanium Android platform path
				variables.tisdkAndroidPath = path.join(data.args[0].tisdkPath, 'android').replace(/\\/g, '\\\\');

				callback();
			}.bind(this));
		}
	});
};
