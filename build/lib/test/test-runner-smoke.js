/*
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License.
 * Please see the LICENSE included with this distribution for details.
 */

import { expect } from 'chai';
import * as runner from '../../../build/lib/test/runner.js';

describe('runner module exports', function () {
	it('exports test as a function', () => {
		expect(runner.test).to.be.a('function');
	});
	it('exports getSigningConfig as a function', () => {
		expect(runner.getSigningConfig).to.be.a('function');
	});
	it('exports the project constants', () => {
		expect(runner.PROJECT_NAME).to.be.a('string');
		expect(runner.APP_ID).to.be.a('string');
		expect(runner.ROOT_DIR).to.be.a('string');
		expect(runner.SOURCE_DIR).to.be.a('string');
		expect(runner.TMP_DIR).to.be.a('string');
		expect(runner.PROJECT_DIR).to.be.a('string');
		expect(runner.REPORT_DIR).to.be.a('string');
		expect(runner.JUNIT_TEMPLATE).to.be.a('string');
	});
	it('getSigningConfig reads env vars with null defaults', () => {
		const origDev = process.env.TI_TEST_DEVELOPER_NAME;
		const origPp = process.env.TI_TEST_PROVISIONING_PROFILE_UUID;
		delete process.env.TI_TEST_DEVELOPER_NAME;
		delete process.env.TI_TEST_PROVISIONING_PROFILE_UUID;
		const cfg = runner.getSigningConfig();
		expect(cfg.developerName).to.equal(null);
		expect(cfg.provisioningProfileUuid).to.equal(null);
		// Restore original env values. Assigning undefined to process.env.X
		// coerces to the string 'undefined' in Node, so delete instead when
		// the original was unset to avoid polluting other test suites.
		if (origDev === undefined) {
			delete process.env.TI_TEST_DEVELOPER_NAME;
		} else {
			process.env.TI_TEST_DEVELOPER_NAME = origDev;
		}
		if (origPp === undefined) {
			delete process.env.TI_TEST_PROVISIONING_PROFILE_UUID;
		} else {
			process.env.TI_TEST_PROVISIONING_PROFILE_UUID = origPp;
		}
	});
});
