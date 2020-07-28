/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2020-Present by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* eslint no-unused-vars: "off" */
/* eslint no-unused-expressions: "off" */
/* eslint max-len: "off" */
/* eslint no-undef: "off" */
/* eslint comma-spacing: "off" */
/* eslint array-bracket-spacing: "off" */
'use strict';
const should = require('./utilities/assertions');

describe('WebAssembly', () => {
	it('WebAssembly definition', () => {
		WebAssembly.should.be.an.Object();
	});

	it('WebAssembly load and execute module', () => {
		const WASM_BUFFER = new Uint8Array([0,97,115,109,1,0,0,0,1,133,128,128,128,0,1,96,0,1,127,3,130,128,128,128,0,1,0,4,132,128,128,128,0,1,112,0,0,5,131,128,128,128,0,1,0,1,6,129,128,128,128,0,0,7,145,128,128,128,0,2,6,109,101,109,111,114,121,2,0,4,109,97,105,110,0,0,10,138,128,128,128,0,1,132,128,128,128,0,0,65,42,11]);
		const WASM_MODULE = new WebAssembly.Module(WASM_BUFFER);

		const instance = new WebAssembly.Instance(WASM_MODULE).exports;
		instance.main().should.eql(42);
	});
});
