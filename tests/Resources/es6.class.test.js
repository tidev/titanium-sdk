/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2018 by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */

import Test from './es6.class';
import should from './utilities/assertions';

const SUCCESS = 'SUCCESS!';

describe('ES6 Class', function () {

	it('imported class', function () {
		const test = new Test();

		should(test.testGetterSetter).equal('GETTER');
		test.testGetterSetter = 'SETTER'; // setter always sets SUCCESS
		should(test.testGetterSetter).equal(SUCCESS);

		should(test.testProperty).equal(SUCCESS);

		should(Test.testStaticConstant).equal(SUCCESS);

		should(test.testMethod).be.a.Function();
		should(test.testMethod()).equal(SUCCESS);

		should(Test.testStaticMethod).be.a.Function();
		should(Test.testStaticMethod()).equal(SUCCESS);
	});
});
