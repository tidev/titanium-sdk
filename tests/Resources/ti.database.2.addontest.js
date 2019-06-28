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
const should = require('./utilities/assertions');

describe('Titanium.Database', function () {
	describe('#executeAsync()', () => {
		it.android('is a function', () => {
			const db = Ti.Database.open('execute_async.db');
			try {
				should(db.executeAsync).be.a.Function;
			} finally {
				db.close();
			}
		});

		it.android('executes asynchronously', function (finish) {
			this.timeout(5000);
			const db = Ti.Database.open('execute_async.db');
			// Execute a query to create a test table
			db.executeAsync('CREATE TABLE IF NOT EXISTS testTable (text TEXT, number INTEGER)', () => {
				// Delete any existing data if the table already existed
				db.executeAsync('DELETE FROM testTable', () => {
					// Define test data
					const testName = 'John Smith';
					const testNumber = 123456789;

					// Insert test data into the table
					db.executeAsync('INSERT INTO testTable (text, number) VALUES (?, ?)', testName, testNumber, () => {
						// Validate that only one row has been affected
						should(db.rowsAffected).be.eql(1);

						// Execute a query to return the rows of the database
						db.executeAsync('SELECT rowid, text, number FROM testTable', rows => {
							try {
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
	});

	describe('#executeAll()', () => {
		it.android('is a function', () => {
			const db = Ti.Database.open('execute_all.db');
			try {
				should(db.executeAll).be.a.Function;
			} finally {
				db.close();
			}
		});

		it.android('executes synchronously', function (finish) {
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
	});

	describe('#executeAllAsync()', () => {
		it('is a function', () => {
			const db = Ti.Database.open('execute_all_async.db');
			try {
				should(db.executeAllAsync).be.a.Function;
			} finally {
				db.close();
			}
		});

		it.android('executes asynchronously', function (finish) {
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
				db.executeAllAsync(queries, results => {
					let rows;
					try {
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
	});
});
