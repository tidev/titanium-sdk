/*
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* global OS_IOS */
/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */

'use strict';

const should = require('./utilities/assertions');

describe.windowsBroken('Core', () => {
	describe('Runtime', () => {
		describe('hasProperty', () => {
			describe('Top-Module', () => {
				describe('Submodules', () => {
					it('should check for sub-module', () => {
						Ti.should.have.property('UI');
						Ti.should.not.have.property('Foo');
					});
				});

				describe('Custom properties', () => {
					it('should check for custom properties', () => {
						Ti.should.not.have.property('custom');
						Ti.custom = {};
						Ti.should.have.property('custom');
					});
				});
			});

			describe('Proxy', () => {
				describe('constructor', () => {
					it('should be correctly set on a proxy', () => {
						const view = Ti.UI.createView();
						view.should.have.property('constructor');
						should(view.constructor).be.a.Function();
					});
				});

				describe('Properties', () => {
					it('should check for properties on the object\'s target', () => {
						const view = Ti.UI.createView({
							backgroundColor: 'black'
						});
						view.should.not.have.property('bollocks');
						view.should.have.property('backgroundColor');
					});

					it('should check for custom properties', () => {
						const view = Ti.UI.createView();
						view.should.not.have.property('bollocks');
						view.should.not.have.property('foo');
						view.foo = 'bar';
						view.should.have.property('foo');
						view.foo.should.be.equal('bar');
					});

					it('should properly handle properties with value of nil (TIMOB-26452)', () => {
						should(Ti.Geolocation).have.property('lastGeolocation');
						if (OS_IOS) {
							should.not.exist(Ti.Geolocation.lastGeolocation);
						} else {
							should.exist(Ti.Geolocation.lastGeolocation);
						}
					});
				});

				describe('toString/valueOf', () => {
					it('should be available on any proxy', () => {
						const view = Ti.UI.createView();
						view.should.have.property('toString');
						view.should.have.property('valueOf');
					});
				});

				describe('className', () => {
					it.ios('should be availably on any proxy', () => {
						const view = Ti.UI.createView();
						view.should.have.property('className');
					});
				});

				describe('Methods', () => {
					it('should check for methods on the object\'s target', () => {
						const view = Ti.UI.createView();
						view.should.not.have.property('addSomething');
						view.should.have.property('add');
						should(view.add).be.a.Function();
					});
				});

				describe('Factory Methods', () => {
					it('should check for dynamic create factory method', () => {
						Ti.UI.should.have.property('createView');
						const view = Ti.UI.createView();
						view.should.not.have.property('createSomething');
					});
				});
			});
		});

		describe('Static Method Reference', () => {
			it.iosBroken('should allow referencing static createProxy method and invoke it', () => {
				// Reference static method.
				const createBuffer = Ti.createBuffer;
				should(createBuffer).be.a.Function();

				// Attempt to call static method.
				const result = createBuffer({}); // ios fails with: "self type check failed for Objective-C instance method"
				should(result).be.a.Object();
			});
		});
	});
});
