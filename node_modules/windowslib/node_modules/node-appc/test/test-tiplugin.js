/**
 * node-appc - Appcelerator Common Library for Node.js
 * Copyright (c) 2009-2014 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

var appc = require('../index'),
	assert = require('assert'),
	fs = require('fs'),
	path = require('path'),
	colors = require('colors');

function MockConfig() {
	this.get = function (s) {
		if (s == 'cli.ignoreDirs') {
			return '^(.svn|.git|.hg|.?[Cc][Vv][Ss]|.bzr)$';
		}
	};
}

function MockLogger() {
	this.buffer = '';
	this.debug = function (s) { this.buffer += s + '\n'; };
	this.info = function (s) { this.buffer += s + '\n'; };
	this.warn = function (s) { this.buffer += s + '\n'; };
	this.error = function (s) { this.buffer += s + '\n'; };
}

describe('tiplugin', function () {
	it('namespace exists', function () {
		appc.should.have.property('tiplugin');
		appc.tiplugin.should.be.an.Object;
	});

	var testResourcesDir = path.join(__dirname, 'resources', 'tiplugin', 'plugins');

	describe('#scopedDetect()', function () {
		it('should return immediately if no paths to search', function (done) {
			appc.tiplugin.scopedDetect(null, null, null, function (result) {
				done();
			});
		});

		it('should find all test plugins', function (done) {
			var logger = new MockLogger;

			// now run the detection
			appc.tiplugin.scopedDetect({
				testResources: testResourcesDir
			}, new MockConfig, logger, function (result) {
				logger.buffer.stripColors.should.containEql('Detecting plugins in ' + testResourcesDir);
				logger.buffer.stripColors.should.containEql('Detected plugin: commandtest 1.0 @ ' + path.join(testResourcesDir, 'commandtest', '1.0'));
				logger.buffer.stripColors.should.containEql('Detected plugin: emptytest 1.0 @ ' + path.join(testResourcesDir, 'emptytest', '1.0'));
				logger.buffer.stripColors.should.containEql('Detected plugin: hooktest 1.0 @ ' + path.join(testResourcesDir, 'hooktest', '1.0'));
				logger.buffer.stripColors.should.containEql('Detected plugin: legacytest @ ' + path.join(testResourcesDir, 'legacytest'));

				result.should.be.an.Object;

				result.should.eql({
					testResources: {
						commandtest: {
							'1.0': {
								pluginPath: path.join(testResourcesDir, 'commandtest', '1.0'),
								commands: [ { name: 'dummy' } ],
								hooks: [],
								legacyPluginFile: null,
								manifest: {
									'name': 'commandtest',
									'version': '1.0'
								}
							}
						},
						emptytest: {
							'1.0': {
								pluginPath: path.join(testResourcesDir, 'emptytest', '1.0'),
								commands: [],
								hooks: [],
								legacyPluginFile: null,
								manifest: {
									'name': 'emptytest',
									'version': '1.0'
								}
							}
						},
						hooktest: {
							'1.0': {
								pluginPath: path.join(testResourcesDir, 'hooktest', '1.0'),
								commands: [],
								hooks: [ { name: 'hooktest', path: path.join(testResourcesDir, 'hooktest', '1.0', 'hooks', 'hooktest.js'), cliVersion: '>=3.X' } ],
								legacyPluginFile: null,
								manifest: {
									'name': 'hooktest',
									'version': '1.0'
								}
							}
						},
						legacytest: {
							unknown: {
								pluginPath: path.join(testResourcesDir, 'legacytest'),
								commands: [],
								hooks: [],
								legacyPluginFile: path.join(testResourcesDir, 'legacytest', 'plugin.py'),
								manifest: {}
							}
						}
					}
				});

				done();
			});
		});
	});

	describe('#detect()', function () {
		it('should find the test plugins', function (done) {
			var logger = new MockLogger,
				projectDir = path.join(__dirname, 'resources', 'tiplugin');

			appc.tiplugin.detect(projectDir, new MockConfig, logger, function (result) {
				logger.buffer.stripColors.should.containEql('Detecting plugins in ' + testResourcesDir);
				logger.buffer.stripColors.should.containEql('Detected plugin: commandtest 1.0 @ ' + path.join(testResourcesDir, 'commandtest', '1.0'));
				logger.buffer.stripColors.should.containEql('Detected plugin: emptytest 1.0 @ ' + path.join(testResourcesDir, 'emptytest', '1.0'));
				logger.buffer.stripColors.should.containEql('Detected plugin: hooktest 1.0 @ ' + path.join(testResourcesDir, 'hooktest', '1.0'));
				logger.buffer.stripColors.should.containEql('Detected plugin: legacytest @ ' + path.join(testResourcesDir, 'legacytest'));

				result.should.be.an.Object;
				result.should.have.property('project');
				result.should.have.property('global');

				result.project.should.eql({
					commandtest: {
						'1.0': {
							pluginPath: path.join(testResourcesDir, 'commandtest', '1.0'),
							commands: [ { name: 'dummy' } ],
							hooks: [],
							legacyPluginFile: null,
							manifest: {
								'name': 'commandtest',
								'version': '1.0'
							}
						}
					},
					emptytest: {
						'1.0': {
							pluginPath: path.join(testResourcesDir, 'emptytest', '1.0'),
							commands: [],
							hooks: [],
							legacyPluginFile: null,
							manifest: {
								'name': 'emptytest',
								'version': '1.0'
							}
						}
					},
					hooktest: {
						'1.0': {
							pluginPath: path.join(testResourcesDir, 'hooktest', '1.0'),
							commands: [],
							hooks: [ { name: 'hooktest', path: path.join(testResourcesDir, 'hooktest', '1.0', 'hooks', 'hooktest.js'), cliVersion: '>=3.X' } ],
							legacyPluginFile: null,
							manifest: {
								'name': 'hooktest',
								'version': '1.0'
							}
						}
					},
					legacytest: {
						unknown: {
							pluginPath: path.join(testResourcesDir, 'legacytest'),
							commands: [],
							hooks: [],
							legacyPluginFile: path.join(testResourcesDir, 'legacytest', 'plugin.py'),
							manifest: {}
						}
					}
				});

				done();
			});
		});

		it('should find "userlegacytest" plugin in user-defined path', function (done) {
			var config = new MockConfig,
				logger = new MockLogger,
				dir = path.join(__dirname, 'resources', 'tiplugin', 'user', 'userlegacytest');

			config.paths = {
				plugins: [ dir ]
			};

			appc.tiplugin.detect(path.join(__dirname, 'resources', 'tiplugin'), config, logger, function (result) {
				logger.buffer.stripColors.should.containEql('Detecting plugins in ' + dir);
				logger.buffer.stripColors.should.containEql('Detected plugin: userlegacytest @ ' + dir);
				done();
			}, true);
		});

		it('should find "usercommandtest" plugin in user-defined path', function (done) {
			var config = new MockConfig,
				logger = new MockLogger,
				dir = path.join(__dirname, 'resources', 'tiplugin', 'user', 'usercommandtest');

			config.paths = {
				plugins: [ dir ]
			};

			appc.tiplugin.detect(path.join(__dirname, 'resources', 'tiplugin'), config, logger, function (result) {
				logger.buffer.stripColors.should.containEql('Detecting plugins in ' + dir);
				logger.buffer.stripColors.should.containEql('Detected plugin: usercommandtest @ ' + dir);
				done();
			}, true);
		});
	});

	describe('#find()', function () {
		it('should return immediately if no plugins', function (done) {
			var logger = new MockLogger;
			appc.tiplugin.find([], null, null, logger, function (result) {
				result.should.eql({
					found: [],
					missing: []
				});
				done();
			});
		});

		it('should find "commandtest" plugin using only the id', function (done) {
			var logger = new MockLogger;
			appc.tiplugin.find([
				{ id: 'commandtest' }
			], path.join(__dirname, 'resources', 'tiplugin'), {}, logger, function (result) {
				logger.buffer.stripColors.should.containEql('Found Titanium plugin id=commandtest version=latest');

				var found = false;
				for (var i = 0; !found && i < result.found.length; i++) {
					found = (result.found[i].id == 'commandtest');
				}
				assert(found, '"commandtest" plugin not marked as found');

				done();
			});
		});

		it('should find "commandtest" plugin with matching version', function (done) {
			var logger = new MockLogger;
			appc.tiplugin.find([
				{ id: 'commandtest', version: '1.0' }
			], path.join(__dirname, 'resources', 'tiplugin'), {}, logger, function (result) {
				logger.buffer.stripColors.should.containEql('Found Titanium plugin id=commandtest version=1.0');

				var found = false;
				for (var i = 0; !found && i < result.found.length; i++) {
					if (result.found[i].id == 'commandtest') {
						found = true;
					}
				}
				assert(found, '"commandtest" plugin not marked as found');

				done();
			});
		});

		it('should not find "commandtest" plugin with wrong version', function (done) {
			var logger = new MockLogger;
			appc.tiplugin.find([
				{ id: 'commandtest', version: '2.0' }
			], path.join(__dirname, 'resources', 'tiplugin'), {}, logger, function (result) {
				logger.buffer.stripColors.should.containEql('Could not find Titanium plugin id=commandtest version=2.0');

				var found = false;
				for (var i = 0; !found && i < result.missing.length; i++) {
					found = result.missing[i].id == 'commandtest';
				}
				assert(found, '"commandtest" plugin not marked as missing');

				done();
			});
		});

		it('should not find doesnotexist plugin', function (done) {
			var logger = new MockLogger;
			appc.tiplugin.find([
				{ id: 'doesnotexist' }
			], path.join(__dirname, 'resources', 'tiplugin'), {}, logger, function (result) {
				logger.buffer.stripColors.should.containEql('Could not find Titanium plugin id=doesnotexist version=latest');

				var found = false;
				for (var i = 0; !found && i < result.missing.length; i++) {
					found = result.missing[i].id == 'doesnotexist';
				}
				assert(found, '"doesnotexist" plugin not marked as missing');

				done();
			});
		});
	});
});
