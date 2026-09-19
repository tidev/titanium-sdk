/*
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License.
 * Please see the LICENSE included with this distribution for details.
 */

import { getSigningConfig } from './test.js';
import { expect } from 'chai';

describe('test.getSigningConfig', function () {
	afterEach(() => {
		delete process.env.TI_TEST_DEVELOPER_NAME;
		delete process.env.TI_TEST_PROVISIONING_PROFILE_UUID;
	});

	it('returns null fields when env vars are unset', () => {
		const config = getSigningConfig();
		expect(config.developerName).to.be.null;
		expect(config.provisioningProfileUuid).to.be.null;
	});

	it('returns the env var values when set', () => {
		process.env.TI_TEST_DEVELOPER_NAME = 'Test Team (XXXXXXXXXX)';
		process.env.TI_TEST_PROVISIONING_PROFILE_UUID = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
		const config = getSigningConfig();
		expect(config.developerName).to.equal('Test Team (XXXXXXXXXX)');
		expect(config.provisioningProfileUuid).to.equal('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee');
	});
});
