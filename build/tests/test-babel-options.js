/*
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

import { expect } from 'chai';
import { transformSync } from '@babel/core';
import { determineBabelOptions, EXCLUDED_COREJS_MODULES } from '../lib/builder.js';
import { IOS } from '../lib/ios.js';
import { AndroidBuilder } from '../lib/android.js';

const builderOptions = { sdkVersion: '0.0.0', gitHash: 'abcdef', timestamp: '1/1/2000 00:00' };

/**
 * Runs the same Babel configuration the SDK build uses on the `core-js/es` entry import
 * and returns the list of core-js modules it expands to.
 * @param {object} babelOptions platform Babel options
 * @returns {string[]} imported core-js module names
 */
function expandCoreJsEntry(babelOptions, withExclude = true) {
	const { presets, plugins } = determineBabelOptions(babelOptions);
	if (!withExclude) {
		delete presets[0][1].exclude;
	}
	const { code } = transformSync('import \'core-js/es\';', {
		filename: 'ti.main.js',
		configFile: false,
		babelrc: false,
		presets,
		plugins
	});
	return [ ...code.matchAll(/core-js\/modules\/([a-z0-9.-]+)/g) ].map(m => m[1]);
}

describe('build/lib/builder determineBabelOptions', () => {
	for (const [ name, Platform ] of [ [ 'ios', IOS ], [ 'android', AndroidBuilder ] ]) {
		describe(name, () => {
			let modules;
			before(() => {
				modules = expandCoreJsEntry(new Platform(builderOptions).babelOptions());
			});

			it('does not bundle the JSON.rawJSON polyfills', () => {
				for (const excluded of EXCLUDED_COREJS_MODULES) {
					expect(modules).to.not.include(excluded);
				}
			});

			it('would bundle the JSON.rawJSON polyfills without the exclude list', () => {
				const unfiltered = expandCoreJsEntry(new Platform(builderOptions).babelOptions(), false);
				expect(unfiltered).to.include.members(EXCLUDED_COREJS_MODULES);
			});

			it('still bundles the other es polyfills', () => {
				expect(modules.length).to.be.greaterThan(10);
			});
		});
	}
});
