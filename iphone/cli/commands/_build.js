/*
 * build.js: Titanium IOS CLI build command
 *
 * Copyright (c) 2012, Appcelerator, Inc.  All Rights Reserved.
 * See the LICENSE file for more information.
 */

var fs = require('fs'),
	async = require('async'),
	exec = require('child_process').exec;

function build(logger, config, cli, sdkVersion, lib, finished) {
	logger.info(__('Compiling "%s" build', cli.argv['build-type']));
	
	var xcodePath;
	
	async.series([
		function (callback) {
			exec('xcode-select -print-path', function (err, stdout, stderr) {
				if (!err) {
					var p = stdout.toString().trim();
					if (fs.lstatSync(p).isDirectory()) {
						xcodePath = p;
						callback();
						return;
					}
				}
				
				logger.info('Xcode 4.3+ likely, searching for developer folders');
				
				for (var a = ['/Developer', '/Applications/Xcode.app/Contents/Developer'], i = 0; i < 2; i++) {
					if (fs.lstatSync(a[i]).isDirectory()) {
						xcodePath = a[i];
						callback();
						return;
					}
				}
				
				exec('mdfind kMDItemDisplayName==Xcode&&kMDItemKind==Application', function (err, stdout, stderr) {
					if (!err) {
						for (var a = stdout.toString().trim().split('\n'), i = 0, l = a.length; i < l; i++) {
							if (fs.lstatSync(a[i]).isDirectory()) {
								xcodePath = a[i];
								break;
							}
						}
					}
					callback();
				});
			});
		}
	], function () {
		if (!xcodePath) {
			logger.error(__('Unable to locate Xcode. Please verify that you have properly installed Xcode.') + '\n');
			return;
		}
		
		logger.info(__('Found Xcode installation: %s', xcodePath));
		
		finished();
	});
}

function createXcodeProject() {
	// project = Projector(self.name,version,template_dir,project_dir,self.id)
	// project.create(template_dir,iphone_dir)
}
