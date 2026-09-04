/*
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License.
 * Please see the LICENSE included with this distribution for details.
 */

import { expect } from 'chai';
import * as reporter from '../../../build/lib/test/reporter.js';

describe('reporter module exports', function () {
	it('exports handleBuild as a function', () => {
		expect(reporter.handleBuild).to.be.a('function');
	});
	it('exports outputResults as a function', () => {
		expect(reporter.outputResults).to.be.a('function');
	});
	it('exports dedupeResults as a function', () => {
		expect(reporter.dedupeResults).to.be.a('function');
	});
	it('exports extractBalancedJSON as a function', () => {
		expect(reporter.extractBalancedJSON).to.be.a('function');
	});
	it('exports massageJSONString as a function', () => {
		expect(reporter.massageJSONString).to.be.a('function');
	});
	it('exports generateJUnitPrefix as a function', () => {
		expect(reporter.generateJUnitPrefix).to.be.a('function');
	});
	it('exports outputJUnitXML as a function', () => {
		expect(reporter.outputJUnitXML).to.be.a('function');
	});
	it('exports DeviceTestDetails as a class', () => {
		expect(reporter.DeviceTestDetails).to.be.a('function');
	});
	it('exports the prefix constants', () => {
		expect(reporter.TEST_END_PREFIX).to.equal('!TEST_END: ');
		expect(reporter.TEST_START_PREFIX).to.equal('!TEST_START: ');
		expect(reporter.TEST_SUITE_STOP).to.equal('!TEST_RESULTS_STOP!');
		expect(reporter.OS_VERSION_PREFIX).to.equal('OS_VERSION: ');
		expect(reporter.GENERATED_IMAGE_PREFIX).to.equal('!IMAGE: ');
		expect(reporter.DIFF_IMAGE_PREFIX).to.equal('!IMG_DIFF: ');
	});
});
