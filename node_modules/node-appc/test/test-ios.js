/**
 * node-appc - Appcelerator Common Library for Node.js
 * Copyright (c) 2009-2014 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

var appc = require('../index');

describe('ios', function () {
	it('namespace exists', function () {
		appc.should.have.property('ios');
		appc.ios.should.be.an.Object;
	});

	describe('#detect()', function () {
		it('result is valid', function (done) {
			this.timeout('5s');

			appc.ios.detect(function (result) {
				if (result == undefined) {
					return done();
				}

				result.should.be.an.Object;

				result.should.have.property('xcode');
				result.xcode.should.be.an.Object;
				Object.keys(result.xcode).forEach(function (ver) {
					result.xcode[ver].should.be.an.Object;
					result.xcode[ver].should.have.property('path');
					result.xcode[ver].should.have.property('xcodeapp');
					result.xcode[ver].should.have.property('xcodebuild');
					result.xcode[ver].should.have.property('selected');
					result.xcode[ver].should.have.property('version');
					result.xcode[ver].should.have.property('build');
					result.xcode[ver].should.have.property('sdks');
					result.xcode[ver].should.have.property('sims');
					result.xcode[ver].path.should.be.a.String;
					result.xcode[ver].xcodeapp.should.be.a.String;
					result.xcode[ver].xcodebuild.should.be.a.String;
					result.xcode[ver].selected.should.be.a.Boolean;
					result.xcode[ver].version.should.be.a.String;
					result.xcode[ver].build.should.be.a.String;
					result.xcode[ver].sdks.should.be.an.instanceOf(Array);
					result.xcode[ver].sims.should.be.an.instanceOf(Array);
				});

				result.should.have.property('certs');
				result.certs.should.be.an.Object;

				result.certs.should.have.property('keychains');
				result.certs.keychains.should.be.an.Object;
				Object.keys(result.certs.keychains).forEach(function (keychain) {
					result.certs.keychains[keychain].should.be.an.Object;
					if (result.certs.keychains[keychain].developer) {
						result.certs.keychains[keychain].developer.should.be.an.instanceOf(Array);
						result.certs.keychains[keychain].developer.forEach(function (d) {
							d.should.be.a.String;
						});
					}
					if (result.certs.keychains[keychain].distribution) {
						result.certs.keychains[keychain].distribution.should.be.an.instanceOf(Array);
						result.certs.keychains[keychain].distribution.forEach(function (d) {
							d.should.be.a.String;
						});
					}
				});

				result.certs.should.have.property('wwdr');
				result.certs.wwdr.should.be.a.Boolean;

				result.certs.should.have.property('devNames');
				result.certs.devNames.should.be.an.instanceOf(Array);
				result.certs.devNames.forEach(function (d) {
					d.should.be.a.String;
				});

				result.certs.should.have.property('distNames');
				result.certs.distNames.should.be.an.instanceOf(Array);
				result.certs.distNames.forEach(function (d) {
					d.should.be.a.String;
				});

				result.should.have.property('provisioningProfiles');
				result.provisioningProfiles.should.be.an.Object;

				result.provisioningProfiles.should.have.property('adhoc');
				['adhoc', 'enterprise', 'development', 'distribution'].forEach(function (type) {
					result.provisioningProfiles[type].should.be.an.instanceOf(Array);
					result.provisioningProfiles[type].forEach(function (pp) {
						pp.should.be.an.Object;
						pp.should.have.property('uuid');
						pp.should.have.property('name');
						pp.should.have.property('appPrefix');
						pp.should.have.property('appId');
						pp.should.have.property('getTaskAllow');
						pp.should.have.property('apsEnvironment');
						pp.uuid.should.be.a.String;
						pp.name.should.be.a.String;
						pp.appPrefix.should.be.a.String;
						pp.appId.should.be.a.String;
						pp.getTaskAllow.should.be.a.Boolean;
						pp.apsEnvironment.should.be.a.String;
					});
				});

				result.should.have.property('keychains');
				result.keychains.should.be.an.instanceOf(Array);
				result.keychains.forEach(function (keychain) {
					keychain.should.be.a.String;
				});

				done();
			});
		});
	});
});