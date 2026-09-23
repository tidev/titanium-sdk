/*
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
'use strict';
const should = require('./utilities/assertions');

// Intentionally skip on Android, this type doesn't exist
// FIXME This holds for permission prompt on iOS and hangs the tests. How can we "click OK" for user?
// FIXME: Need to move from AddressBook framework to Contacts for macOS
describe.allBroken('Titanium.Contacts.Group', function () {
	it('apiName', function () {
		should(Ti.Contacts.Group).have.a.readOnlyProperty('apiName').which.is.a.String();
		should(Ti.Contacts.Group.apiName).be.eql('Ti.Contacts.Group');
	});

	it('identifier', function () {
		var group = Ti.Contacts.createGroup();
		// must call Ti.Contacts.save to write group!
		should(group.identifier).not.be.undefined();
		// should(group.identifier).be.a.String(); // null until saved?
		// TODO Test read-only
	});

	it('name', function () {
		var group = Ti.Contacts.createGroup({ name: 'example' });
		should(group.name).not.be.undefined();
		should(group.name).be.a.String();
		// TODO Test modifying the name
	});

	it('recordId', function () {
		var group = Ti.Contacts.createGroup();
		should(group.recordId).not.be.undefined();
		// must call Ti.Contacts.save first to get recordId?
		// should(group.recordId).be.a.Number();
		// TODO Number on iOS, String on Windows?
	});

	it('add', function () {
		var group = Ti.Contacts.createGroup();
		should(group.add).be.a.Function();
		// TODO Test the method
		// Handle null/undefined as arg
		// test non-Person as arg
		// test calling without any args
	});

	it('members', function () {
		var group = Ti.Contacts.createGroup();
		should(group.members).be.a.Function();
		should(group.members()).be.an.Array();
		// TODO Test the method
	});

	it('remove', function () {
		var group = Ti.Contacts.createGroup();
		should(group.remove).be.a.Function();
		// TODO Test the method
		// Handle null/undefined as arg
		// test non-Person as arg
		// test calling without any args
	});

	it('sortedMembers', function () {
		var group = Ti.Contacts.createGroup();
		should(group.sortedMembers).be.a.Function();
		should(group.sortedMembers(Ti.Contacts.CONTACTS_SORT_LAST_NAME)).be.an.Array();
		// TODO Test the method
		// Test non Ti.Contants.CONTACTS_SORT values as arg
	});
});
