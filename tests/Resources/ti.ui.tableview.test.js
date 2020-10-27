/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2015-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
'use strict';
const should = require('./utilities/assertions');
const utilities = require('./utilities/utilities');

const isCI = Ti.App.Properties.getBool('isCI', false);

describe('Titanium.UI.TableView', function () {
	this.timeout(5000);

	let win;
	afterEach(done => { // fires after every test in sub-suites too...
		if (win && !win.closed) {
			win.addEventListener('close', function listener () {
				win.removeEventListener('close', listener);
				win = null;
				done();
			});
			win.close();
		} else {
			win = null;
			done();
		}
	});

	it.iosBroken('Ti.UI.TableView', function () { // should this be defined?
		should(Ti.UI.TableView).not.be.undefined();
	});

	it('.apiName', function () {
		var tableView = Ti.UI.createTableView();
		should(tableView).have.readOnlyProperty('apiName').which.is.a.String();
		should(tableView.apiName).be.eql('Ti.UI.TableView');
	});

	// FIXME iOS gives wrong apiName for row object
	// FIXME Android fails:
	/*
		Android spits out in logs:

	[WARN]  W/System.err: java.lang.NullPointerException: Attempt to invoke virtual method 'android.content.res.Resources android.content.Context.getResources()' on a null object reference
	[WARN]  W/System.err: 	at android.view.ViewConfiguration.get(ViewConfiguration.java:364)
	[WARN]  W/System.err: 	at android.view.View.<init>(View.java:3788)
	[WARN]  W/System.err: 	at android.view.View.<init>(View.java:3892)
	[WARN]  W/System.err: 	at android.view.ViewGroup.<init>(ViewGroup.java:573)
	[WARN]  W/System.err: 	at android.view.ViewGroup.<init>(ViewGroup.java:569)
	[WARN]  W/System.err: 	at android.view.ViewGroup.<init>(ViewGroup.java:565)
	[WARN]  W/System.err: 	at android.view.ViewGroup.<init>(ViewGroup.java:561)
	[WARN]  W/System.err: 	at android.widget.FrameLayout.<init>(FrameLayout.java:84)
	[WARN]  W/System.err: 	at ti.modules.titanium.ui.widget.tableview.TiTableView.<init>(TiTableView.java:280)
	[WARN]  W/System.err: 	at ti.modules.titanium.ui.widget.TiUITableView.processProperties(TiUITableView.java:111)
	[WARN]  W/System.err: 	at org.appcelerator.kroll.KrollProxy.setModelListener(KrollProxy.java:1219)
	[WARN]  W/System.err: 	at org.appcelerator.titanium.proxy.TiViewProxy.realizeViews(TiViewProxy.java:510)
	[WARN]  W/System.err: 	at org.appcelerator.titanium.proxy.TiViewProxy.handleGetView(TiViewProxy.java:501)
	[WARN]  W/System.err: 	at org.appcelerator.titanium.proxy.TiViewProxy.getOrCreateView(TiViewProxy.java:479)
	[WARN]  W/System.err: 	at ti.modules.titanium.ui.TableViewProxy.getTableView(TableViewProxy.java:152)
	[WARN]  W/System.err: 	at ti.modules.titanium.ui.TableViewProxy.handleAppendSection(TableViewProxy.java:319)
	[WARN]  W/System.err: 	at ti.modules.titanium.ui.TableViewProxy.appendSection(TableViewProxy.java:293)
	[WARN]  W/System.err: 	at org.appcelerator.kroll.runtime.v8.V8Function.nativeInvoke(Native Method)
	[WARN]  W/System.err: 	at org.appcelerator.kroll.runtime.v8.V8Function.callSync(V8Function.java:57)
	[WARN]  W/System.err: 	at org.appcelerator.kroll.runtime.v8.V8Function.call(V8Function.java:43)
	[WARN]  W/System.err: 	at ti.modules.titanium.TitaniumModule$Timer.run(TitaniumModule.java:152)
	[WARN]  W/System.err: 	at android.os.Handler.handleCallback(Handler.java:739)
	[WARN]  W/System.err: 	at android.os.Handler.dispatchMessage(Handler.java:95)
	[WARN]  W/System.err: 	at android.os.Looper.loop(Looper.java:148)
	[WARN]  W/System.err: 	at android.app.ActivityThread.main(ActivityThread.java:5417)
	[WARN]  W/System.err: 	at java.lang.reflect.Method.invoke(Native Method)
	[WARN]  W/System.err: 	at com.android.internal.os.ZygoteInit$MethodAndArgsCaller.run(ZygoteInit.java:726)
	[WARN]  W/System.err: 	at com.android.internal.os.ZygoteInit.main(ZygoteInit.java:616)
	 */
	it.androidAndIosBroken('createTableView', function () {
		var section_0,
			section_1,
			tableView;
		// Validate createTableView()
		should(Ti.UI.createTableView).not.be.undefined();
		should(Ti.UI.createTableView).be.a.Function();

		// Validate createTableViewSection()
		should(Ti.UI.createTableViewSection).not.be.undefined();
		should(Ti.UI.createTableViewSection).be.a.Function();

		// Validate createTableViewRow()
		should(Ti.UI.createTableViewRow).not.be.undefined();
		should(Ti.UI.createTableViewRow).be.a.Function();

		// Create TableView section
		section_0 = Ti.UI.createTableViewSection({ headerTitle: 'Zero' });
		should(section_0).be.a.Object();
		should(section_0.apiName).be.a.String();
		should(section_0.apiName).be.eql('Ti.UI.TableViewSection');

		// Create and add two rows to the section
		section_0.add(Ti.UI.createTableViewRow({ title: 'Red' }));
		section_0.add(Ti.UI.createTableViewRow({ title: 'White' }));
		section_0.add(Ti.UI.createTableViewRow({ title: 'Purple' }));

		// Validate section rowCount
		should(section_0.rowCount).be.eql(3);

		// Validate a section row title
		should(section_0.rows[0].title).be.eql('Red');

		// Create another TableView section
		section_1 = Ti.UI.createTableViewSection({ headerTitle: 'One' });
		should(section_1).be.a.Object();

		// Create and add three rows to the section
		section_1.add(Ti.UI.createTableViewRow({ title: 'Green' }));
		section_1.add(Ti.UI.createTableViewRow({ title: 'Yellow' }));
		section_1.add(Ti.UI.createTableViewRow({ title: 'Blue' }));

		// Validate section row count
		should(section_1.rowCount).be.eql(3);

		// Validate a section row title
		should(section_1.rows[2].title).be.eql('Blue');
		should(section_1.rows[2].apiName).be.a.String();
		should(section_1.rows[2].apiName).be.eql('Ti.UI.TableViewRow'); // iOS says 'Ti.View'

		// Create TableView, set data property
		tableView = Ti.UI.createTableView({
			data: [ section_0 ]
		});
		should(tableView).be.a.Object();
		should(tableView.apiName).be.a.String();
		should(tableView.apiName).be.eql('Ti.UI.TableView');

		// Validate tableView section count
		should(tableView.sectionCount).be.eql(1);

		// Append another section
		tableView.appendSection(section_1);

		// Validate tableView section count
		should(tableView.sectionCount).be.eql(2);
	});

	// FIXME this test crashes ios! Fix the test or open a JIRA!
	// FIXME Also crashes Android, with no stack trace or errors in logcat
	// FIXME Intermittent failure on Windows
	it.allBroken('insertRowAfter', function (finish) {
		var tableView = Ti.UI.createTableView({
			data: [ { title: 'Red' } ]
		});

		win = Ti.UI.createWindow({
			backgroundColor: 'blue'
		});
		win.addEventListener('focus', function () {
			try {
				should(tableView.sectionCount).be.eql(1);
				should(tableView.sections[0]).be.an.Object();
				should(tableView.sections[0].rowCount).be.eql(1);
				should(tableView.sections[0].rows[0].title).be.eql('Red');

				tableView.insertRowAfter(0, { title: 'White' });
				should(tableView.sections[0].rowCount).be.eql(2);
				should(tableView.sections[0].rows[0].title).be.eql('Red');
				should(tableView.sections[0].rows[1].title).be.eql('White');

				tableView.insertRowAfter(0, { title: 'Purple' });
				should(tableView.sections[0].rowCount).be.eql(3);
				should(tableView.sections[0].rows[0].title).be.eql('Red');
				should(tableView.sections[0].rows[1].title).be.eql('Purple');
				should(tableView.sections[0].rows[2].title).be.eql('White');

				finish();
			} catch (err) {
				return finish(err);
			}
			win.close();
		});

		win.add(tableView);
		win.open();
	});

	// FIXME This crashes the app entirely on iOS. Open a JIRA ticket!
	// FIXME Crashes on Android as well.
	it.allBroken('insertRowAfter (TableViewRow)', function (finish) {
		var section_0,
			tableView;

		section_0 = Ti.UI.createTableViewSection({ headerTitle: 'Zero' });
		section_0.add(Ti.UI.createTableViewRow({ title: 'Red' }));

		tableView = Ti.UI.createTableView({
			data: [ section_0 ]
		});

		win = Ti.UI.createWindow({
			backgroundColor: 'blue'
		});
		win.addEventListener('focus', function () {
			try {
				should(tableView.sectionCount).be.eql(1);
				should(tableView.sections[0]).be.an.Object();
				should(tableView.sections[0].rowCount).be.eql(1);
				should(tableView.sections[0].rows[0].title).be.eql('Red');

				tableView.insertRowAfter(0, Ti.UI.createTableViewRow({ title: 'White' }));
				should(tableView.sections[0].rowCount).be.eql(2);
				should(tableView.sections[0].rows[0].title).be.eql('Red');
				should(tableView.sections[0].rows[1].title).be.eql('White');

				tableView.insertRowAfter(0, Ti.UI.createTableViewRow({ title: 'Purple' }));
				should(tableView.sections[0].rowCount).be.eql(3);
				should(tableView.sections[0].rows[0].title).be.eql('Red');
				should(tableView.sections[0].rows[1].title).be.eql('Purple');
				should(tableView.sections[0].rows[2].title).be.eql('White');

				finish();
			} catch (err) {
				finish(err);
			}
			win.close();
		});

		win.add(tableView);
		win.open();
	});

	// FIXME this test crashes ios! Fix the test or open a JIRA!
	// FIXME Crashes Android as well
	// FIXME Occasionally crashes Windows as well
	it.allBroken('insertRowBefore', function (finish) {
		var tableView = Ti.UI.createTableView({
			data: [ { title: 'Red' }, { title: 'White' } ]
		});

		win = Ti.UI.createWindow({
			backgroundColor: 'blue'
		});
		win.addEventListener('focus', function () {
			try {
				should(tableView.sectionCount).be.eql(1);
				should(tableView.sections[0]).be.an.Object();
				should(tableView.sections[0].rowCount).be.eql(2);
				should(tableView.sections[0].rows[0].title).be.eql('Red');
				should(tableView.sections[0].rows[1].title).be.eql('White');

				tableView.insertRowBefore(1, { title: 'Purple' });
				should(tableView.sections[0].rowCount).be.eql(3);
				should(tableView.sections[0].rows[0].title).be.eql('Red');
				should(tableView.sections[0].rows[1].title).be.eql('Purple');
				should(tableView.sections[0].rows[2].title).be.eql('White');

				finish();
			} catch (err) {
				finish(err);
			}
			win.close();
		});

		win.add(tableView);
		win.open();
	});

	// FIXME this test crashes ios! Fix the test or open a JIRA!
	// FIXME Crashes Android as well
	// FIXME Occasionally crashes Windows as well
	it.allBroken('insertRowBefore (TableViewRow)', function (finish) {
		var section_0,
			tableView;
		section_0 = Ti.UI.createTableViewSection({ headerTitle: 'Zero' });
		section_0.add(Ti.UI.createTableViewRow({ title: 'Red' }));
		section_0.add(Ti.UI.createTableViewRow({ title: 'White' }));

		tableView = Ti.UI.createTableView({
			data: [ section_0 ]
		});

		win = Ti.UI.createWindow({
			backgroundColor: 'blue'
		});
		win.addEventListener('focus', function () {
			try {
				should(tableView.sectionCount).be.eql(1);
				should(tableView.sections[0]).be.an.Object();
				should(tableView.sections[0].rowCount).be.eql(2);
				should(tableView.sections[0].rows[0].title).be.eql('Red');
				should(tableView.sections[0].rows[1].title).be.eql('White');

				tableView.insertRowBefore(1, Ti.UI.createTableViewRow({ title: 'Purple' }));
				should(tableView.sections[0].rowCount).be.eql(3);
				should(tableView.sections[0].rows[0].title).be.eql('Red');
				should(tableView.sections[0].rows[1].title).be.eql('Purple');
				should(tableView.sections[0].rows[2].title).be.eql('White');

				finish();
			} catch (err) {
				finish(err);
			}
			win.close();
		});

		win.add(tableView);
		win.open();
	});

	// FIXME this test crashes ios! Fix the test or open a JIRA!
	// FIXME Crashes on Android too
	// FIXME Intermittent failure on Windows
	it.allBroken('add row', function (finish) {
		var tableView = Ti.UI.createTableView({
			data: [ { title: 'Red' } ]
		});

		win = Ti.UI.createWindow({
			backgroundColor: 'blue'
		});
		win.addEventListener('focus', function () {
			try {
				should(tableView.sectionCount).be.eql(1);
				should(tableView.sections[0]).be.an.Object();
				should(tableView.sections[0].rowCount).be.eql(1);
				should(tableView.sections[0].rows[0].title).be.eql('Red');

				tableView.appendRow({ title: 'White' });
				should(tableView.sections[0].rowCount).be.eql(2);
				should(tableView.sections[0].rows[0].title).be.eql('Red');
				should(tableView.sections[0].rows[1].title).be.eql('White');

				tableView.appendRow({ title: 'Purple' });
				should(tableView.sections[0].rowCount).be.eql(3);
				should(tableView.sections[0].rows[0].title).be.eql('Red');
				should(tableView.sections[0].rows[1].title).be.eql('White');
				should(tableView.sections[0].rows[2].title).be.eql('Purple');

				finish();
			} catch (err) {
				finish(err);
			}
			win.close();
		});

		win.add(tableView);
		win.open();
	});

	// FIXME this test crashes ios! Fix the test or open a JIRA!
	// FIXME Occasionally crashes Android as well
	// FIXME Occasionally crashes Windows as well
	it.allBroken('add rows', function (finish) {
		var tableView = Ti.UI.createTableView({
			data: [ { title: 'Red' } ]
		});

		win = Ti.UI.createWindow({
			backgroundColor: 'blue'
		});
		win.addEventListener('focus', function () {
			try {
				should(tableView.sectionCount).be.eql(1);
				should(tableView.sections[0]).be.an.Object();
				should(tableView.sections[0].rowCount).be.eql(1);
				should(tableView.sections[0].rows[0].title).be.eql('Red');

				tableView.appendRow([ { title: 'White' }, { title: 'Purple' } ]);
				should(tableView.sections[0].rowCount).be.eql(3);
				should(tableView.sections[0].rows[0].title).be.eql('Red');
				should(tableView.sections[0].rows[1].title).be.eql('White');
				should(tableView.sections[0].rows[2].title).be.eql('Purple');

				tableView.appendRow({ title: 'Gray' });
				should(tableView.sections[0].rowCount).be.eql(4);
				should(tableView.sections[0].rows[0].title).be.eql('Red');
				should(tableView.sections[0].rows[1].title).be.eql('White');
				should(tableView.sections[0].rows[2].title).be.eql('Purple');
				should(tableView.sections[0].rows[3].title).be.eql('Gray');

				finish();
			} catch (err) {
				finish(err);
			}
			win.close();
		});

		win.add(tableView);
		win.open();
	});

	// FIXME this test crashes ios! Fix the test or open a JIRA!
	// FIXME Crashes on Android too
	// FIXME Fails on Windows too
	it.allBroken('add row (TableViewRow)', function (finish) {
		var section_0,
			tableView;

		section_0 = Ti.UI.createTableViewSection({ headerTitle: 'Zero' });
		section_0.add(Ti.UI.createTableViewRow({ title: 'Red' }));

		tableView = Ti.UI.createTableView({
			data: [ section_0 ]
		});

		win = Ti.UI.createWindow({
			backgroundColor: 'blue'
		});
		win.addEventListener('focus', function () {
			try {
				should(tableView.sectionCount).be.eql(1);
				should(tableView.sections[0]).be.an.Object();
				should(tableView.sections[0].rowCount).be.eql(1);
				should(tableView.sections[0].rows[0].title).be.eql('Red');

				tableView.appendRow(Ti.UI.createTableViewRow({ title: 'White' }));
				should(tableView.sections[0].rowCount).be.eql(2);
				should(tableView.sections[0].rows[1].title).be.eql('White');

				tableView.appendRow(Ti.UI.createTableViewRow({ title: 'Purple' }));
				should(tableView.sections[0].rowCount).be.eql(3);
				should(tableView.sections[0].rows[2].title).be.eql('Purple');

				finish();
			} catch (err) {
				finish(err);
			}
			win.close();
		});

		win.add(tableView);
		win.open();
	});

	// FIXME this test crashes ios! Fix the test or open a JIRA!
	// FIXME Fails intermittently on Android build machine
	// FIXME Fails intermittently on Windows build machine
	it.allBroken('add row (TableViewSection)', function (finish) {
		var section_0,
			tableView;

		section_0 = Ti.UI.createTableViewSection({ headerTitle: 'Zero' });
		section_0.add(Ti.UI.createTableViewRow({ title: 'Red' }));

		tableView = Ti.UI.createTableView({
			data: [ section_0 ]
		});

		win = Ti.UI.createWindow({
			backgroundColor: 'blue'
		});
		win.addEventListener('focus', function () {
			try {
				should(tableView.sectionCount).be.eql(1);
				should(tableView.sections[0]).be.an.Object();
				should(tableView.sections[0].rowCount).be.eql(1);
				should(tableView.sections[0].rows[0].title).be.eql('Red');
				section_0.add(Ti.UI.createTableViewRow({ title: 'White' }));
				should(tableView.sections[0].rowCount).be.eql(2);
				should(tableView.sections[0].rows[1].title).be.eql('White');
				section_0.add(Ti.UI.createTableViewRow({ title: 'Purple' }));
				should(tableView.sections[0].rowCount).be.eql(3);
				should(tableView.sections[0].rows[2].title).be.eql('Purple');

				finish();
			} catch (err) {
				finish(err);
			}
			win.close();
		});

		win.add(tableView);
		win.open();
	});

	// FIXME this test crashes ios! Fix the test or open a JIRA!
	// FIXME Fails on Android on build machine
	// FIXME Fails intermittently on Windows build machine
	it.allBroken('delete row (TableViewRow)', function (finish) {
		var section_0,
			tableView;

		section_0 = Ti.UI.createTableViewSection({ headerTitle: 'Zero' });
		section_0.add(Ti.UI.createTableViewRow({ title: 'Red' }));
		section_0.add(Ti.UI.createTableViewRow({ title: 'White' }));
		section_0.add(Ti.UI.createTableViewRow({ title: 'Purple' }));

		tableView = Ti.UI.createTableView({
			data: [ section_0 ]
		});

		win = Ti.UI.createWindow({
			backgroundColor: 'blue'
		});
		win.addEventListener('focus', function () {
			try {
				should(tableView.sectionCount).be.eql(1);
				should(tableView.sections[0]).be.an.Object();
				should(tableView.sections[0].rowCount).be.eql(3);

				should(tableView.sections[0].rows[1].title).be.eql('White');

				// delete by number
				tableView.deleteRow(1);
				should(tableView.sections[0].rowCount).be.eql(2);
				should(tableView.sections[0].rows[0].title).be.eql('Red');
				should(tableView.sections[0].rows[1].title).be.eql('Purple');

				// delete by row
				tableView.deleteRow(tableView.sections[0].rows[0]);
				should(tableView.sections[0].rowCount).be.eql(1);
				should(tableView.sections[0].rows[0].title).be.eql('Purple');

				tableView.deleteRow(0);
				should(tableView.sections[0].rowCount).be.eql(0);

				finish();
			} catch (err) {
				finish(err);
			}
			win.close();
		});

		win.add(tableView);
		win.open();
	});

	// FIXME this test crashes ios! Fix the test or open a JIRA!
	// FIXME Fails intermittently on Android on build machine
	// FIXME Fails intermittently on Windows on build machine
	it.allBroken('delete row (TableViewSection)', function (finish) {
		var section_0,
			tableView;

		section_0 = Ti.UI.createTableViewSection({ headerTitle: 'Zero' });
		section_0.add(Ti.UI.createTableViewRow({ title: 'Red' }));
		section_0.add(Ti.UI.createTableViewRow({ title: 'White' }));
		section_0.add(Ti.UI.createTableViewRow({ title: 'Purple' }));

		tableView = Ti.UI.createTableView({
			data: [ section_0 ]
		});

		win = Ti.UI.createWindow({
			backgroundColor: 'blue'
		});
		win.addEventListener('focus', function () {
			try {
				should(tableView.sectionCount).be.eql(1);
				should(tableView.sections[0]).be.an.Object();
				should(tableView.sections[0].rowCount).be.eql(3);

				should(tableView.sections[0].rows[1].title).be.eql('White');

				// delete by row
				section_0.remove(tableView.sections[0].rows[1]);
				should(tableView.sections[0].rowCount).be.eql(2);
				should(tableView.sections[0].rows[0].title).be.eql('Red');
				should(tableView.sections[0].rows[1].title).be.eql('Purple');

				finish();
			} catch (err) {
				finish(err);
			}
			win.close();
		});

		win.add(tableView);
		win.open();
	});

	// FIXME get working on iOS
	// FIXME Fails on Android on build machine
	// FIXME Fails intermittently on Windows on build machine
	it.allBroken('update row', function (finish) {
		var section_0,
			tableView;

		section_0 = Ti.UI.createTableViewSection({ headerTitle: 'Zero' });
		section_0.add(Ti.UI.createTableViewRow({ title: 'Red' }));
		section_0.add(Ti.UI.createTableViewRow({ title: 'White' }));
		section_0.add(Ti.UI.createTableViewRow({ title: 'Purple' }));

		tableView = Ti.UI.createTableView({
			data: [ section_0 ]
		});

		win = Ti.UI.createWindow({
			backgroundColor: 'blue'
		});
		win.addEventListener('focus', function () {
			try {
				should(tableView.sections[0].rowCount).be.eql(3);
				tableView.updateRow(1, Ti.UI.createTableViewRow({ title: 'Green' }));
				should(tableView.sections[0].rowCount).be.eql(3);
				should(tableView.sections[0].rows[0].title).be.eql('Red');
				should(tableView.sections[0].rows[1].title).be.eql('Green'); // iOS returns 'White' - updateRow seemed to have no effect?
				should(tableView.sections[0].rows[2].title).be.eql('Purple');

				finish();
			} catch (err) {
				finish(err);
			}
			win.close();
		});

		win.add(tableView);
		win.open();
	});

	// FIXME this test crashes ios! Fix the test or open a JIRA!
	// FIXME Fails intermittently on Android build machine
	it.allBroken('append section', function (finish) {
		var section_0,
			section_1,
			tableView;

		section_0 = Ti.UI.createTableViewSection({ headerTitle: 'Zero' });
		section_0.add(Ti.UI.createTableViewRow({ title: 'Red' }));
		section_0.add(Ti.UI.createTableViewRow({ title: 'White' }));
		section_0.add(Ti.UI.createTableViewRow({ title: 'Purple' }));

		section_1 = Ti.UI.createTableViewSection({ headerTitle: 'One' });
		section_1.add(Ti.UI.createTableViewRow({ title: 'Green' }));
		section_1.add(Ti.UI.createTableViewRow({ title: 'Yellow' }));
		section_1.add(Ti.UI.createTableViewRow({ title: 'Blue' }));

		tableView = Ti.UI.createTableView({
			data: [ section_0 ]
		});

		win = Ti.UI.createWindow({
			backgroundColor: 'blue'
		});
		win.addEventListener('focus', function () {
			try {
				should(tableView.sectionCount).be.eql(1);
				should(tableView.sections[0]).be.eql(section_0);
				should(tableView.sections[0].rows[0].title).be.eql('Red');
				should(tableView.sections[0].rows[1].title).be.eql('White');
				should(tableView.sections[0].rows[2].title).be.eql('Purple');
				tableView.appendSection(section_1);
				should(tableView.sectionCount).be.eql(2);
				should(tableView.sections[0]).be.eql(section_0);
				should(tableView.sections[1]).be.eql(section_1);
				should(tableView.sections[0].rows[0].title).be.eql('Red');
				should(tableView.sections[0].rows[1].title).be.eql('White');
				should(tableView.sections[0].rows[2].title).be.eql('Purple');
				should(tableView.sections[1].rows[0].title).be.eql('Green');
				should(tableView.sections[1].rows[1].title).be.eql('Yellow');
				should(tableView.sections[1].rows[2].title).be.eql('Blue');

				finish();
			} catch (err) {
				finish(err);
			}
			win.close();
		});

		win.add(tableView);
		win.open();
	});

	// FIXME this test crashes ios! Fix the test or open a JIRA!
	// FIXME intermittently fails on Android build machine - I think due to test timeout
	it.allBroken('delete section', function (finish) {
		var section_0,
			section_1,
			tableView;

		section_0 = Ti.UI.createTableViewSection({ headerTitle: 'Zero' });
		section_0.add(Ti.UI.createTableViewRow({ title: 'Red' }));
		section_0.add(Ti.UI.createTableViewRow({ title: 'White' }));
		section_0.add(Ti.UI.createTableViewRow({ title: 'Purple' }));

		section_1 = Ti.UI.createTableViewSection({ headerTitle: 'One' });
		section_1.add(Ti.UI.createTableViewRow({ title: 'Green' }));
		section_1.add(Ti.UI.createTableViewRow({ title: 'Yellow' }));
		section_1.add(Ti.UI.createTableViewRow({ title: 'Blue' }));

		tableView = Ti.UI.createTableView({
			data: [ section_0, section_1 ]
		});

		win = Ti.UI.createWindow({
			backgroundColor: 'blue'
		});
		win.addEventListener('focus', function () {
			try {
				should(tableView.sectionCount).be.eql(2);
				should(tableView.sections[0]).be.eql(section_0);
				should(tableView.sections[1]).be.eql(section_1);
				should(tableView.sections[0].rows[0].title).be.eql('Red');
				should(tableView.sections[0].rows[1].title).be.eql('White');
				should(tableView.sections[0].rows[2].title).be.eql('Purple');
				should(tableView.sections[1].rows[0].title).be.eql('Green');
				should(tableView.sections[1].rows[1].title).be.eql('Yellow');
				should(tableView.sections[1].rows[2].title).be.eql('Blue');

				tableView.deleteSection(1);
				should(tableView.sectionCount).be.eql(1);
				should(tableView.sections[0]).be.eql(section_0);
				should(tableView.sections[0].rows[0].title).be.eql('Red');
				should(tableView.sections[0].rows[1].title).be.eql('White');
				should(tableView.sections[0].rows[2].title).be.eql('Purple');

				tableView.deleteSection(0);
				should(tableView.sectionCount).be.eql(0);

				finish();
			} catch (err) {
				finish(err);
			}
			win.close();
		});

		win.add(tableView);
		win.open();
	});

	// FIXME this test crashes ios! Fix the test or open a JIRA!
	// FIXME Fails on Android on build machine
	it.allBroken('update section', function (finish) {
		var section_0,
			section_1,
			section_2,
			tableView;

		section_0 = Ti.UI.createTableViewSection({ headerTitle: 'Zero' });
		section_0.add(Ti.UI.createTableViewRow({ title: 'Red' }));
		section_0.add(Ti.UI.createTableViewRow({ title: 'White' }));
		section_0.add(Ti.UI.createTableViewRow({ title: 'Purple' }));

		section_1 = Ti.UI.createTableViewSection({ headerTitle: 'One' });
		section_1.add(Ti.UI.createTableViewRow({ title: 'Green' }));
		section_1.add(Ti.UI.createTableViewRow({ title: 'Yellow' }));
		section_1.add(Ti.UI.createTableViewRow({ title: 'Blue' }));

		section_2 = Ti.UI.createTableViewSection({ headerTitle: 'Two' });
		section_2.add(Ti.UI.createTableViewRow({ title: 'Gray' }));
		section_2.add(Ti.UI.createTableViewRow({ title: 'Pink' }));
		section_2.add(Ti.UI.createTableViewRow({ title: 'Magenta' }));

		tableView = Ti.UI.createTableView({
			data: [ section_0, section_1 ]
		});

		win = Ti.UI.createWindow({
			backgroundColor: 'blue'
		});
		win.addEventListener('focus', function () {
			try {
				tableView.updateSection(1, section_2);

				should(tableView.sectionCount).be.eql(2);
				should(tableView.sections[0]).be.eql(section_0);
				should(tableView.sections[1]).be.eql(section_2);
				should(tableView.sections[0].rows[0].title).be.eql('Red');
				should(tableView.sections[0].rows[1].title).be.eql('White');
				should(tableView.sections[0].rows[2].title).be.eql('Purple');
				should(tableView.sections[1].rows[0].title).be.eql('Gray');
				should(tableView.sections[1].rows[1].title).be.eql('Pink');
				should(tableView.sections[1].rows[2].title).be.eql('Magenta');

				tableView.deleteSection(0);
				should(tableView.sectionCount).be.eql(1);
				should(tableView.sections[0]).be.eql(section_2);
				should(tableView.sections[0].rows[0].title).be.eql('Gray');
				should(tableView.sections[0].rows[1].title).be.eql('Pink');
				should(tableView.sections[0].rows[2].title).be.eql('Magenta');

				tableView.deleteSection(0);
				should(tableView.sectionCount).be.eql(0);

				finish();
			} catch (err) {
				finish(err);
			}
			win.close();
		});

		win.add(tableView);
		win.open();
	});

	// FIXME this test crashes ios! Fix the test or open a JIRA!
	// FIXME intermittently fails on Android build machine (timeout?)
	it.iosAndWindowsBroken('insertSectionAfter', function (finish) {
		var section_0,
			section_1,
			section_2,
			tableView;

		section_0 = Ti.UI.createTableViewSection({ headerTitle: 'Zero' });
		section_0.add(Ti.UI.createTableViewRow({ title: 'Red' }));
		section_0.add(Ti.UI.createTableViewRow({ title: 'White' }));
		section_0.add(Ti.UI.createTableViewRow({ title: 'Purple' }));

		section_1 = Ti.UI.createTableViewSection({ headerTitle: 'One' });
		section_1.add(Ti.UI.createTableViewRow({ title: 'Green' }));
		section_1.add(Ti.UI.createTableViewRow({ title: 'Yellow' }));
		section_1.add(Ti.UI.createTableViewRow({ title: 'Blue' }));

		section_2 = Ti.UI.createTableViewSection({ headerTitle: 'Two' });
		section_2.add(Ti.UI.createTableViewRow({ title: 'Gray' }));
		section_2.add(Ti.UI.createTableViewRow({ title: 'Pink' }));
		section_2.add(Ti.UI.createTableViewRow({ title: 'Magenta' }));

		tableView = Ti.UI.createTableView({
			data: [ section_0, section_1 ]
		});

		win = Ti.UI.createWindow({
			backgroundColor: 'blue'
		});
		win.addEventListener('focus', function () {
			try {
				should(tableView.sectionCount).be.eql(2);
				should(tableView.sections[0]).be.eql(section_0);
				should(tableView.sections[1]).be.eql(section_1);
				should(tableView.sections[0].rows[0].title).be.eql('Red');
				should(tableView.sections[0].rows[1].title).be.eql('White');
				should(tableView.sections[0].rows[2].title).be.eql('Purple');
				should(tableView.sections[1].rows[0].title).be.eql('Green');
				should(tableView.sections[1].rows[1].title).be.eql('Yellow');
				should(tableView.sections[1].rows[2].title).be.eql('Blue');
				tableView.insertSectionAfter(0, section_2);
				should(tableView.sectionCount).be.eql(3);
				should(tableView.sections[0]).be.eql(section_0);
				should(tableView.sections[1]).be.eql(section_2);
				should(tableView.sections[2]).be.eql(section_1);
				should(tableView.sections[0].rows[0].title).be.eql('Red');
				should(tableView.sections[0].rows[1].title).be.eql('White');
				should(tableView.sections[0].rows[2].title).be.eql('Purple');
				should(tableView.sections[1].rows[0].title).be.eql('Gray');
				should(tableView.sections[1].rows[1].title).be.eql('Pink');
				should(tableView.sections[1].rows[2].title).be.eql('Magenta');
				should(tableView.sections[2].rows[0].title).be.eql('Green');
				should(tableView.sections[2].rows[1].title).be.eql('Yellow');
				should(tableView.sections[2].rows[2].title).be.eql('Blue');

				finish();
			} catch (err) {
				finish(err);
			}
			win.close();
		});

		win.add(tableView);
		win.open();
	});

	// FIXME this test crashes ios! Fix the test or open a JIRA!
	// FIXME This seems to hang the tests on Android too.
	// FIXME This seems to hang the tests on Windows too.
	/* eslint-disable max-len */
	/*
	Logs from Android:

	[ERROR] TableViewProxy: (main) [24953,24953] Unable to create table view row proxy for object, likely an error in the type of the object passed in...
	[WARN]  W/System.err: java.lang.NullPointerException: Attempt to invoke virtual method 'void ti.modules.titanium.ui.TableViewRowProxy.setParent(org.appcelerator.titanium.proxy.TiViewProxy)' on a null object reference
	[WARN]  W/System.err: 	at ti.modules.titanium.ui.TableViewSectionProxy.insertRowAt(TableViewSectionProxy.java:104)
	[WARN]  W/System.err: 	at ti.modules.titanium.ui.TableViewProxy.handleInsertRowBefore(TableViewProxy.java:445)
	[WARN]  W/System.err: 	at ti.modules.titanium.ui.TableViewProxy.insertSectionBefore(TableViewProxy.java:462)
	[WARN]  W/System.err: 	at org.appcelerator.kroll.runtime.v8.V8Object.nativeFireEvent(Native Method)
	[WARN]  W/System.err: 	at org.appcelerator.kroll.runtime.v8.V8Object.fireEvent(V8Object.java:62)
	[WARN]  W/System.err: 	at org.appcelerator.kroll.KrollProxy.doFireEvent(KrollProxy.java:918)
	[WARN]  W/System.err: 	at org.appcelerator.kroll.KrollProxy.handleMessage(KrollProxy.java:1141)
	[WARN]  W/System.err: 	at org.appcelerator.titanium.proxy.TiViewProxy.handleMessage(TiViewProxy.java:357)
	[WARN]  W/System.err: 	at org.appcelerator.titanium.proxy.TiWindowProxy.handleMessage(TiWindowProxy.java:117)
	[WARN]  W/System.err: 	at ti.modules.titanium.ui.WindowProxy.handleMessage(WindowProxy.java:454)
	[WARN]  W/System.err: 	at android.os.Handler.dispatchMessage(Handler.java:98)
	[WARN]  W/System.err: 	at android.os.Looper.loop(Looper.java:148)
	[WARN]  W/System.err: 	at android.app.ActivityThread.main(ActivityThread.java:5417)
	[WARN]  W/System.err: 	at java.lang.reflect.Method.invoke(Native Method)
	[WARN]  W/System.err: 	at com.android.internal.os.ZygoteInit$MethodAndArgsCaller.run(ZygoteInit.java:726)
	[WARN]  W/System.err: 	at com.android.internal.os.ZygoteInit.main(ZygoteInit.java:616)

	[ERROR] TiApplication: java.lang.RuntimeException: Unable to destroy activity {com.appcelerator.testApp.testing/org.appcelerator.titanium.TiActivity}: java.lang.NullPointerException: Attempt to invoke virtual method 'void ti.modules.titanium.ui.TableViewRowProxy.releaseViews()' on a null object reference
	[ERROR] TiApplication: 	at android.app.ActivityThread.performDestroyActivity(ActivityThread.java:3831)
	[ERROR] TiApplication: 	at android.app.ActivityThread.handleDestroyActivity(ActivityThread.java:3849)
	[ERROR] TiApplication: 	at android.app.ActivityThread.-wrap5(ActivityThread.java)
	[ERROR] TiApplication: 	at android.app.ActivityThread$H.handleMessage(ActivityThread.java:1398)
	[ERROR] TiApplication: 	at android.os.Handler.dispatchMessage(Handler.java:102)
	[ERROR] TiApplication: 	at android.os.Looper.loop(Looper.java:148)
	[ERROR] TiApplication: 	at android.app.ActivityThread.main(ActivityThread.java:5417)
	[ERROR] TiApplication: 	at java.lang.reflect.Method.invoke(Native Method)
	[ERROR] TiApplication: 	at com.android.internal.os.ZygoteInit$MethodAndArgsCaller.run(ZygoteInit.java:726)
	[ERROR] TiApplication: 	at com.android.internal.os.ZygoteInit.main(ZygoteInit.java:616)
	[ERROR] TiApplication: Caused by: java.lang.NullPointerException: Attempt to invoke virtual method 'void ti.modules.titanium.ui.TableViewRowProxy.releaseViews()' on a null object reference
	[ERROR] TiApplication: 	at ti.modules.titanium.ui.TableViewSectionProxy.releaseViews(TableViewSectionProxy.java:153)
	[ERROR] TiApplication: 	at ti.modules.titanium.ui.TableViewProxy.releaseViews(TableViewProxy.java:139)
	[ERROR] TiApplication: 	at org.appcelerator.titanium.proxy.TiViewProxy.releaseViews(TiViewProxy.java:537)
	[ERROR] TiApplication: 	at org.appcelerator.titanium.proxy.TiWindowProxy.closeFromActivity(TiWindowProxy.java:192)
	[ERROR] TiApplication: 	at org.appcelerator.titanium.TiBaseActivity.onDestroy(TiBaseActivity.java:1554)
	[ERROR] TiApplication: 	at org.appcelerator.titanium.TiActivity.onDestroy(TiActivity.java:29)
	[ERROR] TiApplication: 	at android.app.Activity.performDestroy(Activity.java:6407)
	[ERROR] TiApplication: 	at android.app.Instrumentation.callActivityOnDestroy(Instrumentation.java:1142)
	[ERROR] TiApplication: 	at android.app.ActivityThread.performDestroyActivity(ActivityThread.java:3818)
	[ERROR] TiApplication: 	... 9 more
	*/
	/* eslint-enable max-len */
	it.iosAndWindowsBroken('insertSectionBefore', function (finish) {
		var section_0,
			section_1,
			section_2,
			tableView;

		section_0 = Ti.UI.createTableViewSection({ headerTitle: 'Zero' });
		section_0.add(Ti.UI.createTableViewRow({ title: 'Red' }));
		section_0.add(Ti.UI.createTableViewRow({ title: 'White' }));
		section_0.add(Ti.UI.createTableViewRow({ title: 'Purple' }));

		section_1 = Ti.UI.createTableViewSection({ headerTitle: 'One' });
		section_1.add(Ti.UI.createTableViewRow({ title: 'Green' }));
		section_1.add(Ti.UI.createTableViewRow({ title: 'Yellow' }));
		section_1.add(Ti.UI.createTableViewRow({ title: 'Blue' }));

		section_2 = Ti.UI.createTableViewSection({ headerTitle: 'Two' });
		section_2.add(Ti.UI.createTableViewRow({ title: 'Gray' }));
		section_2.add(Ti.UI.createTableViewRow({ title: 'Pink' }));
		section_2.add(Ti.UI.createTableViewRow({ title: 'Magenta' }));

		tableView = Ti.UI.createTableView({
			data: [ section_0, section_1 ]
		});

		win = Ti.UI.createWindow({
			backgroundColor: 'blue'
		});
		win.addEventListener('focus', function () {
			try {
				should(tableView.sectionCount).be.eql(2);
				should(tableView.sections[0]).be.eql(section_0);
				should(tableView.sections[1]).be.eql(section_1);
				should(tableView.sections[0].rows[0].title).be.eql('Red');
				should(tableView.sections[0].rows[1].title).be.eql('White');
				should(tableView.sections[0].rows[2].title).be.eql('Purple');
				should(tableView.sections[1].rows[0].title).be.eql('Green');
				should(tableView.sections[1].rows[1].title).be.eql('Yellow');
				should(tableView.sections[1].rows[2].title).be.eql('Blue');
				tableView.insertSectionBefore(0, section_2);
				should(tableView.sectionCount).be.eql(3);
				should(tableView.sections[0]).be.eql(section_2);
				should(tableView.sections[1]).be.eql(section_0);
				should(tableView.sections[2]).be.eql(section_1);
				should(tableView.sections[0].rows[0].title).be.eql('Gray');
				should(tableView.sections[0].rows[1].title).be.eql('Pink');
				should(tableView.sections[0].rows[2].title).be.eql('Magenta');
				should(tableView.sections[1].rows[0].title).be.eql('Red');
				should(tableView.sections[1].rows[1].title).be.eql('White');
				should(tableView.sections[1].rows[2].title).be.eql('Purple');
				should(tableView.sections[2].rows[0].title).be.eql('Green');
				should(tableView.sections[2].rows[1].title).be.eql('Yellow');
				should(tableView.sections[2].rows[2].title).be.eql('Blue');

				finish();
			} catch (err) {
				finish(err);
			}
			win.close();
		});

		win.add(tableView);
		win.open();
	});

	// Verifies that we don't run into the JNI ref overflow issue on Android
	// FIXME Eventually crashes on Windows Desktop, crashes right away with no output on Phone
	// NOTE: skipping due to memory constrains on our Android 4.4 test device
	it.skip('TIMOB-15765 rev.1', function (finish) { // eslint-disable-line mocha/no-skipped-tests
		var views = [],
			references = 51200, // JNI max is 51200
			error,
			i;

		// create references
		for (i = 0; i < references; i++) {
			views.push(Ti.UI.createView());

			if (!(i % Math.floor(references / 10))) {
				Ti.API.info('creating references... ' + i + '/' + references);
			}
		}

		// validate references
		try {
			should(views.length).be.eql(references);

			for (i = 0; i < references; i++) {
				should(views[i]).not.be.undefined();
				should(views[i]).be.an.Object();
			}

			Ti.API.info('success, created ' + references + ' references!');
		} catch (e) {
			error = e;
		}
		finish(error);
	});

	// NOTE: skipping due to memory constrains on our Android 4.4 test device
	it.skip('TIMOB-15765 rev.2', function (finish) { // eslint-disable-line mocha/no-skipped-tests
		var references = 51200, // JNI max is 51200
			error,
			blob,
			i;

		// create references
		try {
			for (i = 0; i < references; i++) {
				blob = Ti.createBuffer({ length: 1 }).toBlob();

				should(blob).not.be.undefined();
				should(blob).be.an.Object();

				if (!(i % Math.floor(references / 10))) {
					Ti.API.info('creating temporary references... ' + i + '/' + references);
				}
			}
			Ti.API.info('success!');
		} catch (e) {
			error = e;
		}
		finish(error);
	});

	it.ios('Delete row (Search Active)', function (finish) {
		var section_0,
			searchBar,
			tableView,
			isFocused;
		win = Ti.UI.createWindow({ backgroundColor: 'blue' });
		section_0 = Ti.UI.createTableViewSection({ headerTitle: 'Zero' });
		section_0.add(Ti.UI.createTableViewRow({ title: 'Red' }));
		section_0.add(Ti.UI.createTableViewRow({ title: 'White' }));
		section_0.add(Ti.UI.createTableViewRow({ title: 'Purple' }));

		searchBar = Ti.UI.createSearchBar({ showCancel: true });
		tableView = Ti.UI.createTableView({
			data: [ section_0 ],
			search: searchBar
		});

		isFocused = false;

		win.addEventListener('focus', function () {
			var error;

			if (isFocused) {
				return;
			}
			isFocused = true;

			try {
				searchBar.setValue('e');
				searchBar.focus();
				should(tableView.sections[0].rowCount).be.eql(3);
				tableView.deleteRow(0);
				should(tableView.sections[0].rowCount).be.eql(2);
			} catch (err) {
				error = err;
			}
			setTimeout(function () {
				win.close();
				finish(error);
			}, 1000);
		});

		win.add(tableView);
		win.open();
	});

	it('set and clear data', function (finish) {
		var data_a = [
				{ title: 'Square', backgroundSelectedColor: 'red' },
				{ title: 'Circle', backgroundSelectedColor: 'blue' },
				{ title: 'Triangle', backgroundSelectedColor: 'purple' }
			],
			data_b = [
				{ title: 'Red', backgroundSelectedColor: 'red' },
				{ title: 'Green', backgroundSelectedColor: 'green' },
				{ title: 'Blue', backgroundSelectedColor: 'blue' }
			],
			tv = Ti.UI.createTableView(),
			error;

		try {
			tv.data = [];
			tv.setData(data_a);
			tv.data = [];
			tv.setData(data_b);
			tv.data = [];
			tv.setData(data_a);
		} catch (e) {
			error = e;
		}
		finish(error);
	});

	it.windowsMissing('scrollable', function () {
		var tableView = Ti.UI.createTableView({ scrollable: false });
		should(tableView.scrollable).be.be.false();
		tableView.scrollable = !tableView.scrollable;
		should(tableView.scrollable).be.be.true();
	});

	it.ios('#separatorStyle', function () {
		var section_0,
			tableView;
		section_0 = Ti.UI.createTableViewSection({ headerTitle: 'Zero' });
		section_0.add(Ti.UI.createTableViewRow({ title: 'Red' }));
		section_0.add(Ti.UI.createTableViewRow({ title: 'White' }));

		tableView = Ti.UI.createTableView({
			data: [ section_0 ],
			separatorStyle: Ti.UI.TABLE_VIEW_SEPARATOR_STYLE_SINGLE_LINE
		});
		should(tableView.getSeparatorStyle).be.a.Function();
		should(tableView.separatorStyle).eql(Ti.UI.TABLE_VIEW_SEPARATOR_STYLE_SINGLE_LINE);
		should(tableView.getSeparatorStyle()).eql(Ti.UI.TABLE_VIEW_SEPARATOR_STYLE_SINGLE_LINE);
		tableView.setSeparatorStyle(Ti.UI.TABLE_VIEW_SEPARATOR_STYLE_NONE);
		should(tableView.separatorStyle).eql(Ti.UI.TABLE_VIEW_SEPARATOR_STYLE_NONE);
		should(tableView.getSeparatorStyle()).eql(Ti.UI.TABLE_VIEW_SEPARATOR_STYLE_NONE);
	});

	it.ios('#separatorColor', function () {
		var section_0,
			tableView;
		section_0 = Ti.UI.createTableViewSection({ headerTitle: 'Zero' });
		section_0.add(Ti.UI.createTableViewRow({ title: 'Red' }));
		section_0.add(Ti.UI.createTableViewRow({ title: 'White' }));

		tableView = Ti.UI.createTableView({
			data: [ section_0 ],
			separatorColor: 'red'
		});
		should(tableView.getSeparatorColor).be.a.Function();
		should(tableView.separatorColor).eql('red');
		should(tableView.getSeparatorColor()).eql('red');
		tableView.setSeparatorColor('blue');
		should(tableView.separatorColor).eql('blue');
		should(tableView.getSeparatorColor()).eql('blue');
	});

	it.ios('#resultsBackgroundColor', function () {
		var section_0,
			tableView;
		section_0 = Ti.UI.createTableViewSection({ headerTitle: 'Zero' });
		section_0.add(Ti.UI.createTableViewRow({ title: 'Red' }));
		section_0.add(Ti.UI.createTableViewRow({ title: 'White' }));

		tableView = Ti.UI.createTableView({
			data: [ section_0 ],
			resultsBackgroundColor: 'red'
		});
		should(tableView.getResultsBackgroundColor).be.a.Function();
		should(tableView.resultsBackgroundColor).eql('red');
		should(tableView.getResultsBackgroundColor()).eql('red');
	});

	it.ios('#resultsSeparatorColor', function () {
		var section_0,
			tableView;
		section_0 = Ti.UI.createTableViewSection({ headerTitle: 'Zero' });
		section_0.add(Ti.UI.createTableViewRow({ title: 'Red' }));
		section_0.add(Ti.UI.createTableViewRow({ title: 'White' }));

		tableView = Ti.UI.createTableView({
			data: [ section_0 ],
			resultsSeparatorColor: 'red'
		});
		should(tableView.getResultsSeparatorColor).be.a.Function();
		should(tableView.resultsSeparatorColor).eql('red');
		should(tableView.getResultsSeparatorColor()).eql('red');
	});

	it.ios('#resultsSeparatorStyle', function () {
		var section_0,
			tableView;
		section_0 = Ti.UI.createTableViewSection({ headerTitle: 'Zero' });
		section_0.add(Ti.UI.createTableViewRow({ title: 'Red' }));
		section_0.add(Ti.UI.createTableViewRow({ title: 'White' }));

		tableView = Ti.UI.createTableView({
			data: [ section_0 ],
			resultsSeparatorStyle: Ti.UI.TABLE_VIEW_SEPARATOR_STYLE_SINGLE_LINE
		});
		should(tableView.getResultsSeparatorStyle).be.a.Function();
		should(tableView.resultsSeparatorStyle).eql(Ti.UI.TABLE_VIEW_SEPARATOR_STYLE_SINGLE_LINE);
		should(tableView.getResultsSeparatorStyle()).eql(Ti.UI.TABLE_VIEW_SEPARATOR_STYLE_SINGLE_LINE);
	});

	it.windowsMissing('scrollable', function () {
		var tableView = Ti.UI.createTableView({ scrollable: false });
		should(tableView.scrollable).be.be.false();
		tableView.scrollable = !tableView.scrollable;
		should(tableView.scrollable).be.be.true();
	});

	// FIXME Windows throws exception
	it.windowsBroken('Add and remove headerView/footerView ', function (finish) {
		win = Ti.UI.createWindow({ backgroundColor: 'gray' });
		var headerView = Ti.UI.createView({
				backgroundColor: 'red',
				height: 100,
				width: Ti.UI.FILL
			}),
			footerView = Ti.UI.createView({
				backgroundColor: 'green',
				height: 100,
				width: Ti.UI.FILL
			}),
			table = Ti.UI.createTableView({
				headerView: headerView,
				footerView: footerView,
				data: [
					{ title: 'ITEM' }
				]
			});

		win.addEventListener('open', function () {
			should(table.headerView).not.be.null();
			should(table.footerView).not.be.null();

			table.headerView = null;
			table.footerView = null;

			should(table.headerView).be.null();
			should(table.footerView).be.null();

			win.close();
			finish();
		});

		win.add(table);
		win.open();
	});

	it.ios('TIMOB-26164 : updateRow + insertRowAfter causing crash on main thread', function (finish) {
		var tableView = Ti.UI.createTableView({
			data: [ { title: 'Red' } ]
		});

		win = Ti.UI.createWindow({
			backgroundColor: 'blue'
		});
		win.addEventListener('focus', function () {
			try {
				tableView.updateRow(0, { title: 'Green' });
				tableView.insertRowAfter(0, { title: 'White' });

				finish();
			} catch (err) {
				return finish(err);
			}
		});

		win.add(tableView);
		win.open();
	});

	it.android('SearchView persistence', function (finish) {
		var	tableData = [ { title: 'Apples' }, { title: 'Bananas' }, { title: 'Carrots' }, { title: 'Potatoes' } ],
			searchView = Ti.UI.Android.createSearchView(),
			table = Ti.UI.createTableView({
				height: '80%',
				search: searchView,
				data: tableData
			});
		win = Ti.UI.createWindow();
		function removeAndAddTable() {
			try {
				table.removeEventListener('postlayout', removeAndAddTable);
				win.remove(table);
				win.add(table);
				finish();
			} catch (err) {
				finish(err);
			}
		}

		table.addEventListener('postlayout', removeAndAddTable);
		win.add(table);
		win.open();
	});

	it('row#color row#backgroundColor', function (finish) {
		// Set up a TableView with colored rows.
		win = Ti.UI.createWindow();
		const section = Ti.UI.createTableViewSection({ headerTitle: 'Section' });
		const row1 = Ti.UI.createTableViewRow({
			title: 'Row 1',
			color: 'white',
			backgroundColor: 'blue'
		});
		const row2 = Ti.UI.createTableViewRow({
			title: 'Row 2',
			color: 'black',
			backgroundColor: 'yellow'
		});
		section.add(row1);
		section.add(row2);
		const tableView = Ti.UI.createTableView({ data: [ section ] });
		win.add(tableView);

		// Verify row objects return same color values assigned above.
		should(row1.color).be.eql('white');
		should(row1.backgroundColor).be.eql('blue');
		should(row2.color).be.eql('black');
		should(row2.backgroundColor).be.eql('yellow');

		// Open window to test dynamic color changes.
		win.addEventListener('open', function () {
			row1.color = 'red';
			row1.backgroundColor = 'white';
			row2.color = 'white';
			row2.backgroundColor = 'purple';
			setTimeout(function () {
				should(row1.color).be.eql('red');
				should(row1.backgroundColor).be.eql('white');
				should(row2.color).be.eql('white');
				should(row2.backgroundColor).be.eql('purple');
				finish();
			}, 1);
		});
		win.open();
	});

	it('row - read unassigned color properties', function (finish) {
		win = Ti.UI.createWindow();
		const section = Ti.UI.createTableViewSection({ headerTitle: 'Section' });
		const row1 = Ti.UI.createTableViewRow({ title: 'Row 1' });
		section.add(row1);
		const tableView = Ti.UI.createTableView({ data: [ section ] });
		win.add(tableView);

		function validateRow() {
			// Verify we can read row color properties without crashing. (Used to crash on Android.)
			// We don't care about the returned value.
			// eslint-disable-next-line no-unused-vars
			let value;
			value = row1.color;
			value = row1.backgroundColor;
			if (Ti.Android) {
				value = row1.backgroundDisabledColor;
				value = row1.backgroundFocusedColor;
				value = row1.backgroundSelectedColor;
			}
		}
		validateRow();

		win.addEventListener('open', function () {
			validateRow();
			finish();
		});
		win.open();
	});

	it.iosBroken('resize row with Ti.UI.SIZE on content height change', function (finish) {
		var heights = [ 100, 200, 50 ];
		var tableView = Ti.UI.createTableView({});
		var row = Ti.UI.createTableViewRow({
			height: Ti.UI.SIZE,
			width: Ti.UI.FILL
		});
		var view = Ti.UI.createView({
			height: heights.pop(),
			backgroundColor: 'red'
		});
		row.add(view);
		tableView.setData([ row ]);
		tableView.addEventListener('postlayout', function onPostLayout() {
			console.error('postlayout', row.rect.height, view.rect.height);
			should(row.rect.height).be.eql(view.rect.height);
			if (!heights.length) {
				tableView.removeEventListener('postlayout', onPostLayout);
				finish();
			}
			view.height = heights.pop();
		});

		win = Ti.UI.createWindow({
			backgroundColor: 'blue'
		});

		win.add(tableView);
		win.open();
	});

	it('row#rect', function (finish) {
		if (isCI && utilities.isMacOS()) { // FIXME: On macOS CI (maybe < 10.15.6?), times out! Does app need explicit focus added?
			return finish(); // FIXME: skip when we move to official mocha package
		}

		win = Ti.UI.createWindow();
		const tableView = Ti.UI.createTableView();
		const row = Ti.UI.createTableViewRow({
			height: Ti.UI.SIZE,
			width: Ti.UI.FILL
		});
		const view = Ti.UI.createView({
			height: 150,
			backgroundColor: 'yellow'
		});
		row.add(view);
		tableView.setData([ row ]);
		win.add(tableView);

		row.addEventListener('postlayout', function () {
			try {
				should(row.rect.height).be.eql(150);
			} catch (e) {
				return finish(e);
			}
			finish();
		});
		win.open();
	});

	it.ios('rows with vertical or horizontal layout', function (finish) {
		const data = [];
		for (var index = 1; index <= 20; index++) {
			let layout = 'vertical';
			if (index > 10) {
				layout = 'horizontal';
			}
			const row = Ti.UI.createTableViewRow({ layout });
			row.add(Ti.UI.createLabel({ text: `Row ${index}` }));
			data.push(row);
		}
		const table = Ti.UI.createTableView({ data });
		win = Ti.UI.createWindow();

		win.addEventListener('postlayout', function addTableView() {
			win.removeEventListener('postlayout', addTableView);
			try {
				// After adding table, app should not crash
				win.add(table);
			} catch (err) {
				return finish(err);
			}
			finish();
		});
		win.open();
	});

	it('TIMOB-28148 : adding view on row causing crash', function (finish) {
		var row = Ti.UI.createTableViewRow({ title: 'click me' });
		var tableView = Ti.UI.createTableView({
			data: [ row ]
		});

		win = Ti.UI.createWindow({
			backgroundColor: 'blue'
		});
		win.addEventListener('focus', function () {
			setTimeout(function () {
				try {
					const label = Ti.UI.createLabel({ text: 'REQUIRED' });
					row.add(label);
					finish();
				} catch (err) {
					return finish(err);
				}
			}, 2000);
		});

		win.add(tableView);
		win.open();
	});
});
