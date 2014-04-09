/**
 * Packages web specific resources for Titanium Mobile Web apps.
 *
 * @copyright
 * Copyright (c) 2014 by Appcelerator, Inc. All Rights Reserved.
 *
 * @license
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

var appc = require('node-appc'),
	fs = require('fs'),
	path = require('path'),
	__ = appc.i18n(__dirname).__;

exports.cliVersion = '>=3.X';

exports.init = function (logger, config, cli) {
	var appleTouchImages = {
		'appleTouchDefault': 'Default',
		'appleTouchPortrait': 'Default-Portrait',
		'appleTouchLandscape': 'Default-Landscape'
	};

	cli.on('build.mobileweb.copyFiles', function (builder, callback) {
		if (builder.target != 'web') return callback();

		// copy the splash images over
		var mobilewebDir = path.join(builder.projectResDir, 'mobileweb');
		if (fs.existsSync(mobilewebDir)) {
			Object.keys(appleTouchImages).forEach(function (type) {
				var filename = appleTouchImages[type] + '.png',
					file = path.join(mobilewebDir, 'apple_startup_images', filename);
				if (!fs.existsSync(file)) {
					filename = appleTouchImages[type] + '.jpg';
					file = path.join(mobilewebDir, 'apple_startup_images', filename);
				}
				if (fs.existsSync(file)) {
					appleTouchImages[type] = filename;
					appc.fs.copyFileSync(file, builder.buildDir, { logger: logger.debug });
				} else {
					appleTouchImages[type] = null;
				}
			}, this);
		}
		callback();
	});

	cli.on('build.mobileweb.createIcons', function (builder, callback) {
		if (builder.target != 'web') return callback();

		logger.info(__('Creating favicon and Apple touch icons'));

		var buildDir = builder.buildDir,
			iconFilename = /\.(png|jpg|gif)$/.test(builder.tiapp.icon) ? builder.tiapp.icon : 'appicon.png',
			file = path.join(builder.projectResDir, 'mobileweb', iconFilename),
			resizeImages = [];

		if (!fs.existsSync(file)) {
			// try in the root
			file = path.join(builder.projectResDir, iconFilename);
		}

		// if they don't have a appicon, copy it from the sdk
		if (!fs.existsSync(file)) {
			file = path.join(builder.platformPath, 'templates', 'app', 'default', 'Resources', 'mobileweb', 'appicon.png');
		}

		// copy the appicon.png
		appc.fs.copyFileSync(file, buildDir, { logger: logger.debug });

		function copyIcon(filename, width, height) {
			var file = path.join(builder.projectResDir, 'mobileweb', filename);
			if (!fs.existsSync(file)) {
				file = path.join(builder.projectResDir, filename);
			}
			if (fs.existsSync(file)) {
				appc.fs.copyFileSync(file, buildDir, { logger: logger.debug });
			} else {
				resizeImages.push({
					file: path.join(buildDir, filename).replace(/\.ico$/, '.png'),
					width: width,
					height: height
				});
			}
		}

		copyIcon('favicon.png', 16, 16);
		copyIcon('apple-touch-icon-precomposed.png', 57, 57);
		copyIcon('apple-touch-icon-57x57-precomposed.png', 57, 57);
		copyIcon('apple-touch-icon-72x72-precomposed.png', 72, 72);
		copyIcon('apple-touch-icon-114x114-precomposed.png', 114, 114);
		copyIcon('appicon144.png', 144, 144);

		// if there are no images to resize, just return
		if (!resizeImages.length) return callback();

		appc.image.resize(file, resizeImages, function (err, stdout, stderr) {
			if (err) {
				logger.error(__('Failed to create icons'));
				stdout && stdout.toString().split('\n').forEach(function (line) {
					line && logger.error(line.replace(/^\[ERROR\]/i, '').trim());
				});
				stderr && stderr.toString().split('\n').forEach(function (line) {
					line && logger.error(line.replace(/^\[ERROR\]/i, '').trim());
				});
				logger.log('');
				process.exit(1);
			}

			// rename the favicon
			fs.renameSync(path.join(buildDir, 'favicon.png'), path.join(buildDir, 'favicon.ico'));

			callback();
		}, logger);
	});

	cli.on('build.mobileweb.createIndexHtml', {
		pre: function (data, next) {
			if (this.target == 'web') {
				appc.util.mix(data.args[1], appleTouchImages);
			}
			next();
		}
	});
};