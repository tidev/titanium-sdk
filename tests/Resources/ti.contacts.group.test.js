/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2015-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
'use strict';
var should = require('./utilities/assertions'),
	utilities = require('./utilities/utilities');

// Intentionally skip on Android, this type doesn't exist
(utilities.isAndroid() ? describe.skip : describe)('Titanium.Contacts.Group', function () {
	// FIXME This holds for permission prompt on iOS and hangs the tests. How can we "click OK" for user?
	(utilities.isIOS() ? it.skip : it)('apiName', function () {
		should(Ti.Contacts.Group).have.a.readOnlyProperty('apiName').which.is.a.String();
		should(Ti.Contacts.Group.apiName).be.eql('Ti.Contacts.Group');
	});

	// FIXME This holds for permission prompt on iOS and hangs the tests. How can we "click OK" for user?
	(utilities.isIOS() ? it.skip : it)('identifier', function () {
		var group = Ti.Contacts.createGroup();
		// must call Ti.Contacts.save to write group!
		should(group.identifier).not.be.undefined();
		// should(group.identifier).be.a.String(); // null until saved?
		// TODO Test read-only
	});

	// FIXME This holds for permission prompt on iOS and hangs the tests. How can we "click OK" for user?
	(utilities.isIOS() ? it.skip : it)('name', function () {
		var group = Ti.Contacts.createGroup({ name: 'example' });
		should(group.name).not.be.undefined();
		should(group.name).be.a.String();
		// TODO Test modifying the name
	});

	// FIXME This holds for permission prompt on iOS and hangs the tests. How can we "click OK" for user?
	(utilities.isIOS() ? it.skip : it)('recordId', function () {
		var group = Ti.Contacts.createGroup();
		should(group.recordId).not.be.undefined();
		// must call Ti.Contacts.save first to get recordId?
		// should(group.recordId).be.a.Number();
		// TODO Number on iOS, String on Windows?
	});

	// FIXME This holds for permission prompt on iOS and hangs the tests. How can we "click OK" for user?
	(utilities.isIOS() ? it.skip : it)('add', function () {
		var group = Ti.Contacts.createGroup();
		should(group.add).be.a.Function();
		// TODO Test the method
		// Handle null/undefined as arg
		// test non-Person as arg
		// test calling without any args
	});

	// FIXME This holds for permission prompt on iOS and hangs the tests. How can we "click OK" for user?
	(utilities.isIOS() ? it.skip : it)('members', function () {
		var group = Ti.Contacts.createGroup();
		should(group.members).be.a.Function();
		should(group.members()).be.an.Array();
		// TODO Test the method
	});

	// FIXME This holds for permission prompt on iOS and hangs the tests. How can we "click OK" for user?
	(utilities.isIOS() ? it.skip : it)('remove', function () {
		var group = Ti.Contacts.createGroup();
		should(group.remove).be.a.Function();
		// TODO Test the method
		// Handle null/undefined as arg
		// test non-Person as arg
		// test calling without any args
	});

	// FIXME This holds for permission prompt on iOS and hangs the tests. How can we "click OK" for user?
	(utilities.isIOS() ? it.skip : it)('sortedMembers', function () {
		var group = Ti.Contacts.createGroup();
		should(group.sortedMembers).be.a.Function();
		should(group.sortedMembers(Ti.Contacts.CONTACTS_SORT_LAST_NAME)).be.an.Array();
		// TODO Test the method
		// Test non Ti.Contants.CONTACTS_SORT values as arg
	});
});
