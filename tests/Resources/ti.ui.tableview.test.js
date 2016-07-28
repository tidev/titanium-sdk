/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2015-2016 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

var should = require('./utilities/assertions'),
	utilities = require('./utilities/utilities'),
	didFocus = false;

describe('Titanium.UI.TableView', function () {

	beforeEach(function() {
		didFocus = false;
	});

	it('Ti.UI.TableView', function () {
		should(Ti.UI.TableView).not.be.undefined;
	});

	it('apiName', function () {
		var tableView = Ti.UI.createTableView();
		should(tableView).have.readOnlyProperty('apiName').which.is.a.String;
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
	((utilities.isIOS() || utilities.isAndroid()) ? it.skip : it)('createTableView', function () {

		// Validate createTableView()
		should(Ti.UI.createTableView).not.be.undefined;
		should(Ti.UI.createTableView).be.a.Function;

		// Validate createTableViewSection()
		should(Ti.UI.createTableViewSection).not.be.undefined;
		should(Ti.UI.createTableViewSection).be.a.Function;

		// Validate createTableViewRow()
		should(Ti.UI.createTableViewRow).not.be.undefined;
		should(Ti.UI.createTableViewRow).be.a.Function;

		// Create TableView section
		var section_0 = Ti.UI.createTableViewSection({ headerTitle: 'Zero' });
		should(section_0).be.a.Object;
		should(section_0.apiName).be.a.String;
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
		var section_1 = Ti.UI.createTableViewSection({ headerTitle: 'One' });
		should(section_1).be.a.Object;

		// Create and add three rows to the section
		section_1.add(Ti.UI.createTableViewRow({ title: 'Green' }));
		section_1.add(Ti.UI.createTableViewRow({ title: 'Yellow' }));
		section_1.add(Ti.UI.createTableViewRow({ title: 'Blue' }));

		// Validate section row count
		should(section_1.rowCount).be.eql(3);

		// Validate a section row title
		should(section_1.rows[2].title).be.eql('Blue');
		should(section_1.rows[2].apiName).be.a.String;
		should(section_1.rows[2].apiName).be.eql('Ti.UI.TableViewRow'); // iOS says 'Ti.View'

		// Create TableView, set data property
		var tableView = Ti.UI.createTableView({
			data: [section_0]
		});
		should(tableView).be.a.Object;
		should(tableView.apiName).be.a.String;
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
	((utilities.isIOS() || utilities.isAndroid()) ? it.skip : it)('insertRowAfter', function (finish) {
		var win = Ti.UI.createWindow({
			backgroundColor: 'blue'
		});

		var tableView = Ti.UI.createTableView({
			data: [ { title:'Red' } ]
		});

		win.addEventListener('focus', function () {
			var error;

			if (didFocus) return;
			didFocus = true;

			try {
				should(tableView.sectionCount).be.eql(1);
				should(tableView.sections[0]).be.an.Object;
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

	// FIXME This crashes the app entirely on iOS. Open a JIRA ticket!
	// FIXME Crashes on Android as well.
	((utilities.isIOS() || utilities.isAndroid()) ? it.skip : it)('insertRowAfter (TableViewRow)', function (finish) {
		var win = Ti.UI.createWindow({
			backgroundColor: 'blue'
		});

		var section_0 = Ti.UI.createTableViewSection({ headerTitle: 'Zero' });
		section_0.add(Ti.UI.createTableViewRow({ title: 'Red' }));

		var tableView = Ti.UI.createTableView({
			data: [section_0]
		});

		win.addEventListener('focus', function () {
			var error;

			if (didFocus) return;
			didFocus = true;

			try {
				should(tableView.sectionCount).be.eql(1);
				should(tableView.sections[0]).be.an.Object;
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

	// FIXME this test crashes ios! Fix the test or open a JIRA!
	// FIXME Crashes Android as well
	((utilities.isIOS() || utilities.isAndroid()) ? it.skip : it)('insertRowBefore', function (finish) {
		var win = Ti.UI.createWindow({
			backgroundColor: 'blue'
		});

		var tableView = Ti.UI.createTableView({
			data: [ { title:'Red' }, { title:'White' } ]
		});

		win.addEventListener('focus', function () {
			var error;

			if (didFocus) return;
			didFocus = true;

			try {
				should(tableView.sectionCount).be.eql(1);
				should(tableView.sections[0]).be.an.Object;
				should(tableView.sections[0].rowCount).be.eql(2);
				should(tableView.sections[0].rows[0].title).be.eql('Red');
				should(tableView.sections[0].rows[1].title).be.eql('White');

				tableView.insertRowBefore(1, { title: 'Purple' });
				should(tableView.sections[0].rowCount).be.eql(3);
				should(tableView.sections[0].rows[0].title).be.eql('Red');
				should(tableView.sections[0].rows[1].title).be.eql('Purple');
				should(tableView.sections[0].rows[2].title).be.eql('White');
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

	// FIXME this test crashes ios! Fix the test or open a JIRA!
	// FIXME Crashes Android as well
	((utilities.isIOS() || utilities.isAndroid()) ? it.skip : it)('insertRowBefore (TableViewRow)', function (finish) {
		var win = Ti.UI.createWindow({
			backgroundColor: 'blue'
		});

		var section_0 = Ti.UI.createTableViewSection({ headerTitle: 'Zero' });
		section_0.add(Ti.UI.createTableViewRow({ title: 'Red' }));
		section_0.add(Ti.UI.createTableViewRow({ title: 'White' }));

		var tableView = Ti.UI.createTableView({
			data: [section_0]
		});

		win.addEventListener('focus', function () {
			var error;

			if (didFocus) return;
			didFocus = true;

			try {
				should(tableView.sectionCount).be.eql(1);
				should(tableView.sections[0]).be.an.Object;
				should(tableView.sections[0].rowCount).be.eql(2);
				should(tableView.sections[0].rows[0].title).be.eql('Red');
				should(tableView.sections[0].rows[1].title).be.eql('White');

				tableView.insertRowBefore(1, Ti.UI.createTableViewRow({ title: 'Purple' }));
				should(tableView.sections[0].rowCount).be.eql(3);
				should(tableView.sections[0].rows[0].title).be.eql('Red');
				should(tableView.sections[0].rows[1].title).be.eql('Purple');
				should(tableView.sections[0].rows[2].title).be.eql('White');
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

	// FIXME this test crashes ios! Fix the test or open a JIRA!
	// FIXME Crashes on Android too
	((utilities.isIOS() || utilities.isAndroid()) ? it.skip : it)('add row', function (finish) {
		var win = Ti.UI.createWindow({
			backgroundColor: 'blue'
		});

		var tableView = Ti.UI.createTableView({
			data: [ { title:'Red' } ]
		});

		win.addEventListener('focus', function () {
			var error;

			if (didFocus) return;
			didFocus = true;

			try {
				should(tableView.sectionCount).be.eql(1);
				should(tableView.sections[0]).be.an.Object;
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

	// FIXME this test crashes ios! Fix the test or open a JIRA!
	// FIXME Occasionally crashes Android as well
	((utilities.isIOS() || utilities.isAndroid()) ? it.skip : it)('add rows', function (finish) {
		var win = Ti.UI.createWindow({
			backgroundColor: 'blue'
		});

		var tableView = Ti.UI.createTableView({
			data: [ { title:'Red' } ]
		});

		win.addEventListener('focus', function () {
			var error;

			if (didFocus) return;
			didFocus = true;

			try {
				should(tableView.sectionCount).be.eql(1);
				should(tableView.sections[0]).be.an.Object;
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

	// FIXME this test crashes ios! Fix the test or open a JIRA!
	// FIXME Crashes on Android too
	((utilities.isIOS() || utilities.isAndroid()) ? it.skip : it)('add row (TableViewRow)', function (finish) {
		var win = Ti.UI.createWindow({
			backgroundColor: 'blue'
		});

		var section_0 = Ti.UI.createTableViewSection({ headerTitle: 'Zero' });
		section_0.add(Ti.UI.createTableViewRow({ title: 'Red' }));

		var tableView = Ti.UI.createTableView({
			data: [section_0]
		});

		win.addEventListener('focus', function () {
			var error;

			if (didFocus) return;
			didFocus = true;

			try {
				should(tableView.sectionCount).be.eql(1);
				should(tableView.sections[0]).be.an.Object;
				should(tableView.sections[0].rowCount).be.eql(1);
				should(tableView.sections[0].rows[0].title).be.eql('Red');

				tableView.appendRow(Ti.UI.createTableViewRow({ title: 'White' }));
				should(tableView.sections[0].rowCount).be.eql(2);
				should(tableView.sections[0].rows[1].title).be.eql('White');

				tableView.appendRow(Ti.UI.createTableViewRow({ title: 'Purple' }));
				should(tableView.sections[0].rowCount).be.eql(3);
				should(tableView.sections[0].rows[2].title).be.eql('Purple');
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

	// FIXME this test crashes ios! Fix the test or open a JIRA!
	// FIXME Fails intermittently on Android build machine
	((utilities.isIOS() || utilities.isAndroid()) ? it.skip : it)('add row (TableViewSection)', function (finish) {
		var win = Ti.UI.createWindow({
			backgroundColor: 'blue'
		});

		var section_0 = Ti.UI.createTableViewSection({ headerTitle: 'Zero' });
		section_0.add(Ti.UI.createTableViewRow({ title: 'Red' }));

		var tableView = Ti.UI.createTableView({
			data: [section_0]
		});

		win.addEventListener('focus', function () {
			var error;

			if (didFocus) return;
			didFocus = true;

			try {
				should(tableView.sectionCount).be.eql(1);
				should(tableView.sections[0]).be.an.Object;
				should(tableView.sections[0].rowCount).be.eql(1);
				should(tableView.sections[0].rows[0].title).be.eql('Red');
				section_0.add(Ti.UI.createTableViewRow({ title: 'White' }));
				should(tableView.sections[0].rowCount).be.eql(2);
				should(tableView.sections[0].rows[1].title).be.eql('White');
				section_0.add(Ti.UI.createTableViewRow({ title: 'Purple' }));
				should(tableView.sections[0].rowCount).be.eql(3);
				should(tableView.sections[0].rows[2].title).be.eql('Purple');
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

	// FIXME this test crashes ios! Fix the test or open a JIRA!
	// FIXME Fails on Android on build machine
	((utilities.isIOS() || utilities.isAndroid()) ? it.skip : it)('delete row (TableViewRow)', function (finish) {
		var win = Ti.UI.createWindow({
			backgroundColor: 'blue'
		});

		var section_0 = Ti.UI.createTableViewSection({ headerTitle: 'Zero' });
		section_0.add(Ti.UI.createTableViewRow({ title: 'Red' }));
		section_0.add(Ti.UI.createTableViewRow({ title: 'White' }));
		section_0.add(Ti.UI.createTableViewRow({ title: 'Purple' }));

		var tableView = Ti.UI.createTableView({
			data: [section_0]
		});

		win.addEventListener('focus', function () {
			var error;

			if (didFocus) return;
			didFocus = true;

			try {
				should(tableView.sectionCount).be.eql(1);
				should(tableView.sections[0]).be.an.Object;
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

	// FIXME this test crashes ios! Fix the test or open a JIRA!
	// FIXME Fails intermittently on Android on build machine
	((utilities.isIOS() || utilities.isAndroid()) ? it.skip : it)('delete row (TableViewSection)', function (finish) {
		var win = Ti.UI.createWindow({
			backgroundColor: 'blue'
		});

		var section_0 = Ti.UI.createTableViewSection({ headerTitle: 'Zero' });
		section_0.add(Ti.UI.createTableViewRow({ title: 'Red' }));
		section_0.add(Ti.UI.createTableViewRow({ title: 'White' }));
		section_0.add(Ti.UI.createTableViewRow({ title: 'Purple' }));

		var tableView = Ti.UI.createTableView({
			data: [section_0]
		});

		win.addEventListener('focus', function () {
			var error;

			if (didFocus) return;
			didFocus = true;

			try {
				should(tableView.sectionCount).be.eql(1);
				should(tableView.sections[0]).be.an.Object;
				should(tableView.sections[0].rowCount).be.eql(3);

				should(tableView.sections[0].rows[1].title).be.eql('White');

				// delete by row
				section_0.remove(tableView.sections[0].rows[1]);
				should(tableView.sections[0].rowCount).be.eql(2);
				should(tableView.sections[0].rows[0].title).be.eql('Red');
				should(tableView.sections[0].rows[1].title).be.eql('Purple');
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

	// FIXME get working on iOS
	// FIXME Fails on Android on build machine
	((utilities.isIOS() || utilities.isAndroid()) ? it.skip : it)('update row', function (finish) {
		var win = Ti.UI.createWindow({
			backgroundColor: 'blue'
		});

		var section_0 = Ti.UI.createTableViewSection({ headerTitle: 'Zero' });
		section_0.add(Ti.UI.createTableViewRow({ title: 'Red' }));
		section_0.add(Ti.UI.createTableViewRow({ title: 'White' }));
		section_0.add(Ti.UI.createTableViewRow({ title: 'Purple' }));

		var tableView = Ti.UI.createTableView({
			data: [section_0]
		});

		win.addEventListener('focus', function () {
			var error;

			if (didFocus) return;
			didFocus = true;

			try {
				should(tableView.sections[0].rowCount).be.eql(3);
				tableView.updateRow(1, Ti.UI.createTableViewRow({ title: 'Green' }));
				should(tableView.sections[0].rowCount).be.eql(3);
				should(tableView.sections[0].rows[0].title).be.eql('Red');
				should(tableView.sections[0].rows[1].title).be.eql('Green'); // iOS returns 'White' - updateRow seemed to have no effect?
				should(tableView.sections[0].rows[2].title).be.eql('Purple');
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

	// FIXME this test crashes ios! Fix the test or open a JIRA!
	// FIXME Fails intermittently on Android build machine
	((utilities.isIOS() || utilities.isAndroid()) ? it.skip : it)('append section', function (finish) {
		var win = Ti.UI.createWindow({
			backgroundColor: 'blue'
		});

		var section_0 = Ti.UI.createTableViewSection({ headerTitle: 'Zero' });
		section_0.add(Ti.UI.createTableViewRow({ title: 'Red' }));
		section_0.add(Ti.UI.createTableViewRow({ title: 'White' }));
		section_0.add(Ti.UI.createTableViewRow({ title: 'Purple' }));

		var section_1 = Ti.UI.createTableViewSection({ headerTitle: 'One' });
		section_1.add(Ti.UI.createTableViewRow({ title: 'Green' }));
		section_1.add(Ti.UI.createTableViewRow({ title: 'Yellow' }));
		section_1.add(Ti.UI.createTableViewRow({ title: 'Blue' }));

		var tableView = Ti.UI.createTableView({
			data: [section_0]
		});

		win.addEventListener('focus', function () {
			var error;

			if (didFocus) return;
			didFocus = true;

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

	// FIXME this test crashes ios! Fix the test or open a JIRA!
	// FIXME intermittently fails on Android build machine - I think due to test timeout
	((utilities.isIOS() || utilities.isAndroid()) ? it.skip : it)('delete section', function (finish) {
		var win = Ti.UI.createWindow({
			backgroundColor: 'blue'
		});

		var section_0 = Ti.UI.createTableViewSection({ headerTitle: 'Zero' });
		section_0.add(Ti.UI.createTableViewRow({ title: 'Red' }));
		section_0.add(Ti.UI.createTableViewRow({ title: 'White' }));
		section_0.add(Ti.UI.createTableViewRow({ title: 'Purple' }));

		var section_1 = Ti.UI.createTableViewSection({ headerTitle: 'One' });
		section_1.add(Ti.UI.createTableViewRow({ title: 'Green' }));
		section_1.add(Ti.UI.createTableViewRow({ title: 'Yellow' }));
		section_1.add(Ti.UI.createTableViewRow({ title: 'Blue' }));

		var tableView = Ti.UI.createTableView({
			data: [section_0, section_1]
		});

		win.addEventListener('focus', function () {
			var error;

			if (didFocus) return;
			didFocus = true;

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

	// FIXME this test crashes ios! Fix the test or open a JIRA!
	// FIXME Fails on Android on build machine
	((utilities.isIOS() || utilities.isAndroid()) ? it.skip : it)('update section', function (finish) {
		var win = Ti.UI.createWindow({
			backgroundColor: 'blue'
		});

		var section_0 = Ti.UI.createTableViewSection({ headerTitle: 'Zero' });
		section_0.add(Ti.UI.createTableViewRow({ title: 'Red' }));
		section_0.add(Ti.UI.createTableViewRow({ title: 'White' }));
		section_0.add(Ti.UI.createTableViewRow({ title: 'Purple' }));

		var section_1 = Ti.UI.createTableViewSection({ headerTitle: 'One' });
		section_1.add(Ti.UI.createTableViewRow({ title: 'Green' }));
		section_1.add(Ti.UI.createTableViewRow({ title: 'Yellow' }));
		section_1.add(Ti.UI.createTableViewRow({ title: 'Blue' }));

		var section_2 = Ti.UI.createTableViewSection({ headerTitle: 'Two' });
		section_2.add(Ti.UI.createTableViewRow({ title: 'Gray' }));
		section_2.add(Ti.UI.createTableViewRow({ title: 'Pink' }));
		section_2.add(Ti.UI.createTableViewRow({ title: 'Magenta' }));

		var tableView = Ti.UI.createTableView({
			data: [section_0, section_1]
		});

		win.addEventListener('focus', function () {
			var error;

			if (didFocus) return;
			didFocus = true;

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

	// FIXME this test crashes ios! Fix the test or open a JIRA!
	// FIXME intermittently fails on Android build machine (timeout?)
	((utilities.isIOS() || utilities.isAndroid()) ? it.skip : it)('insertSectionAfter', function (finish) {
		var win = Ti.UI.createWindow({
			backgroundColor: 'blue'
		});

		var section_0 = Ti.UI.createTableViewSection({ headerTitle: 'Zero' });
		section_0.add(Ti.UI.createTableViewRow({ title: 'Red' }));
		section_0.add(Ti.UI.createTableViewRow({ title: 'White' }));
		section_0.add(Ti.UI.createTableViewRow({ title: 'Purple' }));

		var section_1 = Ti.UI.createTableViewSection({ headerTitle: 'One' });
		section_1.add(Ti.UI.createTableViewRow({ title: 'Green' }));
		section_1.add(Ti.UI.createTableViewRow({ title: 'Yellow' }));
		section_1.add(Ti.UI.createTableViewRow({ title: 'Blue' }));

		var section_2 = Ti.UI.createTableViewSection({ headerTitle: 'Two' });
		section_2.add(Ti.UI.createTableViewRow({ title: 'Gray' }));
		section_2.add(Ti.UI.createTableViewRow({ title: 'Pink' }));
		section_2.add(Ti.UI.createTableViewRow({ title: 'Magenta' }));

		var tableView = Ti.UI.createTableView({
			data: [section_0, section_1]
		});

		win.addEventListener('focus', function () {
			var error;

			if (didFocus) return;
			didFocus = true;

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

	// FIXME this test crashes ios! Fix the test or open a JIRA!
	// FIXME This seems to hang the tests on Android too.
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
	((utilities.isIOS() || utilities.isAndroid()) ? it.skip : it)('insertSectionBefore', function (finish) {
		var win = Ti.UI.createWindow({
			backgroundColor: 'blue'
		});

		var section_0 = Ti.UI.createTableViewSection({ headerTitle: 'Zero' });
		section_0.add(Ti.UI.createTableViewRow({ title: 'Red' }));
		section_0.add(Ti.UI.createTableViewRow({ title: 'White' }));
		section_0.add(Ti.UI.createTableViewRow({ title: 'Purple' }));

		var section_1 = Ti.UI.createTableViewSection({ headerTitle: 'One' });
		section_1.add(Ti.UI.createTableViewRow({ title: 'Green' }));
		section_1.add(Ti.UI.createTableViewRow({ title: 'Yellow' }));
		section_1.add(Ti.UI.createTableViewRow({ title: 'Blue' }));

		var section_2 = Ti.UI.createTableViewSection({ headerTitle: 'Two' });
		section_2.add(Ti.UI.createTableViewRow({ title: 'Gray' }));
		section_2.add(Ti.UI.createTableViewRow({ title: 'Pink' }));
		section_2.add(Ti.UI.createTableViewRow({ title: 'Magenta' }));

		var tableView = Ti.UI.createTableView({
			data: [section_0, section_1]
		});

		win.addEventListener('focus', function () {
			var error;

			if (didFocus) return;
			didFocus = true;

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

	// Verifies that we don't run into the JNI ref overflow issue on Android
	it('TIMOB-15765', function () {
		this.timeout(6e4); // minute

		var numberOfTableRowsToTest = 400; // 50 is enough to trigger on Android 4.4.2. 400 hits error on Android 6.0/23

		var vAnswerTable = Ti.UI.createTableView({
			data: [Ti.UI.createTableViewRow({title:'Loading...'})],
		});

		var numOfQuestions = numberOfTableRowsToTest / 5;
		var numOfAnswers = numOfQuestions * 4;
		var sections = [];

		for (var i = 0; i < numOfQuestions; i++) {
			var questionTableSection = Ti.UI.createTableViewSection({});

			var questionRow = Ti.UI.createTableViewRow({});

			questionTableSection.add(questionRow);

			for (var z = 0; z < numOfAnswers; z++) {
				var answerRow = Ti.UI.createTableViewRow({});
				var lAnswer = Ti.UI.createLabel({});

				answerRow.add(lAnswer);
				questionTableSection.add(answerRow);
			}
			sections.push(questionTableSection);
		}

		// Add the sections created above to the table view
		vAnswerTable.setData(sections);

		for (var i = 0; i < vAnswerTable.data.length; i++) {
			Ti.API.info("Here after " + i + " iterations outer loop. Current section: " + vAnswerTable.data[i]);
			for (var k = 0; k < vAnswerTable.data[i].rowCount; k++) {
				Ti.API.info("Here after " + k + " iterations inner loop, " + i + " iterations outer loop. Current section row: "+  vAnswerTable.data[i].rows[k]);
			}
		}
	});
});
