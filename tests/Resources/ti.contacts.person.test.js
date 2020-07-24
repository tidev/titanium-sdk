/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2015-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
'use strict';
var should = require('./utilities/assertions');

// FIXME Every test here fails on Android, likely due to permissions
// FIXME This holds for permission prompt on iOS & Windows and hangs the tests. How can we "click OK" for user?
describe.allBroken('Titanium.Contacts.Person', function () {

	it('apiName', function () {
		should(Ti.Contacts.Person).have.a.readOnlyProperty('apiName').which.is.a.String();
		should(Ti.Contacts.Person.apiName).be.eql('Ti.Contacts.Person');
	});

	it('address', function () {
		var person = Ti.Contacts.createPerson();
		should(person.address).not.be.undefined();
		should(person.address).be.an.Object();
		// TODO Test modifying the address
	});

	it('alternateBirthday', function () {
		var person = Ti.Contacts.createPerson();
		should(person.alternateBirthday).not.be.undefined();
		should(person.alternateBirthday).be.an.Object();
		// TODO Test modifying the alternateBirthday
	});

	it('birthday', function () {
		var person = Ti.Contacts.createPerson();
		should(person.birthday).not.be.undefined();
		should(person.birthday).be.a.String(); // Why isn't this a date?
		// TODO Test modifying the birthday with string value
		// TODO Test modifying the birthday with a date?
	});

	it('created', function () {
		var person = Ti.Contacts.createPerson();
		should(person.created).not.be.undefined();
		should(person.created).be.a.String(); // Why isn't this a date?
		// TODO Test that it is read-only?
	});

	it('date', function () {
		var person = Ti.Contacts.createPerson();
		should(person.date).not.be.undefined();
		should(person.date).be.an.Object();
		// TODO Test modifying the date dictionary?
		// TODO Try unknown keys (known are 'anniversary' and 'other')
		// TODO Test non-string values in the array of values
	});

	it('department', function () {
		var person = Ti.Contacts.createPerson();
		should(person.department).not.be.undefined();
		should(person.department).be.a.String();
		// TODO Test modifying
	});

	it('email', function () {
		var person = Ti.Contacts.createPerson();
		should(person.email).not.be.undefined();
		should(person.email).be.an.Object();
		// TODO Test modifying the email dictionary?
		// TODO Try unknown keys (known are 'home', 'work' and 'other')
		// TODO Test non-string values in the array of values
	});

	it('firstName', function () {
		var person = Ti.Contacts.createPerson();
		should(person.firstName).not.be.undefined();
		should(person.firstName).be.a.String();
		// TODO Test modifying
	});

	it('firstPhonetic', function () {
		var person = Ti.Contacts.createPerson();
		should(person.firstPhonetic).not.be.undefined();
		should(person.firstPhonetic).be.a.String();
		// TODO Test modifying
	});

	it('fullName', function () {
		var person = Ti.Contacts.createPerson();
		should(person.fullName).not.be.undefined();
		should(person.fullName).be.a.String();
		// TODO Test modifying? Says read-only
	});

	it('id', function () {
		var person = Ti.Contacts.createPerson();
		should(person.id).not.be.undefined();
		// TODO id would be null unless we're grabbing one from a query!
		//			if (utilities.isAndroid()) {
		//				should(person.id).be.a.Number();
		//			} else {
		//				// is this property even available on iOS?
		//				should(person.id).be.a.String();
		//			}
		// TODO Test read-only
	});

	it('identifier', function () {
		var person = Ti.Contacts.createPerson();
		should(person.identifier).not.be.undefined();
		// TODO identifier would be null unless we're grabbing one from a query!
		// is this property even available on Android?
		//			should(person.identifier).be.a.String();
		// TODO Test read-only
	});

	it('image', function () {
		var person = Ti.Contacts.createPerson();
		should(person.image).not.be.undefined();
		// should(person.image).be.an.Object();
		// TODO Test image is a blob
	});

	it('instantMessage', function () {
		var person = Ti.Contacts.createPerson();
		should(person.instantMessage).not.be.undefined();
		should(person.instantMessage).be.an.Object();
		// TODO Test modifying the instantMessage dictionary?
		// TODO Try unknown keys (known are 'home', 'work' and 'other')
		// TODO Test non-object values in the array of values
		// TODO Test unknown keys in the objects (known are 'service' and 'username')
		// TODO Test non-string values for the service/username
	});

	it('jobTitle', function () {
		var person = Ti.Contacts.createPerson();
		should(person.jobTitle).not.be.undefined();
		should(person.jobTitle).be.a.String();
		// TODO Test modifying?
	});

	it('kind', function () {
		var person = Ti.Contacts.createPerson();
		should(person.kind).not.be.undefined();
		should(person.kind).be.a.Number();
		// TODO Test modifying?
		// TODO Verify it's Ti.Contacts.CONTACTS_KIND_PERSON
		should(person.kind).eql(Ti.Contacts.CONTACTS_KIND_PERSON);
	});

	it('lastName', function () {
		var person = Ti.Contacts.createPerson();
		should(person.lastName).not.be.undefined();
		should(person.lastName).be.a.String();
		// TODO Test modifying
	});

	it('lastPhonetic', function () {
		var person = Ti.Contacts.createPerson();
		should(person.lastPhonetic).not.be.undefined();
		should(person.lastPhonetic).be.a.String();
		// TODO Test modifying
	});

	it('middleName', function () {
		var person = Ti.Contacts.createPerson();
		should(person.middleName).not.be.undefined();
		should(person.middleName).be.a.String();
		// TODO Test modifying
	});

	it('middlePhonetic', function () {
		var person = Ti.Contacts.createPerson();
		should(person.middlePhonetic).not.be.undefined();
		should(person.middlePhonetic).be.a.String();
		// TODO Test modifying
	});

	it('modified', function () {
		var person = Ti.Contacts.createPerson();
		should(person.modified).not.be.undefined();
		should(person.modified).be.a.String(); // Why isn't this a date?
		// TODO Test that it is read-only?
	});

	it('nickname', function () {
		var person = Ti.Contacts.createPerson();
		should(person.nickname).not.be.undefined();
		should(person.nickname).be.a.String();
		// TODO Test modifying
	});

	it('note', function () {
		var person = Ti.Contacts.createPerson();
		should(person.note).not.be.undefined();
		should(person.note).be.a.String();
		// TODO Test modifying
	});

	it('organization', function () {
		var person = Ti.Contacts.createPerson();
		should(person.organization).not.be.undefined();
		should(person.organization).be.a.String();
		// TODO Test modifying
	});

	it('phone', function () {
		var person = Ti.Contacts.createPerson();
		should(person.phone).not.be.undefined();
		should(person.phone).be.an.Object();
		// TODO Test modifying the phone dictionary?
		// TODO Try unknown keys (known are home, work, other, mobile, pager, workFax, homeFax, main, and/or iPhone.)
		// TODO Test non-string values in the array of values
	});

	it('prefix', function () {
		var person = Ti.Contacts.createPerson();
		should(person.prefix).not.be.undefined();
		should(person.prefix).be.a.String();
		// TODO Test modifying Docs say read-only?
	});

	it('recordId', function () {
		var person = Ti.Contacts.createPerson();
		should(person.recordId).not.be.undefined();
		// TODO recordId would be null unless we're grabbing one from a query!
		// should(person.recordId).be.a.Number();
		// TODO Number on iOS, deprecated. Looks like Android has equivalent in 'id'? iOS moved to 'identifier' as String, which matches Windows
	});

	it('relatedNames', function () {
		var person = Ti.Contacts.createPerson();
		should(person.relatedNames).not.be.undefined();
		should(person.relatedNames).be.an.Object();
		// TODO Test modifying the relatedNames dictionary?
		// TODO Try unknown keys (known are mother, father, parent, brother, sister, child, friend, spouse, partner, assistant, manager, and/or other.)
		// TODO Test non-string values in the array of values
	});

	it('socialProfile', function () {
		var person = Ti.Contacts.createPerson();
		should(person.socialProfile).not.be.undefined();
		should(person.socialProfile).be.an.Object();
		// TODO Test modifying the socialProfile dictionary?
		// TODO Try unknown keys (known are home, work and/or other.)
		// TODO Test unknown keys in the objects (known are 'service' and 'username')
		// TODO Test non-string values for the service/username
	});

	it('suffix', function () {
		var person = Ti.Contacts.createPerson();
		should(person.suffix).not.be.undefined();
		should(person.suffix).be.a.String();
		// TODO Test modifying Docs say read-only?
	});

	it('url', function () {
		var person = Ti.Contacts.createPerson();
		should(person.url).not.be.undefined();
		should(person.url).be.an.Object();
		// TODO Test modifying the url dictionary?
		// TODO Try unknown keys (known are homepage, home, work, and/or other.)
		// TODO Test non-string values in the array of values
	});
});
