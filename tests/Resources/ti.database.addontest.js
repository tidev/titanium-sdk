/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* global Ti */
/* eslint no-unused-expressions: "off" */
'use strict';
var should = require('./utilities/assertions');

describe('Titanium.Database', function () {
	// If the source db file was not found, then install() must throw an exception.
	it('install missing source db', function () {
		let wasExceptionThrown = false;
		try {
			Ti.Database.install('BadFilePath.db', 'IShouldNotExist.db');
		} catch (err) {
			wasExceptionThrown = true;
		}
		should(wasExceptionThrown).be.true;
	});

	// Integer boundary tests.
	// Verify we can read/write largest/smallest 64-bit int values supported by JS number type.
	it('db read/write integer boundaries', function () {
		const MAX_SIGNED_INT32 = 2147483647;
		const MIN_SIGNED_INT32 = -2147483648;
		const MAX_SIGNED_INT16 = 32767;
		const MIN_SIGNED_INT16 = -32768;
		const rows = [
			Number.MAX_SAFE_INTEGER,
			MAX_SIGNED_INT32 + 1,
			MAX_SIGNED_INT32,
			MAX_SIGNED_INT16 + 1,
			MAX_SIGNED_INT16,
			1,
			0,
			-1,
			MIN_SIGNED_INT16,
			MIN_SIGNED_INT16 - 1,
			MIN_SIGNED_INT32,
			MIN_SIGNED_INT32 - 1,
			Number.MIN_SAFE_INTEGER
		];

		const dbConnection = Ti.Database.open('int_test.db');
		dbConnection.execute('CREATE TABLE IF NOT EXISTS intTable(id INTEGER PRIMARY KEY, intValue INTEGER);');
		dbConnection.execute('DELETE FROM intTable;');
		for (let index = 0; index < rows.length; index++) {
			dbConnection.execute('INSERT INTO intTable (id, intValue) VALUES (?, ?);', index, rows[index]);
		}
		const resultSet = dbConnection.execute('SELECT id, intValue FROM intTable ORDER BY id');
		should(resultSet.rowCount).eql(rows.length);
		for (let index = 0; resultSet.isValidRow(); resultSet.next(), index++) {
			should(resultSet.field(1)).eql(rows[index]);
		}
		dbConnection.close();
	});
});
