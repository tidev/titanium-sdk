/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

module.exports = new function() {
	var finish;
	var valueOf;
	var reportError;
	var watcherId;
	var _addressbook = tizen.contact.getDefaultAddressBook();
	this.init = function(testUtils) {
		finish = testUtils.finish;
		valueOf = testUtils.valueOf;
		reportError = testUtils.reportError;
	}

	this.name = "contacts";
	this.tests = [
		{name: "getDefaultAddressBook"},
		{name: "getAddressBooks"},
		{name: "getAddressBookInvalid"},
		{name: "getContact"},
		{name: "getContactsBatch"},
		{name: "updateContact"},
		{name: "updateBatch"},
		{name: "removeContact"},
		{name: "removeBatch"},
		{name: "find"},
		{name: "addAddressBookChangeListener"},
		{name: "removeAddressbookChangeListener"},
		{name: "convertToString"},
		{name: "cloneContact"},
		{name: "contactName"},
		{name: "contactOrganization"},
		{name: "contactWebsite"},
		{name: "contactAnniversary"},
		{name: "contactAddress"},
		{name: "contactPhoneNumber"},
		{name: "contactEmailAddress"},
		{name: "contactBirthday"},
		{name: "contactPhoto"},
		{name: "contactNote"},
		{name: "isFavorite"},
		{name: "contactRingtoneURI"},
		{name: "contactLastUpdated"},
		{name: "contactAddressBookId"},
		{name: "contactsAuthorization"},
		{name: "createPerson"},
		{name: "getAllGroups"},
		{name: "getAllPeople"},
		{name: "getContactsAuthorization"},
		{name: "getGroupById"},
		{name: "getPeopleWithName"},
		{name: "getPersonById"},
		{name: "removePerson"},
		{name: "saveContact"}
	]

	this.getDefaultAddressBook = function(testRun) {
		var addressbook = tizen.contact.getDefaultAddressBook();
		valueOf(testRun, addressbook.id).shouldBeNull();
		finish(testRun);
	}

	this.getAddressBooks = function(testRun) {
		tizen.contact.getAddressBooks(function(addressbooks){
			var addressbooksCount = addressbooks.length;
			valueOf(testRun, addressbooksCount).shouldBeGreaterThan(0);
			finish(testRun);
		}, function(err){
			reportError(testRun, 'The following error occured: ' + err.message);
		});
		
	}

	this.getAddressBookInvalid = function(testRun) {
		
		valueOf(testRun, function(){
			tizen.contact.getAddressBook(-1);
		}).shouldThrowException();
		finish(testRun);
	}

	this.getContact = function(testRun) {
		var contact = new tizen.Contact({
			name: new tizen.ContactName({
				firstName:'Jeffrey', 
				lastName:'Hyman', 
				nicknames:['joey ramone']
			})
		});
		tizen.contact.getDefaultAddressBook().add(contact);
		valueOf(testRun, function(){tizen.contact.getDefaultAddressBook().get(contact.id)}).shouldNotThrowException();
		finish(testRun);
	}

	this.getContactsBatch = function(testRun) {
		var addressbook = tizen.contact.getDefaultAddressBook();
		addressbook.find(function(contacts){
			var contactsCount = contacts.length, contacts = [], i = 0;
			for (; i < 10; i++) {
				contacts.push(new tizen.Contact({firstName:'Jeffrey' + i, lastName:'Hyman' + i}));
			}
			addressbook.addBatch(contacts, function(){
				addressbook.find(function(contacts){
					valueOf(testRun, contacts.length - contactsCount).shouldBe(10);
					finish(testRun);
				}, function(err){
					reportError(testRun, 'The following error occured: ' + err.message);
				})
			}, function(err) {
				reportError(testRun, 'The following error occured: ' + err.message);
			});
		}, function(err){
			reportError(testRun, 'The following error occured: ' + err.message);
		});
	}

	this.updateContact = function(testRun) {
		var contact = new tizen.Contact({
			name: new tizen.ContactName({
				firstName:'Jeffrey', 
				lastName:'Hyman', 
				nicknames:['joey ramone']
			})
		}), firstName = 'Jeffrey', addressbook = tizen.contact.getDefaultAddressBook();
		
		addressbook.add(contact);
		contact = addressbook.get(contact.id);
		contact.firstName = "Jeffrey updated";
		addressbook.update(contact);
		contact = addressbook.get(contact.id);
		valueOf(testRun, contact.firstName === firstName).shouldBeFalse();
		finish(testRun);
	}

	this.updateBatch = function(testRun) {
		var addressbook = tizen.contact.getDefaultAddressBook();
		addressbook.find(function(contacts){
			var i = 0;
			for (i = 0; i < contacts.length; i++) {
				if ((contacts[i].name) && (contacts[i].name.firstName)) {
					contacts[i].name.firstName = "John";
				}
			}
			addressbook.updateBatch(contacts, function(){
				addressbook.find(function(contacts){
					var flag = true;
					for (i = 0; i < contacts.length; i++) {
						if ((contacts[i].name) && (contacts[i].name.firstName)) {
							if (contacts[i].name.firstName !== "John") {
								flag = false;
								break;
							}
						}
					}
					valueOf(testRun, flag).shouldBeTrue();
					finish(testRun);
				}, function(err){
					reportError(testRun, 'The following error occured: ' + err.message);
				});
			}, function(err) {
				reportError(testRun, 'The following error occured: ' + err.message);
			});
		}, function(err){
			reportError(testRun, 'The following error occured: ' + err.message);
		});
	}

	this.removeContact = function(testRun) {
		var addressbook = tizen.contact.getDefaultAddressBook();
		addressbook.find(function(contacts) {
			var contact = contacts[0], id = contact.id;
			addressbook.remove(id);
			valueOf(testRun, function() {
				addressbook.get(id)
			}).shouldThrowException();
			finish(testRun);
		}, function(err) {
			reportError(testRun, 'The following error occured: ' + err.message);
		});
	}
	
	this.removeBatch = function(testRun) {
		var addressbook = tizen.contact.getDefaultAddressBook();
		addressbook.find(function(contacts) {
			var ids = [];
			for (var i = 0; i < contacts.length; i++) {
				ids.push(contacts[i].id);
			}
			addressbook.removeBatch(ids, function() {
				addressbook.find(function(contacts) {
					valueOf(testRun, contacts.length).shouldBeZero();
					finish(testRun);
				}, function(err) {
					reportError(testRun, 'The following error occured: ' + err.message);
				});
			},  function(err) {
				reportError(testRun, 'The following error occured: ' + err.message);
			})
		},  function(err) {
			reportError(testRun, 'The following error occured: ' + err.message);
		})
	}
	
	this.find = function(testRun) {
		var addressbook = tizen.contact.getDefaultAddressBook(),
			contact = new tizen.Contact({
				name: new tizen.ContactName({
					firstName:'Jeffrey', 
					lastName:'Hyman', 
					nicknames:['joey ramone']
				})
			});
		addressbook.add(contact);
		addressbook.find(function(contacts) {
			valueOf(testRun,  contacts.length).shouldBe(1);
			finish(testRun);
		}, function(err) {
			reportError(testRun, 'The following error occured: ' + err.message);
		});
	}

	this.addAddressBookChangeListener = function(testRun) {
		var counter = 0,
			addressbook = tizen.contact.getDefaultAddressBook(),
			contact = new tizen.Contact({
				name: new tizen.ContactName({
					firstName:'Jeffrey', 
					lastName:'Hyman', 
					nicknames:['joey ramone']
				}),
				categories: ["test"]
			});
		
		watcherId = addressbook.addChangeListener({
			oncontactsadded: function(contacts) {
				counter++;
				valueOf(testRun, counter).shouldBe(1);
			},
			oncontactsupdated: function(contacts) {
				counter++;
				valueOf(testRun, counter).shouldBe(2);
			},
			oncontactsremoved: function(ids) {
				counter++;
				valueOf(testRun, counter).shouldBe(3);
				finish(testRun);
			}
		});
		
		addressbook.add(contact);
		contact = addressbook.get(contact.id);
		contact.firstName = "John";
		addressbook.update(contact);
		addressbook.remove(contact.id);
	}
	
	this.removeAddressbookChangeListener = function(testRun) {
		var addressbook = tizen.contact.getDefaultAddressBook(),
			contact = new tizen.Contact({
				name: new tizen.ContactName({
					firstName:'Jeffrey', 
					lastName:'Hyman', 
					nicknames:['joey ramone']
				}),
				categories: ["test"]
			}), counter = 0;
		
		addressbook.removeChangeListener(watcherId);
		addressbook.add(contact);
		contact = addressbook.get(contact.id);
		contact.firstName = "John";
		addressbook.update(contact);
		addressbook.remove(contact.id);
		valueOf(testRun, counter).shouldBeZero();
		finish(testRun);
	}
	
	this.convertToString = function(testRun) {
		var contact = new tizen.Contact({
				name: new tizen.ContactName({
					firstName:'Jeffrey', 
					lastName:'Hyman', 
					nicknames:['joey ramone']
				}),
				categories: ["test"]
			}), s = "";
		s = contact.convertToString("VCARD_30");
		valueOf(testRun, s.indexOf('Hyman')).shouldBeGreaterThan(0);
		valueOf(testRun, s).shouldBeString();
		finish(testRun);
	}
	
	this.cloneContact = function(testRun) {
		tizen.contact.getDefaultAddressBook().find(function(contacts) {
			var contact = contacts[0], clonedContact = contact.clone();
			valueOf(testRun, clonedContact.id).shouldBeNull();
			finish(testRun);	
		},  function(err) {
			reportError(testRun, 'The following error occured: ' + err.message);
		});
	}
	
	this.contactName = function(testRun) {
		var name = {
				prefix: 'Mr',
				firstName: 'John',
				middleName: 'Glenn',
				lastName: 'Smith',
				nicknames: ['Dee Dee'],
				phoneticFirstName: 'John',
				phoneticLastName: 'Smith'		
			}, 
			contact = new tizen.Contact({
			name: new tizen.ContactName(name)		
		}), status = true, i, j = 0,
		addressbook = tizen.contact.getDefaultAddressBook();
		addressbook.add(contact);
		contact = addressbook.get(contact.id);
		status = ((name.prefix === contact.name.prefix) && (name.firstName === contact.name.firstName) && (name.middleName === contact.name.middleName) && (name.lastName === contact.name.lastName) && (name.nicknames[0] === contact.name.nicknames[0]) && (name.phoneticFirstName === contact.name.phoneticFirstName) && (name.phoneticLastName === contact.name.phoneticLastName));
		valueOf(testRun, status).shouldBeTrue();
		finish(testRun);
	}
	
	this.contactOrganization = function(testRun) {
		var organization = {
			name: 'Intel',
			department: 'department',
			title: 'Director',
			role: 'Programmer',
			logoURI: 'http://upload.wikimedia.org/wikipedia/commons/4/41/Chiswick_Lion.png'
		}, status = true,
		contact = new tizen.Contact({
			organizations: [new tizen.ContactOrganization(organization)]
		});
		_addressbook.add(contact);
		contact = _addressbook.get(contact.id);
		status = ((organization.name === contact.organizations[0].name) && (organization.department === contact.organizations[0].department) && (organization.title === contact.organizations[0].title) && (organization.role === contact.organizations[0].role) && (organization.logoURI === contact.organizations[0].logoURI));
		valueOf(testRun, status).shouldBeTrue();
		finish(testRun);
	}
	
	this.contactWebsite = function(testRun) {
		var website = new tizen.ContactWebSite('http://google.com', 'HOMEPAGE'),
			contact = new tizen.Contact({
				urls: [website]
			}), status = true;
		_addressbook.add(contact);
		contact = _addressbook.get(contact.id);
		status = ((contact.urls[0].url === 'http://google.com') && (contact.urls[0].type === 'HOMEPAGE'));
		valueOf(testRun,  status).shouldBeTrue();
		finish(testRun);
	}

	this.contactAnniversary = function(testRun) {
		var anniv = new tizen.ContactAnniversary(new Date(1986, 11, 2), 'Marriage'),
			contact = new tizen.Contact({
				name: new tizen.ContactName({
					fristName: 'Vasa',
					lastName: 'Pupkin'
				}),
				anniversaries: [anniv]
			}), status = true;
		_addressbook.add(contact);
		contact = _addressbook.get(contact.id);
		status = ((contact.anniversaries[0].date.toString() === new Date(1986, 11, 2).toString()) && (contact.anniversaries[0].label === 'Marriage'));
		valueOf(testRun, status).shouldBeTrue();
		finish(testRun);
	}

	this.contactAddress = function(testRun) {
		var address = new tizen.ContactAddress({
				country: 'Ukraine',
				region: 'Lviv',
				city: 'Lviv',
				streetAddress: 'Kotlyarevsky',
				additionalInformation: 'info',
				postalCode: '77600',
				types: ['HOME']
			}), status = true,
			contact = new tizen.Contact({
				addresses: [address]
			});
		_addressbook.add(contact);
		contact = _addressbook.get(contact.id);
		status = ((address.country === contact.addresses[0].country) && (address.region === contact.addresses[0].region) && (address.city === contact.addresses[0].city) && (address.streetAddress === contact.addresses[0].streetAddress) && (address.additionalInformation === contact.addresses[0].additionalInformation) && (address.postalCode === contact.addresses[0].postalCode) && (address.types[0] === contact.addresses[0].types[0]));
		valueOf(testRun, status).shouldBeTrue();
		finish(testRun);
	}

	this.contactPhoneNumber = function(testRun) {
		var phoneNumber = new tizen.ContactPhoneNumber('123456789', ['WORK']),
			status = true,
			contact = new tizen.Contact({
				phoneNumbers: [phoneNumber]
			});
		_addressbook.add(contact);
		contact = _addressbook.get(contact.id);
		status = ((contact.phoneNumbers[0].number === '123456789') && (contact.phoneNumbers[0].types[0] === 'WORK'));
		valueOf(testRun, status).shouldBeTrue();
		finish(testRun);
	}

	this.contactEmailAddress = function(testRun) {
		var email = new tizen.ContactEmailAddress('user@domain.com', ['WORK','PREF']), status = true,
			contact = new tizen.Contact({
				emails: [email]
			});
		_addressbook.add(contact);
		contact = _addressbook.get(contact.id);
		status = ((contact.emails[0].email === 'user@domain.com') && (contact.emails[0].types[0] === 'WORK'));
		valueOf(testRun, status).shouldBeTrue();
		finish(testRun);
	}

	this.contactBirthday = function(testRun) {
		var contact = new tizen.Contact({
			birthday: new Date(1996, 4, 15)
		}), status = true;
		_addressbook.add(contact);
		contact = _addressbook.get(contact.id);
		status = contact.birthday.toString() === new Date(1996, 4, 15).toString();
		valueOf(testRun, status).shouldBeTrue();
		finish(testRun);
	}
	
	this.contactPhoto = function(testRun) {
		var contact = new tizen.Contact({
			photoURI: 'http://upload.wikimedia.org/wikipedia/commons/4/41/Chiswick_Lion.png'
		});
		_addressbook.add(contact);
		contact = _addressbook.get(contact.id);
		valueOf(testRun, contact.photoURI).shouldBeString();
		finish(testRun);
	}


	this.contactNote = function(testRun) {
		var contact = new tizen.Contact({
			notes: ['test note']
		}), status = true;
		_addressbook.add(contact);
		contact = _addressbook.get(contact.id);
		status = contact.notes[0] === 'test note';
		valueOf(testRun, status).shouldBeTrue();
		finish(testRun);
	}

	this.isFavorite = function(testRun) {
		var contact = new tizen.Contact({
			isFavorite: true,
			name: new tizen.ContactName({
				firstName: 'Vasa'
			})
		});
		_addressbook.add(contact);
		contact = _addressbook.get(contact.id);
		valueOf(testRun,  contact.isFavorite).shouldBeTrue();
		finish(testRun);
	}

	this.contactRingtoneURI = function(testRun) {
		var contact = new tizen.Contact({
			name: new tizen.ContactName({
				fristName: 'Vasa'
			}),
			ringtoneURI: 'file:///opt/media/Sounds/dz_dzo_-_yalta_.mp3'
		});
		_addressbook.add(contact);
		contact = _addressbook.get(contact.id);
		valueOf(testRun, contact.ringtoneURI).shouldBeString();
		finish(testRun);
	}

	this.contactLastUpdated = function(testRun) {
		var contact = new tizen.Contact({
				name: new tizen.ContactName({
					firstName: 'Vasa'
				})
			});
		_addressbook.add(contact);
		contact = _addressbook.get(contact.id);
		valueOf(testRun, contact.lastUpdated).shouldBeObject();
		valueOf(testRun, contact.lastUpdated.toString()).shouldBeString();
		finish(testRun);
	}

	this.contactAddressBookId = function(testRun) {
		var contact = new tizen.Contact({
			name: new tizen.ContactName({
				firstName: 'Vasa'
			})
		});
		_addressbook.add(contact);
		contact = _addressbook.get(contact.id);
		valueOf(testRun, contact.addressBookId).shouldBeString();
		finish(testRun);
	}
	this.contactsAuthorization = function(testRun) {
		valueOf(testRun,  Ti.Contacts.contactsAuthorization).shouldBe(Ti.Contacts.AUTHORIZATION_AUTHORIZED);
		finish(testRun);
	}

	this.createPerson = function(testRun) {
		var person = Ti.Contacts.createPerson({
			firstName: 'John',
			lastName: 'Doe'
		});

		valueOf(testRun, person.id).shouldBeGreaterThan(0);
		valueOf(testRun, person.firstName).shouldBe('John');
		valueOf(testRun, person.lastName).shouldBe('Doe');

		finish(testRun);
	}

	this.getAllGroups = function(testRun) {
		// We need to add contact with category through tizen, because titaium doesn't support it
		var group = Ti.Contacts.createGroup({name: 'test_friends'}),
			groups = Ti.Contacts.getAllGroups();
			status = 0,
			i = 0,
			groupsCount = groups.length;

		for (; i < groupsCount; i++) {
			if (groups[i].name === 'test_friends') {
				status = 1;
				break;
			}
		}

		valueOf(testRun, status).shouldBe(1);

		finish(testRun);
	}

	this.getAllPeople = function(testRun) {
		// Add 10 contacts
		for (var i = 0; i < 10; i++) {
			Ti.Contacts.createPerson({
				firstName: 'John' + i,
				lastName: 'Smith' + i
			});
		}

		Ti.Contacts.Tizen.getAllPeople(function(response) {
			if (response.success) {
				var persons = response.persons;
				valueOf(testRun, persons.length).shouldBeGreaterThan(9);
				finish(testRun);
			} else {
				reportError(testRun, 'The following error occured: ' + response.error);
			}
		});
	}

	this.getContactsAuthorization = function(testRun) {
		valueOf(testRun,  Ti.Contacts.getContactsAuthorization()).shouldBe(Ti.Contacts.AUTHORIZATION_AUTHORIZED);

		finish(testRun);
	}

	this.getGroupById = function(testRun) {
		valueOf(testRun, function() {
			Ti.Contacts.getPersonByID();
		}).shouldThrowException();

		finish(testRun);
	}

	this.getPeopleWithName = function(testRun) {
		// Remove all contacts
		Ti.Contacts.Tizen.getAllPeople(function(response) {
			if (response.success) {
				var i = 0,
					persons = response.persons,
					personsCount = persons.length;

				for (; i < personsCount; i++) {
					Ti.Contacts.removePerson(persons[i]);
				}

				// Add 5 contacts with names John Smith
				for (i = 0; i < 5; i++) {
					Ti.Contacts.createPerson({
						firstName: "John",
						lastName: "Smith"
					});
				}

				// Add 5 contacts with names Mark Duglas
				for (i = 0; i < 5; i++) {
					Ti.Contacts.createPerson({
						firstName: "Mark",
						lastName: "Duglas"
					});
				}

				Ti.Contacts.Tizen.getPeopleWithName("John Smith", 
				function(response){
					if(response.success){
						valueOf(testRun, response.persons.length).shouldBe(5);
						finish(testRun);
					} else {
						reportError(testRun, 'The following error occured: ' + response.error);
					}
				});
			} else {
				reportError(testRun, 'The following error occured: ' + response.error);
			}
		});
	}

	this.getPersonById = function(testRun) {
		var person = Ti.Contacts.createPerson({
				firstName: 'John',
				lastName: 'Smith'
			}),
			person1 = Ti.Contacts.getPersonByID(person.id);

		valueOf(testRun, person1.id).shouldBe(person.id);
		finish(testRun);
	}	

	this.removePerson = function(testRun) {
		var person = Ti.Contacts.createPerson({
				firstName: 'John',
				lastName: 'Smith'
			});
		
		Ti.Contacts.removePerson(person);
		
		valueOf(testRun, function() {
			Ti.Contacts.getPersonByID(person.id);
		}).shouldThrowException();
		finish(testRun);
	}

	this.saveContact = function(testRun) {
		Ti.Contacts.Tizen.getAllPeople(function(response) {
			if (response.success) {
				var i = 0,
					persons = response.persons,
					personsCount = persons.length;

				for (; i < personsCount; i++) {
					Ti.Contacts.removePerson(persons[i]);
				}

				var person = Ti.Contacts.createPerson({
					firstName: 'John',
					lastName: 'Smith'
				});

				person.firstName = 'Oleh';

				Ti.Contacts.save([person]);
				Ti.Contacts.Tizen.getAllPeople(function(response) {
					if (response.success) {
						var persons = response.persons;
						valueOf(testRun, persons.length).shouldBe(1);
						var contact = Ti.Contacts.getPersonByID(person.id);
						valueOf(testRun, contact.firstName).shouldBe('Oleh');
						finish(testRun);
					} else {
						reportError(testRun, 'The following error occured: ' + response.error);
					}
				});
			} else {
				reportError(testRun, 'The following error occured: ' + response.error);
			}
		});
	}
}
