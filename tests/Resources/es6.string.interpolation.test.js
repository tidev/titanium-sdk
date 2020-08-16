/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2017-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
import './utilities/assertions';

describe('ES6 String Interpolation', function () {

	it('expands simple string value expressions into string template', function () {
		const name = 'Bob';
		const time = 'today';
		const result = `Hello ${name}, how are you ${time}?`;
		result.should.eql('Hello Bob, how are you today?');
	});
});
