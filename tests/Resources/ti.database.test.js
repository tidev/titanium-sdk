/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
'use strict';
const should = require('./utilities/assertions');

describe('Titanium.Database', function () {
	it('apiName', function () {
		should(Ti.Database.apiName).be.eql('Ti.Database');
		should(Ti.Database).have.readOnlyProperty('apiName').which.is.a.String;
	});

	it('FIELD_TYPE_DOUBLE', function () {
		should(Ti.Database).have.constant('FIELD_TYPE_DOUBLE').which.is.a.Number;
	});

	it('FIELD_TYPE_FLOAT', function () {
		should(Ti.Database).have.constant('FIELD_TYPE_FLOAT').which.is.a.Number;
	});

	it('FIELD_TYPE_INT', function () {
		should(Ti.Database).have.constant('FIELD_TYPE_INT').which.is.a.Number;
	});

	it('FIELD_TYPE_STRING', function () {
		should(Ti.Database).have.constant('FIELD_TYPE_STRING').which.is.a.Number;
	});

	describe('.install()', () => {
		it('is a function', () => {
			should(Ti.Database.install).not.be.undefined;
			should(Ti.Database.install).be.a.Function;
		});

		// FIXME Get working for iOS - gets back John Smith\\u0000'
		// FIXME Get working on Android, either lastInsertRowId or rowsAffected is starting as 1, not 0
		it.androidAndIosBroken('copies db from app folder', function () {
			// Database name
			var dbName = 'testDbInstall';

			// Copy database 'testDbResource.db' over from the application folder
			// into the application data folder as 'testDbInstall'
			var db = Ti.Database.install('testDbResource.db', dbName);

			// Confirm 'db' is an object
			should(db).be.a.Object;

			// Confirm 'db.file' property is a valid object
			should(db.file).be.a.Object;

			// Validate the 'db.lastInsertRowId' property
			should(db.lastInsertRowId).be.a.Number;
			should(db.lastInsertRowId).be.eql(0);

			// Confirm 'db.name' is a string
			should(db.name).be.a.String;
			should(db.name).be.eql(dbName);

			// Validate the 'db.rowsAffected' property
			should(db.rowsAffected).be.a.Number;
			should(db.rowsAffected).be.eql(0);

			// Define test data
			var testName = 'John Smith';
			var testNumber = 123456789;
			var testArray = [ 'Smith John', 987654321 ];

			// Execute a query to return the rows of the database
			var rows = db.execute('SELECT rowid, text, number FROM testTable');

			// Validate the returned 'rows' object
			should(rows).be.a.Object;
			should(rows.rowCount).be.eql(2);
			should(rows.fieldCount).be.eql(3);
			// Validate field names
			should(rows.fieldName(0)).be.eql('rowid');
			should(rows.fieldName(1)).be.eql('text');
			should(rows.fieldName(2)).be.eql('number');

			// Loop through each row
			var index = 1;
			while (rows.isValidRow()) {

				// Validate the rowid field
				var rowid = rows.fieldByName('rowid');
				should(rowid).be.a.Number;
				should(rowid).be.eql(index);

				// Case insensitive search
				rowid = rows.fieldByName('ROWID');
				should(rowid).be.a.Number;
				should(rowid).be.eql(index);

				// Validate the text field
				var text = rows.field(1);
				should(text).be.a.String;

				// Validate the number field
				var number = rows.fieldByName('number');
				should(number).be.a.Number;

				// Case insensitive search
				number = rows.fieldByName('NUMBER');
				should(number).be.a.Number;

				// Validate the test data
				if (index === 1) {
					should(text).be.eql(testName);
					should(number).be.eql(testNumber);
				} else if (index === 2) {
					should(number).be.eql(testArray[1]);
					should(text).be.eql(testArray[0]);
				}

				// Next row
				rows.next();
				index++;
			}

			// Close the 'rows' object
			rows.close();

			// test aliased field name
			var aliased = db.execute('SELECT rowid, text AS something FROM testTable');

			// Validate the returned 'rows' object
			should(aliased).be.a.Object;
			should(aliased.rowCount).be.eql(2);
			should(aliased.fieldCount).be.eql(2);
			// Validate field names
			should(aliased.fieldName(0)).be.eql('rowid');
			should(aliased.fieldName(1)).be.eql('something');

			// Close the 'rows' object
			aliased.close();

			// Remove the 'testDbInstall' database file
			db.remove();

			// Close the database (unnecessary as remove() does this for us)
			db.close();
		});

		// If the source db file was not found, then install() must throw an exception.
		it('throws if missing source db', () => {
			should.throws(() => {
				Ti.Database.install('BadFilePath.db', 'IShouldNotExist.db');
			}, Error);
		});
	});

	describe('.open()', () => {
		// Check if open exists and make sure it does not throw exception
		// FIXME Get working on Android, either lastInsertRowId or rowsAffected is starting as 1, not 0
		it.androidBroken('opens or creates database', function () {
			should(Ti.Database.open).not.be.undefined;
			should(Ti.Database.open).be.a.Function;

			// Database name
			var dbName = 'testDbOpen';

			// Open database 'testDbOpen' if it exists in the
			// application data folder, otherwise create a new one
			var db = Ti.Database.open(dbName);

			// Confirm 'db' is an object
			should(db).be.a.Object;

			// Confirm 'db.file' property is a valid object
			should(db.file).be.a.Object;

			// Validate the 'db.lastInsertRowId' property
			should(db.lastInsertRowId).be.a.Number;
			should(db.lastInsertRowId).be.eql(0);

			// Confirm 'db.name' is a string
			should(db.name).be.a.String;
			should(db.name).be.eql(dbName);

			// Validate the 'db.rowsAffected' property
			should(db.rowsAffected).be.a.Number;
			should(db.rowsAffected).be.eql(0);

			// Execute a query to create a test table
			db.execute('CREATE TABLE IF NOT EXISTS testTable (text TEXT, number INTEGER)');

			// Delete any existing data if the table already existed
			db.execute('DELETE FROM testTable');

			// Define test data
			var testName = 'John Smith';
			var testNumber = 123456789;

			// Insert test data into the table
			db.execute('INSERT INTO testTable (text, number) VALUES (?, ?)', testName, testNumber);

			// Validate that only one row has been affected
			should(db.rowsAffected).be.eql(1);

			// Define more test data
			var testArray = [ 'Smith John', 987654321 ];

			// Insert more test data into the table
			db.execute('INSERT INTO testTable (text, number) VALUES (?, ?)', testArray);

			// Validate that only one row has been affected
			should(db.rowsAffected).be.eql(1);

			// Execute a query to return the rows of the database
			var rows = db.execute('SELECT rowid, text, number FROM testTable');

			// Validate the returned 'rows' object
			should(rows).be.a.Object;
			should(rows.rowCount).be.eql(2);
			should(rows.fieldCount).be.eql(3);
			should(rows.validRow).be.true;
			should(rows.isValidRow()).be.true;

			// Loop through each row
			var index = 1;
			while (rows.isValidRow()) {

				// Validate the rowid field
				var rowid = rows.fieldByName('rowid');
				should(rowid).be.a.Number;
				should(rowid).be.eql(index);

				// Validate the text field
				var text = rows.field(1);
				should(text).be.a.String;

				// Validate the number field
				var number = rows.fieldByName('number');
				should(number).be.a.Number;

				// Validate the test data
				if (index === 1) {
					should(text).be.eql(testName);
					should(number).be.eql(testNumber);
				} else if (index === 2) {
					should(number).be.eql(testArray[1]);
					should(text).be.eql(testArray[0]);
				}

				// Next row
				rows.next();
				index++;
			}

			// Close the 'rows' object
			rows.close();

			// Remove the 'testDbInstall' database file
			db.remove();

			// Close the database (unnecessary as remove() does this for us)
			db.close();
		});
	});

	// Check if it guards against 'closed' results
	// FIXME Get working on Android, seems to retain rowCount after Result.close()
	it.androidBroken('guards multiple calls to ResultSet#close()', function () {
		// Database name
		var dbName = 'testDbOpen';

		// Open database 'testDbOpen' if it exists in the
		// application data folder, otherwise create a new one
		var db = Ti.Database.open(dbName);

		// Execute a query to create a test table
		db.execute('CREATE TABLE IF NOT EXISTS testTable (text TEXT, number INTEGER)');

		// Delete any existing data if the table already existed
		db.execute('DELETE FROM testTable');

		// Define test data
		var testName = 'John Smith';
		var testNumber = 123456789;

		// Insert test data into the table
		db.execute('INSERT INTO testTable (text, number) VALUES (?, ?)', testName, testNumber);

		// Validate that only one row has been affected
		should(db.rowsAffected).be.eql(1);

		// Define more test data
		var testArray = [ 'Smith John', 987654321 ];

		// Insert more test data into the table
		db.execute('INSERT INTO testTable (text, number) VALUES (?, ?)', testArray);

		// Validate that only one row has been affected
		should(db.rowsAffected).be.eql(1);

		// Execute a query to return the rows of the database
		var rows = db.execute('SELECT rowid, text, number FROM testTable');

		// Validate the returned 'rows' object
		should(rows).be.a.Object;
		should(rows.rowCount).be.eql(2);
		should(rows.fieldCount).be.eql(3);
		should(rows.validRow).be.true;

		// Close the 'rows' object
		rows.close();

		// Make sure row is not 'valid'
		should(rows.rowCount).be.eql(0); // Android still reports 2
		should(rows.fieldCount).be.eql(0);
		should(rows.validRow).be.false;

		// Validate the rowid field
		var rowid = rows.fieldByName('rowid');
		should(rowid).not.exist; // null or undefined

		// Validate the closed field
		var field1 = rows.field(1);
		should(field1).not.exist; // null or undefined

		var field2 = rows.fieldByName('number');
		should(field2).not.exist; // null or undefined

		// Make sure next doesn't cause crash and return false
		should(rows.next()).be.false;

		// Make sure closing again doesn't cause crash
		rows.close();

		// Remove the 'testDbInstall' database file
		db.remove();

		// Close the database (unnecessary as remove() does this for us)
		db.close();
	});

	describe('#execute()', () => {
		it('is a function', () => {
			const db = Ti.Database.open('execute.db');
			try {
				should(db.execute).be.a.Function;
			} finally {
				db.close();
			}
		});

		// Test behavior expected by alloy code for createCollection. See TIMOB-20222
		// skip this test, this behaviour is undocumented. Our current code will return null
		// only if the result contains no fields/columns instead of the result containing no rows
		it.skip('returns null instead of empty result set for pragma command', function () { // eslint-disable-line mocha/no-skipped-tests
			// Call install on a database file that doesn't exist. We should just make a new db with name 'category'
			const db = Ti.Database.install('made.up.sqlite', 'category');

			try {
				// Confirm 'db' is an object
				should(db).be.a.Object;
				const rows = db.execute('pragma table_info(\'category\');');
				should(rows).be.null;
			} finally {
				// Remove the 'category' database file
				db.remove();

				// Close the database (unnecessary as remove() does this for us)
				db.close();
			}
		});

		it('throws Error for invalid SQL statement', () => { // eslint-disable-line mocha/no-identical-title
			const db = Ti.Database.open('execute.db');
			try {
				should.throws(() => {
					db.execute('THIS IS INVALID SQL');
				}, Error);
			} catch (e) {
				db.close();
				throw e;
			}
		});
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

	describe.windowsMissing('#executeAsync()', () => {
		it('is a function', () => {
			const db = Ti.Database.open('execute_async.db');
			try {
				should(db.executeAsync).be.a.Function;
			} finally {
				db.close();
			}
		});

		it('executes asynchronously', function (finish) {
			this.timeout(5000);
			const db = Ti.Database.open('execute_async.db');
			// Execute a query to create a test table
			db.executeAsync('CREATE TABLE IF NOT EXISTS testTable (text TEXT, number INTEGER)', err => {
				should(err).not.exist;
				// Delete any existing data if the table already existed
				db.executeAsync('DELETE FROM testTable', err => {
					should(err).not.exist;

					// Define test data
					const testName = 'John Smith';
					const testNumber = 123456789;

					// Insert test data into the table
					db.executeAsync('INSERT INTO testTable (text, number) VALUES (?, ?)', testName, testNumber, err => {
						should(err).not.exist;

						// Validate that only one row has been affected
						should(db.rowsAffected).be.eql(1);

						// Execute a query to return the rows of the database
						db.executeAsync('SELECT rowid, text, number FROM testTable', (err, rows) => {
							try {
								should(err).not.exist;
								// Validate the returned 'rows' object
								should(rows).be.a.Object;
								should(rows.rowCount).be.eql(1);
								should(rows.fieldCount).be.eql(3);
								should(rows.validRow).be.true;

								finish();
							} catch (e) {
								finish(e);
							} finally {
								// Close the 'rows' object
								rows.close();
								db.close();
							}
						});
					});
				});
			});
		});

		it('calls callback with Error for invalid SQL', function (finish) {
			const db = Ti.Database.open('execute_async.db');
			db.executeAsync('THIS IS SOME INVALID SQL', err => {
				try {
					should(err).exist;
					finish();
				} catch (e) {
					finish(e);
				} finally {
					db.close();
				}
			});
		});
	});

	describe.windowsMissing('#executeAll()', () => {
		it('is a function', () => { // eslint-disable-line mocha/no-identical-title
			const db = Ti.Database.open('execute_all.db');
			try {
				should(db.executeAll).be.a.Function;
			} finally {
				db.close();
			}
		});

		it('executes synchronously', function (finish) {
			this.timeout(5000);
			const db = Ti.Database.open('execute_all.db');

			// FIXME: There's no way to send in binding paramaters, you have to bake them into the query string with this API
			const queries = [
				// Execute a query to create a test table
				'CREATE TABLE IF NOT EXISTS testTable (text TEXT, number INTEGER)',
				// Delete any existing data if the table already existed
				'DELETE FROM testTable',
				// Insert test data into the table
				'INSERT INTO testTable (text, number) VALUES (\'John Smith\', 123456789)',
				// Execute a query to return the rows of the database
				'SELECT rowid, text, number FROM testTable',
			];

			let rows;
			try {
				const results = db.executeAll(queries);
				// the returned results array should be the same length as the input query array
				should(results.length).eql(queries.length);

				rows = results[3];
				// TODO: If a consumer calls executeAll and some of them return a result set, is the caller expected to explicitly close
				// all the non-null result sets returned?!

				// Validate the returned 'rows' object
				should(rows).be.a.Object;
				should(rows.rowCount).be.eql(1);
				should(rows.fieldCount).be.eql(3);
				should(rows.validRow).be.true;

				finish();
			} catch (e) {
				finish(e);
			} finally {
				// Close the 'rows' object
				if (rows) {
					rows.close();
				}
				db.close();
			}
		});

		it('throws Error for invalid SQL statement', () => { // eslint-disable-line mocha/no-identical-title
			const db = Ti.Database.open('execute_all.db');

			const queries = [
				'THIS IS INVALID SQL',
			];

			try {
				db.executeAll(queries);
			} catch (e) {
				should(e).exist;
				// we fire a custom Error with index pointing at the offending query
				should(e.index).eql(0);
				should(e.results).exist;
				return;
			} finally {
				db.close();
			}
			should.fail(true, false, 'Expected to throw an exception for invalid sql');
		});
	});

	describe.windowsMissing('#executeAllAsync()', () => {
		it('is a function', () => { // eslint-disable-line mocha/no-identical-title
			const db = Ti.Database.open('execute_all_async.db');
			try {
				should(db.executeAllAsync).be.a.Function;
			} finally {
				db.close();
			}
		});

		it('executes asynchronously', function (finish) { // eslint-disable-line mocha/no-identical-title
			this.timeout(5000);
			const db = Ti.Database.open('execute_all.db');

			const queries = [
				// Execute a query to create a test table
				'CREATE TABLE IF NOT EXISTS testTable (text TEXT, number INTEGER)',
				// Delete any existing data if the table already existed
				'DELETE FROM testTable',
				// Insert test data into the table
				'INSERT INTO testTable (text, number) VALUES (\'John Smith\', 123456789)',
				// Execute a query to return the rows of the database
				'SELECT rowid, text, number FROM testTable',
			];

			try {
				db.executeAllAsync(queries, (err, results) => {
					let rows;
					try {
						should(err).not.exist;
						// the returned results array should be the same length as the input query array
						should(results.length).eql(queries.length);

						rows = results[3];
						// Validate the returned 'rows' object
						should(rows).be.a.Object;
						should(rows.rowCount).be.eql(1);
						should(rows.fieldCount).be.eql(3);
						should(rows.validRow).be.true;

						finish();
					} catch (e) {
						finish(e);
					} finally {
						// Close the 'rows' object
						if (rows) {
							rows.close();
						}
						db.close();
					}
				});
			} catch (e) {
				db.close();
				finish(e);
			}
		});

		it('calls callback with Error for invalid SQL statement', function (finish) { // eslint-disable-line mocha/no-identical-title
			const db = Ti.Database.open('execute_all.db');

			const queries = [
				// Execute a query to create a test table
				'CREATE TABLE IF NOT EXISTS testTable (text TEXT, number INTEGER)',
				// Delete any existing data if the table already existed
				'DELETE FROM testTable',
				// Insert test data into the table
				'INSERT INTO testTable (text, number) VALUES (\'John Smith\', 123456789)',
				// Execute a query to return the rows of the database
				'SELECT rowid, text, number FROM testTable',
				// invalid, should fail here!
				'THIS IS INVALID SQL',
			];

			try {
				db.executeAllAsync(queries, (err, results) => {
					let rows;
					try {
						should(err).exist;
						should(err.index).eql(4);
						should(results).be.an.Array;

						// validate our partial results
						rows = results[3];
						should(rows).be.a.Object;
						should(rows.rowCount).be.eql(1);
						should(rows.fieldCount).be.eql(3);
						should(rows.validRow).be.true;

						finish();
					} catch (e) {
						finish(e);
					} finally {
						if (rows) {
							rows.close();
						}
						db.close();
					}
				});
			} catch (e) {
				// should call callback with error, not throw it!
				db.close();
				finish(e);
			}
		});

		it('handles being closed mid-query', function (finish) {
			this.timeout(30000);
			this.slow(2000);
			const db = Ti.Database.open('execute_all_async.db');
			const queries = [
				// Execute a query to create a test table
				'CREATE TABLE IF NOT EXISTS testTable (text TEXT, number INTEGER)',
				// Delete any existing data if the table already existed
				'DELETE FROM testTable'
			];
			// insert a lot of bogus data
			for (let i = 0; i < 10000; i++) {
				queries.push(`INSERT INTO testTable (text, number) VALUES ('John Smith ${i}', ${i})`);
			}

			db.executeAllAsync(queries, (err, results) => {
				// this should eventually throw an error when it gets closed mid-queries
				try {
					should(err).exist;
					// We should be giving custom properties so user can see what index we failed on, get partial results
					should(err.index).be.a.Number;
					should(results).be.an.Array;
					finish();
				} catch (e) {
					finish(e);
				} finally {
					db.close();
				}
			});
			// close the db while we're executing queries
			setTimeout(() => {
				try {
					db.close();
				} catch (err) {
					finish(err);
				}
			}, 50);
		});

		function executeQueriesAsync(finish) {
			const db = Ti.Database.open('executeQueriesAsync.db');

			const queries = [
				// Execute a query to create a test table
				'CREATE TABLE IF NOT EXISTS testTable (text TEXT, number INTEGER)',
				// Delete any existing data if the table already existed
				'DELETE FROM testTable'
			];
			// insert a lot of bogus data
			for (let i = 0; i < 5000; i++) {
				queries.push(`INSERT INTO testTable (text, number) VALUES ('John Smith ${i}', ${i})`);
			}
			// this should just continue on until it's done...
			db.executeAllAsync(queries, (err, results) => {
				try {
					should(err).not.exist;
					should(results).exist;
					finish();
				} catch (e) {
					finish(e);
				}
			});
		}

		// Try to get the db object to get GC'd while we're running queries!
		// Note that I can't really think of any better way to try and test this scenario
		it('does not allow DB to be GC\'d', function (finish) {
			this.timeout(60000);
			this.slow(20000);
			// note that we call a fucntion that has a db instance scope to it and not referenced elsewhere,
			// not explicitly closed, not referenced in the async callback
			executeQueriesAsync(finish);
		});
	});
});
