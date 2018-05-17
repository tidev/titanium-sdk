/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2015-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* global Ti */
/* eslint no-unused-expressions: "off" */
'use strict';
var should = require('./utilities/assertions');

describe('Titanium.UI.TableView', function () {
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
		should(tableView.getSeparatorStyle).be.a.Function;
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
		should(tableView.getSeparatorColor).be.a.Function;
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
		should(tableView.getResultsBackgroundColor).be.a.Function;
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
		should(tableView.getResultsSeparatorColor).be.a.Function;
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
		should(tableView.getResultsSeparatorStyle).be.a.Function;
		should(tableView.resultsSeparatorStyle).eql(Ti.UI.TABLE_VIEW_SEPARATOR_STYLE_SINGLE_LINE);
		should(tableView.getResultsSeparatorStyle()).eql(Ti.UI.TABLE_VIEW_SEPARATOR_STYLE_SINGLE_LINE);
	});

	it.windowsMissing('scrollable', function () {
		var tableView = Ti.UI.createTableView({ scrollable: false });
		should(tableView.scrollable).be.eql(false);
		tableView.scrollable = !tableView.scrollable;
		should(tableView.scrollable).be.eql(true);
	});
});
