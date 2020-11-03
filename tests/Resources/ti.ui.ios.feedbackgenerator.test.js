/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2015-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
'use strict';
const should = require('./utilities/assertions');

describe.ios('Titanium.UI.iOS', () => {
	it('#createFeedbackGenerator()', () => {
		should(Titanium.UI.iOS.createFeedbackGenerator).be.a.Function();
	});
});

describe.ios('Titanium.UI.iOS.FeedbackGenerator', () => {
	it('.apiName', () => {
		const generator = Titanium.UI.iOS.createFeedbackGenerator();
		should(generator).have.readOnlyProperty('apiName').which.is.a.String();
		should(generator.apiName).eql('Ti.UI.iOS.FeedbackGenerator');
	});

	describe('.type', () => {
		it('is a Number',  () => {
			const generator = Titanium.UI.iOS.createFeedbackGenerator();
			should(generator).have.a.property('type').which.is.a.Number();
		});
	});

	// FIXME: Only available at creation, so doesn't expose the property!
	// describe('.style', () => {
	// 	it('is a Number',  () => {
	// 		const generator = Titanium.UI.iOS.createFeedbackGenerator();
	// 		should(generator).have.a.property('style').which.is.a.Number();
	// 	});

	// 	it('defaults to Titanium.UI.iOS.FEEDBACK_GENERATOR_IMPACT_STYLE_MEDIUM',  () => {
	// 		const generator = Titanium.UI.iOS.createFeedbackGenerator();
	// 		should(generator.style).eql(Titanium.UI.iOS.FEEDBACK_GENERATOR_IMPACT_STYLE_MEDIUM);
	// 	});
	// });

	describe('#prepare', () => {
		it('is a Function',  () => {
			const generator = Titanium.UI.iOS.createFeedbackGenerator();
			should(generator).have.a.property('prepare').which.is.a.Function();
		});
	});

	describe('#selectionChanged', () => {
		it('is a Function',  () => {
			const generator = Titanium.UI.iOS.createFeedbackGenerator();
			should(generator).have.a.property('selectionChanged').which.is.a.Function();
		});
	});

	describe('#impactOccurred', () => {
		it('is a Function',  () => {
			const generator = Titanium.UI.iOS.createFeedbackGenerator();
			should(generator).have.a.property('impactOccurred').which.is.a.Function();
		});
	});

	describe('#notificationOccurred', () => {
		it('is a Function',  () => {
			const generator = Titanium.UI.iOS.createFeedbackGenerator();
			should(generator).have.a.property('notificationOccurred').which.is.a.Function();
		});
	});

	describe('example', () => {
		it('works', () => {
			should.doesNotThrow(() => {
				const generator = Ti.UI.iOS.createFeedbackGenerator({
					type: Ti.UI.iOS.FEEDBACK_GENERATOR_TYPE_IMPACT,
					style: Ti.UI.iOS.FEEDBACK_GENERATOR_IMPACT_STYLE_LIGHT
				});
				generator.impactOccurred();
			});
		});
	});
});
