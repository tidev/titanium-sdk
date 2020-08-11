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

describe('Titanium.Contacts', function () {
	it('apiName', function () {
		should(Ti.Contacts.apiName).be.eql('Ti.Contacts');
		should(Ti.Contacts).have.a.readOnlyProperty('apiName').which.is.a.String();
	});

	it('AUTHORIZATION_AUTHORIZED', function () {
		should(Ti.Contacts).have.constant('AUTHORIZATION_AUTHORIZED').which.is.a.Number();
	});

	it('AUTHORIZATION_DENIED', function () {
		should(Ti.Contacts).have.constant('AUTHORIZATION_DENIED').which.is.a.Number();
	});

	it('AUTHORIZATION_RESTRICTED', function () {
		should(Ti.Contacts).have.constant('AUTHORIZATION_RESTRICTED').which.is.a.Number();
	});

	it('AUTHORIZATION_UNKNOWN', function () {
		should(Ti.Contacts).have.constant('AUTHORIZATION_UNKNOWN').which.is.a.Number();
	});

	// FIXME Get working for iOS
	it.iosBroken('CONTACTS_KIND_ORGANIZATION', function () {
		should(Ti.Contacts).have.constant('CONTACTS_KIND_ORGANIZATION').which.is.a.Number();
	});

	// FIXME Get working for iOS
	it.iosBroken('CONTACTS_KIND_PERSON', function () {
		should(Ti.Contacts).have.constant('CONTACTS_KIND_PERSON').which.is.a.Number();
	});

	it('CONTACTS_SORT_FIRST_NAME', function () {
		should(Ti.Contacts).have.constant('CONTACTS_SORT_FIRST_NAME').which.is.a.Number();
	});

	it('CONTACTS_SORT_LAST_NAME', function () {
		should(Ti.Contacts).have.constant('CONTACTS_SORT_LAST_NAME').which.is.a.Number();
	});

	it('contactsAuthorization', function () {
		should(function () {
			should(Ti.Contacts.contactsAuthorization).not.be.undefined();
			should(Ti.Contacts.contactsAuthorization).be.a.Number();
			// should be one of the authorization contants
			should([
				Ti.Contacts.AUTHORIZATION_UNKNOWN,
				Ti.Contacts.AUTHORIZATION_RESTRICTED,
				Ti.Contacts.AUTHORIZATION_DENIED,
				Ti.Contacts.AUTHORIZATION_AUTHORIZED
			]).containEql(Ti.Contacts.contactsAuthorization);
		}).not.throw();
	});

	// Intentionally skip on Android, this methods doesn't exist
	it.androidMissing('createGroup()', function () {
		should(Ti.Contacts.createGroup).be.a.Function();
		// exercising Ti.Contacts.Group creation is done in ti.contacts.group.test.js
	});

	it('createPerson()', function () {
		should(Ti.Contacts.createPerson).be.a.Function();
		// exercising Ti.Contacts.Person creation is done in ti.contacts.person.test.js
	});

	// FIXME This holds for permission prompt on iOS & Windows and hangs the tests. How can we "click OK" for user?
	// Intentionally skip on Android, this methods doesn't exist it.androidMissing
	it.allBroken('getAllGroups()', function () {
		var groups,
			i;
		should(Ti.Contacts.getAllGroups).be.a.Function();
		groups = Ti.Contacts.getAllGroups();
		should(groups).be.an.Array();
		for (i = 0; i < groups.length; i++) {
			should(groups[i]).not.be.null();
			should(groups[i].apiName).be.eql('Ti.Contacts.Group');
		}
	});

	// FIXME This holds for permission prompt on iOS & Windows and hangs the tests. How can we "click OK" for user? it.iosBroken
	// FIXME Android says "Contacts permissions missing" it.androidBroken
	it.allBroken('getAllPeople()', function () {
		var people,
			i;
		should(Ti.Contacts.getAllPeople).be.a.Function();
		people = Ti.Contacts.getAllPeople();
		should(people).be.an.Array();
		for (i = 0; i < people.length; i++) {
			should(people[i]).not.be.null();
			should(people[i].apiName).be.eql('Ti.Contacts.Person');
		}
	});

	// Intentionally skip on Android, these methods don't exist
	it.androidMissing('getGroupByID()', function () {
		should(Ti.Contacts.getGroupByID).be.a.Function();
		// deprecated, do no more for now
	});

	// FIXME This holds for permission prompt on iOS and hangs the tests. How can we "click OK" for user? it.iosBroken
	// Intentionally skip on Android, these methods don't exist it.androidMissing
	((utilities.isIOS() || utilities.isAndroid()) ? it.skip : it)('getGroupByIdentifier()', function () {
		var noGroup;
		should(Ti.Contacts.getGroupByIdentifier).be.a.Function();
		noGroup = Ti.Contacts.getGroupByIdentifier('doesntexist');
		should(noGroup).be.null();
	});

	// FIXME This holds for permission prompt on iOS & Windows and hangs the tests. How can we "click OK" for user?
	// Intentionally skip on Android, these methods don't exist it.androidMissing
	it.allBroken('Group add/remove', function () {
		// Look for existing group and remove it first before we try to create dupe (which fails)
		var allGroups = Ti.Contacts.getAllGroups(),
			group,
			queriedGroup,
			i;
		for (i = 0; i < allGroups.length; i++) {
			if (allGroups[i].name === 'mygroup') {
				Ti.Contacts.removeGroup(allGroups[i]);
				Ti.Contacts.save();
				break;
			}
		}

		group = Ti.Contacts.createGroup({ name: 'mygroup' });
		Ti.Contacts.save();

		queriedGroup = Ti.Contacts.getGroupByIdentifier(group.identifier);
		should(queriedGroup).not.be.null();
		should(queriedGroup.name).be.eql(group.name);
		should(queriedGroup.identifier).be.eql(group.identifier);

		// Now remove the group we created to clean up properly
		Ti.Contacts.removeGroup(group);
		Ti.Contacts.save();

		// Make sure it was removed
		queriedGroup = Ti.Contacts.getGroupByIdentifier(group.identifier);
		should(queriedGroup).be.null();
	});

	// FIXME This holds for permission prompt on iOS & Windows and hangs the tests. How can we "click OK" for user?
	// FIXME Android says "Contacts permissions missing"
	it.allBroken('#getPeopleWithName()', function () {
		should(Ti.Contacts.getPeopleWithName).be.a.Function();
		const smiths = Ti.Contacts.getPeopleWithName('smith');
		should(smiths).be.an.Array();
	});

	// FIXME This holds for permission prompt on iOS & Windows and hangs the tests. How can we "click OK" for user?
	// FIXME Android says property is undefined, not a function
	it.allBroken('#getPersonByIdentifier()', function () {
		should(Ti.Contacts.getPersonByIdentifier).be.a.Function();
		// check for a person by bad identifier
		const noPerson = Ti.Contacts.getPersonByIdentifier('doesntexist');
		should(noPerson).be.null();
	});

	// FIXME This holds for permission prompt on iOS & Windows and hangs the tests. How can we "click OK" for user?
	// FIXME Android says "Contacts permissions missing"
	it.allBroken('Person add/remove', function () {
		// TODO Remove Arthur first if he already exists!

		// create a person
		var person = Ti.Contacts.createPerson({
				firstName: 'Arthur',
				lastName: 'Evans'
			}),
			queriedPerson;
		Ti.Contacts.save();

		// Query for person we created
		queriedPerson = Ti.Contacts.getPersonByIdentifier(person.identifier);
		should(queriedPerson).not.be.null();
		should(queriedPerson.firstName).be.eql(person.firstName);
		should(queriedPerson.lastName).be.eql(person.lastName);
		should(queriedPerson.identifier).be.eql(person.identifier);

		// remove the person
		Ti.Contacts.removePerson(queriedPerson);
		Ti.Contacts.save();

		// Make sure they got removed
		queriedPerson = Ti.Contacts.getPersonByIdentifier(person.identifier);
		should(queriedPerson).be.null();
	});

	// Intentionally skip method that doesn't exist on Android
	it.androidMissing('removeGroup()', function () {
		should(Ti.Contacts.removeGroup).be.a.Function();
		// We exercise removal in Group add/remove
	});

	it('removePerson()', function () {
		should(Ti.Contacts.removePerson).be.a.Function();
		// We exercise removal in Person add/remove
	});

	it('requestContactsPermissions()', function () {
		should(Ti.Contacts.requestContactsPermissions).be.a.Function();
		// TODO Test the method
	});

	// Intentionally skip method that doesn't exist on Android
	it.androidMissing('revert()', function () {
		should(Ti.Contacts.revert).be.a.Function();
		// TODO Test the method
	});

	it('save()', function () {
		should(Ti.Contacts.save).be.a.Function();
		// We exercise save above when we test adding/removing groups and person
	});

	it('showContacts()', function () {
		should(Ti.Contacts.showContacts).be.a.Function();
		// TODO Test the method
	});
	// TODO Test reload event?
});
