/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2019-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
'use strict';
const should = require('./utilities/assertions');

describe.ios('Ti.Network.BonjourService', () => {
	const service = Ti.Network.createBonjourService();

	it('.apiName', () => {
		should(service).have.a.readOnlyProperty('apiName').which.is.a.String();
		should(service.apiName).be.eql('Ti.Network.BonjourService');
	});

	describe('.domain', () => {
		it('is a String', () => {
			should(service).have.a.property('domain').which.is.a.String();
		});

		it('defaults to null', () => {
			should(service.domain).eql('local.');
		});
	});

	describe('.isLocal', () => {
		it('is a Boolean', () => {
			should(service).have.a.property('isLocal').which.is.a.Boolean();
		});

		it('defaults to true', () => {
			should(service.isLocal).eql(true);
		});
	});

	describe('.name', () => {
		// FIXME: Defaults to undefined so can't assert type
		// eslint-disable-next-line mocha/no-identical-title
		// it('is a String', () => {
		// 	should(service).have.a.property('name').which.is.a.String();
		// });

		// eslint-disable-next-line mocha/no-identical-title
		it('defaults to undefined', () => {
			should(service.name).eql(undefined);
		});
	});

	describe('.socket', () => {
		// FIXME: Defaults to undefined so can't assert type
		// it('is an Object', () => {
		// 	should(service).have.a.property('socket').which.is.an.Object();
		// });

		// eslint-disable-next-line mocha/no-identical-title
		it('defaults to undefined', () => {
			should(service.socket).eql(undefined);
		});
	});

	describe('.type', () => {
		// FIXME: defaults to undefined, so we can't assert this
		// eslint-disable-next-line mocha/no-identical-title
		// it('is a String', () => {
		// 	should(service).have.a.property('type').which.is.a.String();
		// });

		// eslint-disable-next-line mocha/no-identical-title
		it('defaults to undefined', () => {
			// TODO: Typically this would be something like '_http._tcp' or '._tcp'
			// see https://developer.apple.com/library/archive/documentation/Cocoa/Conceptual/NetServices/Articles/domainnames.html#//apple_ref/doc/uid/TP40002460-SW1
			// https://jonathanmumm.com/tech-it/mdns-bonjour-bible-common-service-strings-for-various-vendors/
			should(service.type).eql(undefined);
		});
	});

	describe('#publish()', () => {
		it('is a Function', () => {
			should(service).have.a.property('publish').which.is.a.Function();
		});

		it('throws if not given TCP Socket argument', () => {
			(() => service.publish()).should.throw('Attempt to publish service with no associated socket');
		});

		// TODO: Test throws if not local
		// it('throws if isLocal === false', () => {
		// 	const nonLocalService = null; //  TODO: Need to discover a non local service via Ti.Network.BonjourBrowser!
		// 	(() => nonLocalService.publish()).should.throw('Attempt to republish discovered Bonjour service');
		// });

		// TODO: test throws if already published
		// it('throws if already published', () => {
		// 	(() => service.publish()).should.throw('Attempt to republish service');
		// });
	});

	describe('#resolve()', () => {
		// eslint-disable-next-line mocha/no-identical-title
		it('is a Function', () => {
			should(service).have.a.property('resolve').which.is.a.Function();
		});

		// TODO: Test when already published
		// it('throws if already published', () => {
		// 	(() => service.resolve()).should.throw('Attempt to resolve published Bonjour service');
		// });

		// TODO: test when already resolved
		// it('throws if already resolved', () => {
		// 	(() => service.resolve()).should.throw('Attempt to re-resolve service');
		// });

		// TODO: Test with callback function only
		// TODO: Test with timeout only
		// TODO: test with timeout and callback function
	});

	describe('#stop()', () => {
		// eslint-disable-next-line mocha/no-identical-title
		it('is a Function', () => {
			should(service).have.a.property('stop').which.is.a.Function();
		});
	});
});
