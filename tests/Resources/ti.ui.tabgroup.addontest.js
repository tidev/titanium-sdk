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
const should = require('./utilities/assertions'); // eslint-disable-line no-unused-vars

// skipping many test on Windows due to lack of event firing, see https://jira.appcelerator.org/browse/TIMOB-26690
describe('Titanium.UI.TabGroup', () => {

	it('title after drawing the TabGroup', () => {
		var winA = Ti.UI.createWindow(),
			winB = Ti.UI.createWindow(),
			tabA = Ti.UI.createTab({ title: 'titleA', window: winA }),
			tabB = Ti.UI.createTab({ title: 'titleB', window: winB }),
			tabGroup = Ti.UI.createTabGroup({ tabs: [ tabA, tabB ] });
		tabGroup.addEventListener('open', () => {
			tabGroup.title = 'newTitle';
			tabGroup.setActiveTab(tabB);
		});
		tabB.addEventListener('selected', () => {
			should(tabGroup.title).be.a.String;
			should(tabGroup.title).eql('newTitle');
		});
	});

});
