/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

module.exports = new function() {
	var finish;
	var valueOf;
	this.init = function(testUtils) {
		finish = testUtils.finish;
		valueOf = testUtils.valueOf;
	}

	this.name = "android_contacts";
	this.tests = [
		{name: "modifyContact", timeout: 5000}
	];

	//TIMOB-9589
	this.modifyContact = function(testRun){
		var person = Ti.Contacts.createPerson({
			firstName: 'Aaron',
			lastName: 'Smith'
		}); 
		person.organization = "yahoo";
		valueOf(testRun, person.getFirstName()).shouldBe('Aaron');
		valueOf(testRun, person.getLastName()).shouldBe('Smith');
		valueOf(testRun, person.getOrganization()).shouldBe('yahoo');
		person.firstName = "Ade";
		person.lastName = "Crude";
		person.organization = "google";
		Ti.Contacts.save([person]);
		valueOf(testRun, person.getFirstName()).shouldBe('Ade');
		valueOf(testRun, person.getLastName()).shouldBe('Crude');
		valueOf(testRun, person.getOrganization()).shouldBe('google');

		finish(testRun);
	}
}
