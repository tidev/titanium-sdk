/**
 * node-appc - Appcelerator Common Library for Node.js
 * Copyright (c) 2009-2014 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

var appc = require('../index'),
	fs = require('fs'),
	path = require('path'),
	temp = require('temp');

describe('pkginfo', function () {
	it('namespace exists', function () {
		appc.should.have.property('pkginfo');
		appc.pkginfo.should.be.an.Object;
	});

	describe('#manifest()', function () {
		it('should find the manifest.json in current directory', function () {
			require('./resources/pkginfo/manifest')().should.eql({
				"version": "3.2.0",
				"moduleAPIVersion": "2",
				"timestamp": "06/18/13 16:07",
				"githash": "cc36fce",
				"platforms": ["android", "iphone", "mobileweb"]
			});
		});

		it('should find the manifest.json in parent directory', function () {
			require('./resources/pkginfo/subfolder/manifest')().should.eql({
				"version": "3.2.0",
				"moduleAPIVersion": "2",
				"timestamp": "06/18/13 16:07",
				"githash": "cc36fce",
				"platforms": ["android", "iphone", "mobileweb"]
			});
		});

		it('should not find the manifest.json from temp directory', function () {
			var file = temp.path(null, 'f-');
			fs.writeFileSync(file, "module.exports = function () { return require('" + path.resolve(__dirname, '..', 'index.js').replace(/\\/g, '\\\\') + "').pkginfo.manifest(module); };");
			try {
				require(file)().should.eql({});
				fs.unlinkSync(file);
			} catch (ex) {
				fs.unlinkSync(file);
				throw ex;
			}
		});
	});

	describe('#package()', function () {
		it('should find the package.json in current directory', function () {
			require('./resources/pkginfo/package')().should.eql({
				"name": "node-appc",
				"description": "Appcelerator Common Node Library",
				"homepage":"http://github.com/appcelerator/node-appc",
				"keywords": [
					"appcelerator"
				],
				"version": "0.2.0",
				"author": {
					"name": "Appcelerator, Inc.",
					"email": "info@appcelerator.com"
				},
				"maintainers": [
					{"name": "Jeff Haynie", "email": "jhaynie@appcelerator.com"},
					{"name": "Chris Barber", "email": "cbarber@appcelerator.com"}
				],
				"repository": {
					"type": "git",
					"url": "http://github.com/appcelerator/node-appc.git"
				},
				"dependencies": {
					"adm-zip": "~0.4.3",
					"async": "~0.2.9",
					"colors": "~0.6.0",
					"diff": "~1.0.4",
					"dox": "~0.4.3",
					"jade": "~0.31.2",
					"node-uuid": "~1.4.0",
					"optimist": "~0.6.0",
					"request": "~2.21.0",
					"semver": "~2.0.8",
					"sprintf": "~0.1.1",
					"temp": "~0.5.0",
					"wrench": "~1.5.0",
					"uglify-js": "~2.3.6",
					"xmldom": "~0.1.16"
				},
				"devDependencies": {
					"mocha": "*",
					"should": "*"
				},
				"license":"Apache Public License v2",
				"main": "./index",
				"engines": {
					"node": ">=0.8"
				},
				"scripts": {
					"test": "node forge test"
				}
			});
		});

		it('should find the package.json in parent directory', function () {
			require('./resources/pkginfo/subfolder/package')().should.eql({
				"name": "node-appc",
				"description": "Appcelerator Common Node Library",
				"homepage":"http://github.com/appcelerator/node-appc",
				"keywords": [
					"appcelerator"
				],
				"version": "0.2.0",
				"author": {
					"name": "Appcelerator, Inc.",
					"email": "info@appcelerator.com"
				},
				"maintainers": [
					{"name": "Jeff Haynie", "email": "jhaynie@appcelerator.com"},
					{"name": "Chris Barber", "email": "cbarber@appcelerator.com"}
				],
				"repository": {
					"type": "git",
					"url": "http://github.com/appcelerator/node-appc.git"
				},
				"dependencies": {
					"adm-zip": "~0.4.3",
					"async": "~0.2.9",
					"colors": "~0.6.0",
					"diff": "~1.0.4",
					"dox": "~0.4.3",
					"jade": "~0.31.2",
					"node-uuid": "~1.4.0",
					"optimist": "~0.6.0",
					"request": "~2.21.0",
					"semver": "~2.0.8",
					"sprintf": "~0.1.1",
					"temp": "~0.5.0",
					"wrench": "~1.5.0",
					"uglify-js": "~2.3.6",
					"xmldom": "~0.1.16"
				},
				"devDependencies": {
					"mocha": "*",
					"should": "*"
				},
				"license":"Apache Public License v2",
				"main": "./index",
				"engines": {
					"node": ">=0.8"
				},
				"scripts": {
					"test": "node forge test"
				}
			});
		});

		it('should only return the name and version', function () {
			require('./resources/pkginfo/package')('name', 'version').should.eql({
				"name": "node-appc",
				"version": "0.2.0"
			});
		});

		it('should not find the package.json from temp directory', function () {
			var file = temp.path(null, 'f-');
			fs.writeFileSync(file, "module.exports = function () { return require('" + path.resolve(__dirname, '..', 'index.js').replace(/\\/g, '\\\\') + "').pkginfo.package(module); };");
			try {
				require(file)().should.eql({});
				fs.unlinkSync(file);
			} catch (ex) {
				fs.unlinkSync(file);
				throw ex;
			}
		});
	});
});
